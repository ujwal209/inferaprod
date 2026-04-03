'use server'

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { executableTools, webSearchTool } from './agent/tools'
import { getGroqModel, getGeminiModel } from './agent/providers'
import { GENERAL_PROMPT } from './agent/prompts'
import { processAndStorePdfChunks, retrieveRelevantContext } from './agent/rag';

const extractServerSources = (content: string, messages?: BaseMessage[]) => {
  const sources: { title: string, url: string, domain: string }[] = [];
  const seenUrls = new Set<string>();
  
  const processText = (text: string) => {
    // 1. Markdown link citations [X](url) or [Citation X](url)
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
    // 2. Raw URLs (fallback for brief AI answers)
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
  
  // 🚀 FALLBACK: If AI text has 0 citations, scan the ToolMessages (Search Reports)
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

  // 1. Get original session title
  const { data: originalSession } = await supabaseAdmin
    .from('chat_sessions')
    .select('title')
    .eq('id', sessionId)
    .single();

  const title = originalSession?.title || "Forked Session";

  // 2. Create new session for the current user
  const { data: newSession, error: sErr } = await supabaseAdmin
    .from('chat_sessions')
    .insert({ user_id: user.id, title: `Clone: ${title.replace('...', '')}` })
    .select().single();

  if (sErr || !newSession) throw new Error("Failed to create new session");

  // 3. Get all messages from original session
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
// 🚀 NATIVE LANGGRAPH REACT AGENT
// ==========================================

export async function sendCoachingMessage(
  sessionId: string, 
  content: string, 
  model: string = 'gpt-4o', 
  fileUrls: string[] = [], 
  truncateIndex?: number
) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch History
  const { data: pastMessages } = await supabaseAdmin
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  let dbHistory = pastMessages || [];

  if (typeof truncateIndex === 'number' && truncateIndex < dbHistory.length) {
    const idsToDelete = dbHistory.slice(truncateIndex).map(m => m.id);
    await supabaseAdmin.from('chat_messages').delete().in('id', idsToDelete);
    dbHistory = dbHistory.slice(0, truncateIndex);
  }

  const langchainHistory: BaseMessage[] = dbHistory.slice(-20).map(m => {
    let text = m.content;
    if (typeof text === 'string' && text.length > 8000) {
      text = text.substring(0, 8000) + "... [Content Truncated]";
    }
    return m.role === 'user' ? new HumanMessage(text) : new AIMessage(text);
  });

  let hasPdf = false;
  let hasImage = false;
  let fileMarkdown = "";
  let currentMessageParts: any[] = [{ type: 'text', text: content }];
  let pdfContextBuffer = "";

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  for (const url of fileUrls) {
    const ext = url.split('.').pop()?.toLowerCase() || "";
    const fileName = url.split('/').pop()?.split('?')[0] || "file";

    if (ext === 'pdf') {
      hasPdf = true;
      fileMarkdown += `\n\n[Attached Document: ${fileName}](${url})`;
      try {
        const arrayBuffer = await fetch(url).then(r => r.arrayBuffer());
        const b64Data = Buffer.from(arrayBuffer).toString('base64');
        
        currentMessageParts.push({
          type: 'media',
          mimeType: 'application/pdf',
          data: b64Data
        });

        // 🚀 INSTANT PDF TEXT EXTRACTION (ZERO-G RAG Fallback)
        console.log("📄 [EXTRACTING DOCUMENT TEXT...] for persistence...");
        const extractModel = getGeminiModel();
        const extractRes = await extractModel.invoke([
            { role: 'user', content: [
                { type: 'media', mimeType: 'application/pdf', data: b64Data },
                { type: 'text', text: 'Extract and summarize all the text from this PDF exactly as it appears. Provide only the text.' }
            ]}
        ]);
        const extractedText = typeof extractRes.content === 'string' ? extractRes.content : "";
        pdfContextBuffer += `\n\n[AUTO-EXTRACTED DOCUMENT CONTEXT FOR '${fileName}']:\n${extractedText}\n[END OF DOCUMENT CONTEXT]\n`;
      } catch (e) {
        console.error("Failed to fetch/extract PDF:", e);
      }
    } else if (imageExtensions.includes(ext)) {
      hasImage = true;
      fileMarkdown += `\n\n![${fileName}](${url})`;
      currentMessageParts.push({ type: 'image_url', image_url: { url } });
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

  const systemMessage = new SystemMessage(`${GENERAL_PROMPT}\n\n[CURRENT_REAL_TIME_CONTEXT]:\nDate: ${dateStr}\nTime: ${timeStr}`);

  try {
    let llmToUse;
    if (hasPdf) llmToUse = getGeminiModel();
    else if (hasImage) llmToUse = getGroqModel(true);
    else if (hasPdf || langchainHistory.length > 5) {
        console.log("🚀 [HEAVY CONTEXT DETECTED] Routing directly to Gemini 2.5 Flash to avoid Groq Org Limits.");
        llmToUse = getGeminiModel();
    }
    else llmToUse = getGroqModel(false);

    // 🚀 NATIVE LANGCHAIN TOOL BINDING (SKIPS SEARCH TOOLS IF IMAGE/PDF TURN)
    const canUseTools = !hasImage && !hasPdf;
    let modelWithTools = canUseTools ? llmToUse.bindTools(executableTools) : llmToUse;
    inputMessages = [systemMessage, ...inputMessages];
    
    let aiMessage: AIMessage | undefined;

    try {
      try {
        aiMessage = await modelWithTools.invoke(inputMessages);
      } catch (innerE: any) {
        const errorStr = String(innerE) + (innerE?.message || "") + JSON.stringify(innerE);
        if (errorStr.includes('429') || errorStr.includes('rate_limit') || errorStr.includes('Rate limit') || errorStr.includes('tokens')) {
           console.log("⚠️ Groq Organization limit hit. Falling back to Gemini 2.5 Flash natively...");
           llmToUse = getGeminiModel();
           modelWithTools = canUseTools ? llmToUse.bindTools(executableTools) : llmToUse;
           aiMessage = await modelWithTools.invoke(inputMessages);
        } else {
           throw innerE;
        }
      }
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
      
      // Clean all escape characters safely so we can regex normally without fighting escape slashes
      let cleanStr = failedGen.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, " ");
      
      const kwMatch = cleanStr.match(/"keyword"\s*[:=]\s*"([^"]+)"/i) || cleanStr.match(/keyword\s*=\s*"([^"]+)"/i);
      if (kwMatch && kwMatch[1] && kwMatch[1].length > 2) {
        extractedQuery = kwMatch[1].trim();
      } else {
        const fallbackMatch = cleanStr.match(/web_search.*?keyword.*?["']([^"']+)["']/i);
        if (fallbackMatch && fallbackMatch[1]) extractedQuery = fallbackMatch[1].trim();
      }

      console.log(`🔍 [REFINING QUERY] Initial Keyword: '${extractedQuery}'`);
      
      // 🚀 QUERY OPTIMIZER: Transform messy extracted text into a high-quality search keyword
      try {
        const optimizerModel = getGeminiModel();
        const optimizerRes = await optimizerModel.invoke([
          new SystemMessage("You are a Search Query Optimizer. Your job is to transform truncated, messy, or hallucinated search keywords into a professional, highly specific, SEO-optimized Google search query. " + 
                             "Ignore randomly-generated file names (like .png or .pdf), technical code snippets, or user-facing phrases like 'tell me more'. " +
                             "OUTPUT ONLY THE REFINED TEXT. NO COMMENTARY."),
          new HumanMessage(`[CHAT HISTORY CONTEXT]:\n${langchainHistory.slice(-4).map(m => `[${m.role}]: ${m.content.toString().substring(0, 500)}`).join('\n')}\n\n[MESSY QUERY TO OPTIMIZE]: ${extractedQuery}`)
        ]);
        const optimizedText = typeof optimizerRes.content === 'string' ? optimizerRes.content.trim() : extractedQuery;
        if (optimizedText && optimizedText.length > 3) {
            extractedQuery = optimizedText.replace(/^"|"$/g, ''); // strip quotes
        }
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
      
      console.log("⚠️ Utilizing Groq for recovery fallback!");
      aiMessage = await llmToUse.invoke(inputMessages) as AIMessage;
    }

    // 🚀 EXECUTE VALID TOOL CALLS (PLUS INLINE TEXT-JSON INTERCEPTOR)
    // ONLY EXECUTE IF IT IS NOT A VISION TURN
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
      
      // Re-invoke with tool results
      aiMessage = await llmToUse.invoke(inputMessages) as AIMessage;
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
        // Fallback: try to store without sources if the column is missing to at least save the text
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