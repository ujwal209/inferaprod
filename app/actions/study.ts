'use server'

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

import { getGeminiModel } from './agent/providers';
import { uiTools } from './agent/tools';
import { STUDY_PROMPT } from './agent/prompts';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==========================================
// SESSION MANAGEMENT
// ==========================================

export async function initializeSession(title: string, initData?: { subject: string, level: string }) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const sessionTitle = initData ? `Study: ${initData.subject}` : (title || "New Session").slice(0, 35) + '...';
  const { data: session } = await supabaseAdmin
    .from('study_sessions')
    .insert({ 
      user_id: user.id, 
      title: sessionTitle, 
      subject: initData?.subject, 
      level: initData?.level 
    })
    .select().single();
    
  return session.id;
}

export async function getStudySessions() {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return [];
  
  const { data } = await supabaseAdmin
    .from('study_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
    
  return data || [];
}

export async function getStudyMessages(sessionId: string) {
  const { data } = await supabaseAdmin
    .from('study_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
    
  return data || [];
}

export async function deleteStudySession(id: string) { 
  await supabaseAdmin.from('study_sessions').delete().eq('id', id); 
}

export async function renameStudySession(id: string, title: string) { 
  await supabaseAdmin.from('study_sessions').update({ title }).eq('id', id); 
}

export async function archiveStudySession(id: string) {
  await supabaseAdmin.from('study_sessions').update({ is_archived: true }).eq('id', id);
}

export async function shareStudySession(id: string) {
  await supabaseAdmin.from('study_sessions').update({ is_shared: true }).eq('id', id);
}

export async function getStudySessionById(id: string) {
  const { data } = await supabaseAdmin
    .from('study_sessions')
    .select('id, user_id, title, status, is_shared')
    .eq('id', id)
    .single();
  return data;
}

export async function duplicateStudySession(sessionId: string) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: originalSession } = await supabaseAdmin
    .from('study_sessions')
    .select('title, subject, level')
    .eq('id', sessionId)
    .single();

  const title = originalSession?.title || "Cloned Study Session";

  const { data: newSession, error: sErr } = await supabaseAdmin
    .from('study_sessions')
    .insert({ user_id: user.id, title: `Clone: ${title.replace('...', '')}`, subject: originalSession?.subject, level: originalSession?.level })
    .select().single();

  if (sErr || !newSession) throw new Error("Failed to create new session");

  const { data: messages } = await supabaseAdmin
    .from('study_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (messages && messages.length > 0) {
    const messagesToInsert = messages.map(m => ({
      session_id: newSession.id,
      role: m.role,
      content: m.content
    }));
    await supabaseAdmin.from('study_messages').insert(messagesToInsert);
  }

  const { data: progress } = await supabaseAdmin
    .from('study_progress')
    .select('topic, mastery_percentage, completed_concepts, total_quizzes_taken, avg_quiz_score')
    .eq('session_id', sessionId);
    
  if (progress && progress.length > 0) {
    const pToInsert = progress.map(p => ({
       session_id: newSession.id,
       ...p
    }));
    await supabaseAdmin.from('study_progress').insert(pToInsert);
  }

  return newSession.id;
}

// ==========================================
// 🚀 NATIVE LANGGRAPH AGENT ROUTER
// ==========================================

export async function sendStudyMessage(
  sessionId: string, 
  content: string, 
  fileUrls: string[] = [], 
  options?: { webSearch?: boolean, deepThink?: boolean },
  truncateIndex?: number
) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: pastMessages } = await supabaseAdmin
    .from('study_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
    
  let dbHistory = pastMessages || [];

  if (typeof truncateIndex === 'number' && truncateIndex < dbHistory.length) {
    const idsToDelete = dbHistory.slice(truncateIndex).map(m => m.id);
    await supabaseAdmin.from('study_messages').delete().in('id', idsToDelete);
    dbHistory = dbHistory.slice(0, truncateIndex);
  }

  // 🚀 Convert History to LangChain Core Messages
  const langchainHistory: BaseMessage[] = dbHistory.slice(-10).map(m => {
    let text = m.content;
    if (typeof text === 'string' && text.length > 8000) {
      text = text.substring(0, 8000) + "... [Content Truncated]";
    }
    return m.role === 'user' ? new HumanMessage(text) : new AIMessage(text);
  });

  // 🚀 Orchestration Context Engine
  const userMsgCount = dbHistory.filter(m => m.role === 'user').length + 1;
  const lastLower = content.trim().toLowerCase();
  
  const greetings = ["hi", "hello", "hey", "howdy", "sup", "what's up", "good morning", "good evening"];
  const isGreeting = greetings.some(g => lastLower.startsWith(g)) && lastLower.length < 30;
  const isSyllabusFirst = userMsgCount === 1 && !isGreeting;
  const isMarkDone = content.includes("I've understood this, move to next");
  
  const quizKeywords = ["quiz me", "test me", "give me a quiz", "take a quiz", "knowledge check", "test my knowledge", "quiz"];
  const wantsQuiz = quizKeywords.some(kw => lastLower.includes(kw));
  
  const progressKeywords = ["show my progress", "my progress", "track my progress", "progress tracker", "how far", "mastery"];
  const wantsProgress = progressKeywords.some(kw => lastLower.includes(kw)) && !isMarkDone;

  const roadmapKeywords = ["roadmap", "syllabus", "study plan", "curriculum", "what's next"];
  const wantsRoadmap = roadmapKeywords.some(kw => lastLower.includes(kw));

  let injection = "\n\n[ORCHESTRATION CONTEXT]\n";
  if (isGreeting) {
    injection += "MODE: GREETING. Respond warmly and casually. Ask what topic they want to study. Do NOT use tools/widgets.";
  } else if (isSyllabusFirst || wantsRoadmap) {
    injection += "MODE: SYLLABUS. " + (wantsRoadmap ? "The user requested the roadmap. " : "This is the start of a new topic. ") + "You MUST provide a clear, comprehensive syllabus (roadmap) for the requested topic. Ask if they want to modify it or start with the first concept. 100% mastery will only be reached when this entire syllabus is covered.";
  } else if (wantsQuiz) {
    injection += "MODE: QUIZ. Call the QuizWidget tool NOW. YOU MUST generate 10 questions. DO NOT RETURN AN EMPTY ARRAY [] FOR THE QUESTIONS FIELD! Provide real question objects. Do NOT provide any other text.";
  } else if (wantsProgress) {
    injection += "MODE: PROGRESS. Call the ProgressWidget tool NOW. Calculate masteryPercentage strictly based on progress through the syllabus (completed / total * 100). DO NOT RETURN AN EMPTY ARRAY [] FOR completedConcepts. Provide actual strings. Do NOT provide any other text.";
  } else if (isMarkDone) {
    injection += "MODE: NEXT TOPIC. The user finished a concept. Acknowledge and immediately move to the next item in the syllabus. Provide a focused technical tutorial. NO WIDGETS.";
  } else {
    injection += "MODE: TEACHING. Provide technical teaching for the current concept using the formatting rules (Summary -> Body -> No final question). Focus on clarity and technical accuracy. Do NOT show widgets.";
  }

  const finalSystemPrompt = STUDY_PROMPT + injection;

  // File UI Markdown & Multimodal Preparation
  let hasPdf = false;
  let hasImage = false;
  const currentMessageParts: any[] = [{ type: 'text', text: content }];
  const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
  let fileMarkdown = "";

  for (const url of fileUrls) {
    const ext = url.split('.').pop()?.toLowerCase() || '';
    const fileName = url.split('/').pop() || "Document";
    
    if (ext === 'pdf') {
      hasPdf = true;
      fileMarkdown += `\n\n[📁 Attached File: ${fileName}](${url})`;
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        currentMessageParts.push({ 
          type: 'media', 
          mimeType: 'application/pdf',
          data: Buffer.from(arrayBuffer).toString('base64') 
        });
      } catch (e) { 
        console.error("PDF Fetch Error:", e); 
      }
    } else if (imageExtensions.includes(ext)) {
      hasImage = true;
      fileMarkdown += `\n\n![${fileName}](${url})`;
      currentMessageParts.push({ type: 'image_url', image_url: { url } });
    }
  }

  const fullUserContent = content + fileMarkdown;
  await supabaseAdmin.from('study_messages').insert({ session_id: sessionId, role: 'user', content: fullUserContent });
  
  const systemMessage = new SystemMessage(finalSystemPrompt);
  const currentUserMessage = new HumanMessage({ content: currentMessageParts });
  const inputMessages = [systemMessage, ...langchainHistory, currentUserMessage];

  let finalContent = "";
  
  try {
    // 🚀 INTELLIGENT MODEL ROUTER - FORCED TO GEMINI AS REQUESTED
    console.log("🧠 Routing to Gemini Pro 2.5 Flash (Mastery Engine)");
    const llmToUse = getGeminiModel();

    // 🚀 NATIVE TOOL BINDING
    const modelWithTools = llmToUse.bindTools(uiTools);
    
    let aiMessage: AIMessage;
    try {
      aiMessage = await modelWithTools.invoke(inputMessages);
    } catch (apiErr: any) {
      console.warn("⚠️ Primary Model Failed (API Limit/Tool bind). Healing...");
      const fallbackLlm = getGeminiModel();
      aiMessage = await fallbackLlm.bindTools(uiTools).invoke(inputMessages);
    }

    finalContent = typeof aiMessage.content === 'string' ? aiMessage.content : "";

    // Safely extract UI tool calls to append as chameleon blocks
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      for (const call of aiMessage.tool_calls) {
        if (call.name === 'QuizWidget' || call.name === 'ProgressWidget') {
          finalContent += `\n\n\`\`\`json?chameleon\n${JSON.stringify({ component: call.name, props: call.args }, null, 2)}\n\`\`\`\n`;
        }
      }
    } else if (typeof aiMessage.content !== 'string') {
       try { finalContent = JSON.stringify(aiMessage.content); } catch (e) {}
    }

    if (!aiMessage.tool_calls?.length && finalContent.includes('"component": "QuizWidget"')) {
        const match = finalContent.match(/```json\n([\s\S]*?)```/);
        if (match) {
            finalContent = finalContent.replace('```json\n', '```json?chameleon\n');
        }
    }

  } catch (error: any) {
    console.error("Agent Engine Error:", error);
    finalContent = `### ⨯ Connection Disrupted\nFailed to reach the AI Engine natively. \n**Details:** ${error.message}`;
  }

  try {
    // Save Assistant response to DB
    await supabaseAdmin.from('study_messages').insert({ session_id: sessionId, role: 'assistant', content: finalContent });
    await supabaseAdmin.from('study_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);
  } catch (dbErr) {
    console.error("Failed to save study message to DB:", dbErr);
  }
  
  return { sessionId: sessionId, content: finalContent };
}


// ==========================================
// QUIZ & PROGRESS TRACKING DB OPS
// ==========================================

export async function saveQuizResult(data: any) { 
  const supabaseAuth = await createServerClient(); 
  const { data: { user } } = await supabaseAuth.auth.getUser(); 
  if (!user) throw new Error("Unauthorized"); 
  
  await supabaseAdmin.from('study_quiz_results').insert({ user_id: user.id, ...data }); 
  return { success: true }; 
}

export async function getStudyProgress(sessionId: string) { 
  const { data } = await supabaseAdmin
    .from('study_progress')
    .select('*')
    .eq('session_id', sessionId)
    .single(); 
    
  return data || null; 
}

export async function upsertStudyProgress(sessionId: string, update: any) { 
  const existing = await getStudyProgress(sessionId); 
  
  if (existing) { 
    const newMastery = Math.min(100, Math.max(existing.mastery_percentage, update.mastery_percentage ?? existing.mastery_percentage)); 
    await supabaseAdmin
      .from('study_progress')
      .update({ 
        mastery_percentage: newMastery, 
        completed_concepts: update.completed_concepts ?? existing.completed_concepts, 
        current_topic: update.current_topic ?? existing.current_topic, 
        updated_at: new Date().toISOString() 
      })
      .eq('session_id', sessionId); 
  } else { 
    await supabaseAdmin
      .from('study_progress')
      .insert({ 
        session_id: sessionId, 
        mastery_percentage: Math.min(100, update.mastery_percentage ?? 0), 
        completed_concepts: update.completed_concepts ?? [], 
        current_topic: update.current_topic ?? 'Initialization' 
      }); 
  } 
  
  return getStudyProgress(sessionId); 
}

export async function getQuizHistory() { 
  const supabaseAuth = await createServerClient(); 
  const { data: { user } } = await supabaseAuth.auth.getUser(); 
  if (!user) return []; 
  
  const { data } = await supabaseAdmin
    .from('study_quiz_results')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }); 
    
  return data || []; 
}

// 🚀 Gets the existing quiz state so the user can resume if they refresh
export async function getQuizState(sessionId: string, topic: string) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabaseAdmin
    .from('study_quizzes')
    .select('*')
    .eq('session_id', sessionId)
    .eq('topic', topic)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
    console.error("Error fetching quiz state:", error);
    return null;
  }
  return data;
}

// 🚀 Upserts the quiz state (fires on every click and on final submit)
export async function syncQuizState(
  sessionId: string, 
  topic: string, 
  quizData: any, 
  selectedAnswers: Record<number, number>, 
  isSubmitted: boolean, 
  score: number = 0
) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabaseAdmin
    .from('study_quizzes')
    .upsert({
      session_id: sessionId,
      user_id: user.id,
      topic: topic,
      total_questions: quizData.length,
      quiz_data: quizData,
      selected_answers: selectedAnswers,
      is_submitted: isSubmitted,
      score: score,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'session_id, topic'
    });

  if (error) {
    console.error("Error syncing quiz state:", error);
    throw new Error("Failed to sync quiz state");
  }
  
  return true;
}