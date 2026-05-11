'use server'

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

import { getGroqModel, groqQueue } from './agent/providers';
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

export async function unarchiveStudySession(id: string) {
    await supabaseAdmin.from('study_sessions').update({ is_archived: false }).eq('id', id);
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
// 🚀 ENHANCED STUDY AGENT (GROQ ONLY)
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
    .select('id, role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
    
  let dbHistory = pastMessages || [];

  if (typeof truncateIndex === 'number' && truncateIndex < dbHistory.length) {
    const idsToDelete = dbHistory.slice(truncateIndex).map(m => m.id);
    await supabaseAdmin.from('study_messages').delete().in('id', idsToDelete);
    dbHistory = dbHistory.slice(0, truncateIndex);
  }

  const langchainHistory: BaseMessage[] = dbHistory.slice(-10).map(m => {
    let text = m.content;
    if (typeof text === 'string' && text.length > 8000) {
      text = text.substring(0, 8000) + "... [Content Truncated]";
    }
    return m.role === 'user' ? new HumanMessage(text) : new AIMessage(text);
  });

  const userMsgCount = dbHistory.filter(m => m.role === 'user').length + 1;
  const lastLower = content.trim().toLowerCase();
  
  // Logic for Orchestration
  const greetings = ["hi", "hello", "hey", "howdy", "sup", "what's up", "good morning", "good evening"];
  const isGreeting = greetings.some(g => lastLower.startsWith(g)) && lastLower.length < 30;
  const isSyllabusFirst = userMsgCount === 1 && !isGreeting;
  const isMarkDone = content.includes("I've understood this, move to next");
  const wantsQuiz = ["quiz me", "test me", "give me a quiz", "quiz"].some(kw => lastLower.includes(kw));
  const wantsProgress = ["show my progress", "my progress", "track my progress"].some(kw => lastLower.includes(kw)) && !isMarkDone;
  const wantsRoadmap = ["roadmap", "syllabus", "study plan"].some(kw => lastLower.includes(kw));

  let injection = "\n\n[ORCHESTRATION CONTEXT]\n";
  let activeUiTools: any[] = [];
  let toolToForce: string | undefined = undefined;

  if (isGreeting) {
    injection += "MODE: GREETING. Respond warmly. Ask what topic they want to study. Do NOT use tools/widgets.";
  } else if (isSyllabusFirst || wantsRoadmap) {
    injection += "MODE: SYLLABUS. Provide a clear study roadmap. 100% mastery requires covering all concepts.";
  } else if (wantsQuiz) {
    injection += "MODE: QUIZ. Call QuizWidget tool now.";
    const quizTool = uiTools.find(t => t.name === 'QuizWidget');
    if (quizTool) { activeUiTools.push(quizTool); toolToForce = "QuizWidget"; }
  } else if (wantsProgress) {
    injection += "MODE: PROGRESS. Call ProgressWidget tool.";
    const progressTool = uiTools.find(t => t.name === 'ProgressWidget');
    if (progressTool) { activeUiTools.push(progressTool); toolToForce = "ProgressWidget"; }
  } else if (isMarkDone) {
    injection += "MODE: NEXT TOPIC. User finished a concept. Move to next syllabus item.";
  }

  const finalSystemPrompt = STUDY_PROMPT + injection;

  // 🚀 MULTI-MODAL FILE PROCESSING
  let hasPdfOrDoc = false;
  let hasImage = false;
  let fileMarkdown = "";
  let currentMessageParts: any[] = [{ type: 'text', text: content }];
  let docContextBuffer = "";

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const docExtensions = ['.pdf', '.txt', '.csv', '.doc', '.docx'];

  // 🛡️ INVOKER WITH GROQ ROTATION
  const safeInvoke = async (msgs: BaseMessage[], tools: any[], forceToolName?: string) => {
    let attempts = 0;
    let lastError: any;

    while (attempts < 4) {
      const tempModel = getGroqModel(hasImage || hasPdfOrDoc, false);
      const activeQueue = groqQueue;

      // Groq rejects array formatting for AI messages, fix them before invoking
      const formattedMsgs = msgs.map(msg => {
        if (msg._getType() === 'ai') {
          let textContent = msg.content;
          if (Array.isArray(textContent)) {
            textContent = textContent.map((c: any) => c.text || '').join('');
          }
          return new AIMessage({
            content: typeof textContent === 'string' ? textContent : String(textContent),
            tool_calls: (msg as AIMessage).tool_calls,
            invalid_tool_calls: (msg as AIMessage).invalid_tool_calls
          });
        }
        return msg;
      });

      try {
        let runnable = tools.length > 0 ? (forceToolName ? tempModel.bindTools(tools, { tool_choice: forceToolName }) : tempModel.bindTools(tools)) : tempModel;
        return await runnable.invoke(formattedMsgs);
      } catch (e: any) {
        lastError = e;
        const errorStr = String(e) + (e?.message || "") + JSON.stringify(e);

        if (errorStr.includes('429') || errorStr.includes('503') || errorStr.includes('Unavailable') || errorStr.includes('quota') || errorStr.includes('rate_limit') || errorStr.includes('404')) {
          const failedKey = (tempModel as any)._inferaKey;
          const isServerOverload = errorStr.includes('503') || errorStr.includes('Unavailable');

          console.log(`⚠️ Network Drop [${isServerOverload ? '503 Overload' : '429 Rate Limit'}] on Groq. Penalizing key ...${failedKey?.slice(-4) || 'unknown'}`);
          
          activeQueue.reportFailure(failedKey, 60); 
          attempts++;

          if (isServerOverload) {
            console.log("⏳ Pausing 1.5s for server recovery...");
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        } else if (errorStr.includes('tool_choice') || errorStr.includes('invalid_request')) {
          console.log("⚠️ Tool forcing failed, falling back to standard dynamic binding...");
          forceToolName = undefined;
          attempts++;
        } else {
          throw e; 
        }
      }
    }
    throw lastError || new Error("API Connection Failed after multiple attempts.");
  };

  for (const url of fileUrls) {
    const urlLower = url.toLowerCase();
    const ext = `.${urlLower.split('.').pop()?.split('?')[0]}` || "";
    const fileName = url.split('/').pop()?.split('?')[0] || "document";

    if (imageExtensions.includes(ext)) {
      hasImage = true;
      fileMarkdown += `\n\n![${fileName}](${url})`;
      currentMessageParts.push({ type: 'image_url', image_url: { url } });
      console.log(`🖼️ [IMAGE DETECTED] Prepared for Groq Vision...`);
    } else if (docExtensions.includes(ext)) {
      hasPdfOrDoc = true;
      fileMarkdown += `\n\n[📁 Attached Study Material: ${fileName}](${url})`;
      try {
        const arrayBuffer = await fetch(url).then(r => r.arrayBuffer());
        const b64Data = Buffer.from(arrayBuffer).toString('base64');
        
        let mimeType = 'application/pdf';
        if (ext === '.txt') mimeType = 'text/plain';
        if (ext === '.csv') mimeType = 'text/csv';

        currentMessageParts.push({ type: 'media', mimeType, data: b64Data });

        // 🧠 STRICT DOCUMENT EXTRACTION VIA GROQ VISION
        console.log(`📄 [EXTRACTING DOCUMENT] via Groq Vision...`);
        const extractRes = await safeInvoke([
            new HumanMessage({
                content: [
                    { type: "image_url", image_url: `data:${mimeType};base64,${b64Data}` },
                    { type: 'text', text: "Extract and summarize all the study-relevant text, data, and key concepts from this document exactly as it appears." }
                ]
            })
        ], []) as AIMessage;
        
        const extractedText = typeof extractRes.content === 'string' ? extractRes.content : "";
        docContextBuffer += `\n\n[STUDY MATERIAL CONTEXT FOR '${fileName}']:\n${extractedText}\n[END OF DOCUMENT CONTEXT]\n`;
      } catch (e) {
        console.error("Extraction Failed:", e);
        docContextBuffer += `\n\n[SYSTEM NOTE: Attempted to process '${fileName}' but extraction failed.]\n`;
      }
    }
  }

  const fullUserContent = content + docContextBuffer + fileMarkdown;
  await supabaseAdmin.from('study_messages').insert({ session_id: sessionId, role: 'user', content: fullUserContent });
  
  const inputMessages = [
    new SystemMessage(finalSystemPrompt),
    ...langchainHistory,
    new HumanMessage({ content: currentMessageParts })
  ];


  let finalContent = "";
  try {
    const aiMessage = await safeInvoke(inputMessages, activeUiTools, toolToForce) as AIMessage;
    finalContent = typeof aiMessage.content === 'string' ? aiMessage.content : "";

    // Parse chameleon widgets
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      for (const call of aiMessage.tool_calls) {
        if (['QuizWidget', 'ProgressWidget'].includes(call.name)) {
          finalContent += `\n\n\`\`\`json?chameleon\n${JSON.stringify({ component: call.name, props: call.args }, null, 2)}\n\`\`\`\n`;
        }
      }
    }
  } catch (error: any) {
    finalContent = `### ⨯ Connection Disrupted\nFailed to reach the Study Engine. \n**Details:** ${error.message}`;
  }

  await supabaseAdmin.from('study_messages').insert({ session_id: sessionId, role: 'assistant', content: finalContent });
  await supabaseAdmin.from('study_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);
  
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

  if (error && error.code !== 'PGRST116') { 
    console.error("Error fetching quiz state:", error);
    return null;
  }
  return data;
}

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