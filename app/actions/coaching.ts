'use server'

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

import { executableTools, webSearchTool } from './agent/tools'
import { getGroqModel, groqQueue } from './agent/providers'
import { GENERAL_PROMPT } from './agent/prompts'

const extractServerSources = (content: string, messages?: BaseMessage[]) => {
  const sources: { title: string, url: string, domain: string }[] = [];
  const seenUrls = new Set<string>();
  
  const processText = (text: string) => {
    const linkRegex = /\[(?:Citation|Source|\d+)\s*(?:\d+)?\]\((https?:\/\/[^\s\)]+)\)/gi;
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
      if (!seenUrls.has(match[1])) {
        seenUrls.add(match[1]);
        try {
          const domain = new URL(match[1]).hostname.replace('www.', '');
          sources.push({ title: domain, url: match[1], domain }); 
        } catch { sources.push({ title: 'Source', url: match[1], domain: 'link' }); }
      }
    }
    const rawUrlRegex = /(https?:\/\/[^\s\),"'<>]+)/gi;
    while ((match = rawUrlRegex.exec(text)) !== null) {
        if (!seenUrls.has(match[0])) {
          seenUrls.add(match[0]);
          try {
            const domain = new URL(match[0]).hostname.replace('www.', '');
            sources.push({ title: domain, url: match[0], domain });
          } catch { sources.push({ title: 'Source', url: match[0], domain: 'link' }); }
        }
    }
  };

  processText(content);
  
  if (sources.length === 0 && messages) {
      messages.forEach(m => {
          if (m instanceof ToolMessage || (m as any).type === 'tool' || (m as any).name === 'web_search') {
              processText(String(m.content));
          }
      });
  }
  
  return sources;
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function initializeSession(title: string) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const sessionTitle = (title || "New Session").slice(0, 35) + '...';

  const { data: session, error } = await supabaseAdmin
    .from('chat_sessions')
    .insert({ user_id: user.id, title: sessionTitle })
    .select().single();

  if (error || !session) throw new Error("Failed to initialize session");
  return session.id;
}

export async function getSessions() {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return [];

  const { data } = await supabaseAdmin
    .from('chat_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
    
  return data || [];
}

export async function deleteSession(id: string) {
  await supabaseAdmin.from('chat_sessions').delete().eq('id', id);
}

export async function deleteSessions(ids: string[]) {
  if (!ids.length) return;
  await supabaseAdmin.from('chat_sessions').delete().in('id', ids);
}

export async function renameSession(id: string, title: string) {
  await supabaseAdmin.from('chat_sessions').update({ title }).eq('id', id);
}

export async function getChatMessages(sessionId: string) {
  const { data } = await supabaseAdmin
    .from('chat_messages')
    .select('role, content, sources')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
    
  return data || [];
}

export async function duplicateSession(sessionId: string) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: originalSession } = await supabaseAdmin
    .from('chat_sessions')
    .select('title')
    .eq('id', sessionId)
    .single();

  const title = originalSession?.title || "Forked Session";

  const { data: newSession, error: sErr } = await supabaseAdmin
    .from('chat_sessions')
    .insert({ user_id: user.id, title: `Clone: ${title.replace('...', '')}` })
    .select().single();

  if (sErr || !newSession) throw new Error("Failed to create new session");

  const { data: messages } = await supabaseAdmin
    .from('chat_messages')
    .select('role, content, sources')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (messages && messages.length > 0) {
    const messagesToInsert = messages.map(m => ({
      session_id: newSession.id,
      role: m.role,
      content: m.content,
      sources: m.sources
    }));
    await supabaseAdmin.from('chat_messages').insert(messagesToInsert);
  }
  return newSession.id;
}

export async function getSessionById(id: string) {
  const { data } = await supabaseAdmin
    .from('chat_sessions')
    .select('id, user_id, title, status')
    .eq('id', id)
    .single();
  return data;
}

// ==========================================
// 🚀 NATIVE LANGGRAPH REACT AGENT (GROQ ONLY)
// ==========================================

export async function sendCoachingMessage(
  sessionId: string, 
  content: string, 
  model: string = 'llama-3.3-70b-versatile', 
  fileUrls: string[] = [], 
  truncateIndex?: number
) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: pastMessages } = await supabaseAdmin
    .from('chat_messages')
    .select('id, role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  let dbHistory = pastMessages || [];

  if (typeof truncateIndex === 'number' && truncateIndex < dbHistory.length) {
    const idsToDelete = dbHistory.slice(truncateIndex).map(m => m.id);
    await supabaseAdmin.from('chat_messages').delete().in('id', idsToDelete);
    dbHistory = dbHistory.slice(0, truncateIndex);
  }

  const langchainHistory: BaseMessage[] = dbHistory.slice(-4).map(m => {
    let text = m.content;
    if (typeof text === 'string' && text.length > 8000) {
      text = text.substring(0, 8000) + "... [Content Truncated]";
    }
    return m.role === 'user' ? new HumanMessage(text) : new AIMessage(text);
  });

  let hasPdfOrDoc = false;
  let hasImage = false;
  let fileMarkdown = "";
  let currentMessageParts: any[] = [{ type: 'text', text: content }];
  let pdfContextBuffer = "";

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
  const docExtensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.txt', '.csv', '.rtf'];
  
  const safeInvoke = async (msgs: BaseMessage[], withTools: boolean = false) => {
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
              let runnable = withTools ? tempModel.bindTools(executableTools) : tempModel;
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
              } else {
                  throw e; 
              }
          }
      }
      throw lastError; 
  };

  for (const url of fileUrls) {
    const urlLower = url.toLowerCase();
    const ext = urlLower.split('.').pop()?.split('?')[0] || "";
    const fileName = url.split('/').pop()?.split('?')[0] || "file";

    const isDoc = docExtensions.includes(`.${ext}`);
    const isImage = !isDoc && (imageExtensions.includes(`.${ext}`) || urlLower.includes('/image/upload'));

    if (isImage) {
      hasImage = true;
      fileMarkdown += `\n\n![Uploaded Image](${url})`; 
      currentMessageParts.push({ type: 'image_url', image_url: { url } });
      console.log(`🖼️ [IMAGE DETECTED] Routing via Groq Vision...`);
    } 
    else if (isDoc) {
      hasPdfOrDoc = true;
      fileMarkdown += `\n\n[Attached Document: ${fileName}](${url})`;
      try {
        const arrayBuffer = await fetch(url).then(r => r.arrayBuffer());
        const b64Data = Buffer.from(arrayBuffer).toString('base64');
        
        let mimeType = 'application/octet-stream';
        if (ext === 'pdf') mimeType = 'application/pdf';
        else if (ext === 'txt') mimeType = 'text/plain';
        else if (ext === 'csv') mimeType = 'text/csv';

        currentMessageParts.push({
          type: 'media',
          mimeType: mimeType,
          data: b64Data
        });

        console.log(`📄 [EXTRACTING ${mimeType.toUpperCase()}...] via Groq Vision`);
        const extractMsgs = [new HumanMessage({
            content: [
                {
                  type: "image_url",
                  image_url: `data:${mimeType};base64,${b64Data}`
                },
                { type: 'text', text: `Extract and summarize all the text from this document exactly as it appears. Provide only the text.` }
            ]
        })];
        const extractRes = await safeInvoke(extractMsgs, false) as AIMessage;
        const extractedText = typeof extractRes.content === 'string' ? extractRes.content : "";
        pdfContextBuffer += `\n\n[AUTO-EXTRACTED DOCUMENT CONTEXT FOR '${fileName}']:\n${extractedText}\n[END OF DOCUMENT CONTEXT]\n`;
      } catch (e) {
        console.error(`Failed to fetch/extract Document:`, e);
        pdfContextBuffer += `\n\n[SYSTEM NOTE: Attempted to process '${fileName}' but extraction failed.]\n`;
      }
    } else {
      fileMarkdown += `\n\n[Attached File: ${fileName}](${url})`;
    }
  }

  const fullUserContent = content + pdfContextBuffer + fileMarkdown;
  await supabaseAdmin.from('chat_messages').insert({ session_id: sessionId, role: 'user', content: fullUserContent });
  
  const currentUserMessage = new HumanMessage({ content: currentMessageParts });
  let inputMessages = [...langchainHistory, currentUserMessage];

  let finalContent = "";
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const strictSystemPrompt = `${GENERAL_PROMPT}\n\n` +
    `==== STRICT REASONING GUARDRAILS ====\n` +
    `1. DIRECT ANSWER: Respond EXACTLY to what the user asked in their latest message.\n` +
    `2. NO DATE SEARCHING: You already know today's date and time (listed below). NEVER use a search tool to find the current date or time.\n` +
    `3. STRICT GROUNDING: If you use the web_search tool for live events (like sports, scores, points tables, news), you MUST base your answer ONLY on the returned search results. DO NOT use your internal training data. If the search results don't have the answer, say "I cannot find the current information."\n` +
    `=====================================\n\n` +
    `[CURRENT_REAL_TIME_CONTEXT]:\nDate: ${dateStr}\nTime: ${timeStr}`;

  const systemMessage = new SystemMessage(strictSystemPrompt);

  try {
    const canUseTools = !hasImage && !hasPdfOrDoc;
    inputMessages = [systemMessage, ...inputMessages];
    
    let aiMessage: AIMessage | undefined;

    try {
      aiMessage = await safeInvoke(inputMessages, canUseTools) as AIMessage;
      
    } catch (e: any) {
      if (!canUseTools) throw e;
      console.log("⚠️ Caught API Tool Binding Failure! Healing natively...");
      
      let extractedQuery = content;
      let failedGen = "";
      
      try {
        const parsed = JSON.parse(e.message);
        failedGen = parsed.error?.failed_generation || "";
      } catch {
        failedGen = typeof e === 'object' ? JSON.stringify(e) + (e.message || "") : String(e);
      }
      
      let cleanStr = failedGen.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, " ");
      
      const kwMatch = cleanStr.match(/"keyword"\s*[:=]\s*"([^"]+)"/i) || cleanStr.match(/keyword\s*=\s*"([^"]+)"/i);
      if (kwMatch && kwMatch[1] && kwMatch[1].length > 2) {
        extractedQuery = kwMatch[1].trim();
      } else {
        const fallbackMatch = cleanStr.match(/web_search.*?keyword.*?["']([^"']+)["']/i);
        if (fallbackMatch && fallbackMatch[1]) extractedQuery = fallbackMatch[1].trim();
      }

      console.log(`🔍 [REFINING QUERY] Initial Keyword: '${extractedQuery}'`);
      
      try {
        const optMsgs = [
          new SystemMessage("You are a Search Query Optimizer... OUTPUT ONLY THE REFINED TEXT."),
          new HumanMessage(`[CHAT HISTORY CONTEXT]:\n${langchainHistory.slice(-4).map(m => `[${m.role}]: ${m.content.toString().substring(0, 500)}`).join('\n')}\n\n[MESSY QUERY TO OPTIMIZE]: ${extractedQuery}`)
        ];
        
        let fastModel = getGroqModel(false, true); 
        const optimizerRes = await fastModel.invoke(optMsgs) as AIMessage;
        
        const optimizedText = typeof optimizerRes.content === 'string' ? optimizerRes.content.trim() : extractedQuery;
        if (optimizedText && optimizedText.length > 3) extractedQuery = optimizedText.replace(/^"|"$/g, '');
      } catch (optE) {
        console.warn("⚠️ Query optimizer failed, using raw extraction.");
      }

      console.log(`🌐 [HEALED SEARCH INITIATED] Optimized Query: '${extractedQuery}'`);
      const recoveredResult = await webSearchTool.invoke({ keyword: extractedQuery });
      
      inputMessages.push(new AIMessage("I need to run a web search to fetch the latest details."));
      inputMessages.push(new ToolMessage({
        tool_call_id: "search_recovery_1",
        content: typeof recoveredResult === 'string' ? recoveredResult : JSON.stringify(recoveredResult),
        name: "web_search",
      }));
      
      console.log("⚠️ Utilizing Retry for recovery completion!");
      aiMessage = await safeInvoke(inputMessages, false) as AIMessage;
    }

    const textContentRaw = typeof aiMessage?.content === 'string' ? aiMessage.content : "";
    const hasHallucinatedJson = textContentRaw.includes('web_search') && textContentRaw.includes('keyword');
    let callsToProcess = (aiMessage?.tool_calls && canUseTools) ? aiMessage.tool_calls : [];

    if (aiMessage && hasHallucinatedJson && callsToProcess.length === 0 && canUseTools) {
      console.log("⚠️ Intercepted raw JSON payload hallucinated inside chat text! Healing natively...");
      const rawKwMatch = textContentRaw.match(/"keyword"\s*:\s*"([^"]+)"/i);
      if (rawKwMatch && rawKwMatch[1]) {
        callsToProcess = [{
          id: "hallucinated_" + Math.random().toString().slice(2, 8),
          name: "web_search",
          args: { keyword: rawKwMatch[1].trim() },
          type: "tool_call"
        }];
      }
    }

    if (aiMessage && callsToProcess.length > 0) {
      inputMessages.push(aiMessage);
      
      for (const call of callsToProcess) {
        let toolResult = "";
        try {
          if (call.name === "web_search") {
            toolResult = await webSearchTool.invoke(call.args);
          } else {
            const t = executableTools.find(x => x.name === call.name);
            toolResult = t ? await t.invoke(call.args) : "Tool not found.";
          }
        } catch (e) {
          toolResult = "Execution failed.";
        }
        
        inputMessages.push(new ToolMessage({
          tool_call_id: call.id || Math.random().toString(),
          content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
          name: call.name,
        }));
      }
      
      aiMessage = await safeInvoke(inputMessages, false) as AIMessage;
    }

    if (!aiMessage) {
       throw new Error("AI failed to return a response.");
    }

    finalContent = typeof aiMessage.content === 'string' ? aiMessage.content : JSON.stringify(aiMessage.content);

  } catch (error: any) {
    console.error("LangChain Manual Loop Error:", error.message || error);
    finalContent = `### ⨯ Connection Disrupted\nFailed to reach the INFERA LangChain Engine. \n**Details:** ${error.message}`;
  }

    const extractedSources = extractServerSources(finalContent, inputMessages);
    console.log(`💾 [STORAGE INITIATED] Saving ${extractedSources.length} sources to message...`);

    const { error: msgErr } = await supabaseAdmin.from('chat_messages').insert({ 
        session_id: sessionId, 
        role: 'assistant', 
        content: finalContent,
        sources: extractedSources 
    });

    if (msgErr) {
        console.error("❌ SUPABASE SOURCE STORAGE FAILURE:", msgErr.message, msgErr.details);
        if (msgErr.message.includes("column \"sources\" does not exist")) {
           console.warn("⚠️ Column 'sources' is missing! Falling back to content-only save.");
           await supabaseAdmin.from('chat_messages').insert({ 
               session_id: sessionId, 
               role: 'assistant', 
               content: finalContent
           });
        }
    } else {
        console.log("✅ Sources successfully stored in database.");
    }
    
    await supabaseAdmin.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);
    return { role: 'assistant', content: finalContent, sources: extractedSources };
}

export async function archiveSession(sessionId: string) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabaseAdmin
    .from('chat_sessions')
    .update({ status: 'archived' })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) throw error;
  return { success: true };
}

export async function unarchiveSession(sessionId: string) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabaseAdmin
    .from('chat_sessions')
    .update({ status: 'active' })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) throw error;
  return { success: true };
}

export async function shareSession(sessionId: string) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabaseAdmin
    .from('chat_sessions')
    .update({ status: 'shared' })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) throw error;
  return { success: true };
}