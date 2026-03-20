'use server'

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- SESSION MANAGEMENT ---

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

export async function renameSession(id: string, title: string) {
  await supabaseAdmin.from('chat_sessions').update({ title }).eq('id', id);
}

export async function getChatMessages(sessionId: string) {
  const { data } = await supabaseAdmin
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  return data || [];
}

// --- MAIN CHAT ACTION ---

export async function sendCoachingMessage(
  sessionId: string | null, 
  content: string, 
  model: string = 'gpt-4o',
  truncateIndex?: number
) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  let currentSessionId = sessionId;
  let chatHistory: { role: string; content: string }[] = [];

  // 1. Resolve Session & Fetch History
  if (!currentSessionId) {
    const { data: session } = await supabaseAdmin
      .from('chat_sessions')
      .insert({ user_id: user.id, title: content.slice(0, 35) + '...' })
      .select().single();
    
    currentSessionId = session.id;
  } else {
    // SECURITY CHECK
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('user_id')
      .eq('id', currentSessionId)
      .single();

    if (sessionError || !sessionData || sessionData.user_id !== user.id) {
      throw new Error("Unauthorized: Invalid session access.");
    }

    // FETCH CONTEXT
    const { data: pastMessages } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true });

    if (pastMessages) {
      if (typeof truncateIndex === 'number' && truncateIndex < pastMessages.length) {
        // Find IDs of messages to delete
        const { data: allMsgs } = await supabaseAdmin
          .from('chat_messages')
          .select('id')
          .eq('session_id', currentSessionId)
          .order('created_at', { ascending: true });
          
        if (allMsgs && truncateIndex < allMsgs.length) {
          const idsToDelete = allMsgs.slice(truncateIndex).map(m => m.id);
          await supabaseAdmin.from('chat_messages').delete().in('id', idsToDelete);
        }
        chatHistory = pastMessages.slice(0, truncateIndex);
      } else {
        chatHistory = pastMessages;
      }
    }
  }

  // 2. Save the NEW user message to the DB
  await supabaseAdmin.from('chat_messages').insert({ 
    session_id: currentSessionId, 
    role: 'user', 
    content 
  });

  let finalContent = "";

  // 3. Send request to Agent
  try {
    const response = await fetch("https://inferaagent.onrender.com/api/v1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: content, 
        history: chatHistory,
        model: model 
      }),
    });

    if (!response.ok) {
       const errorText = await response.text();
       throw new Error(`Agent Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let rawContent = data.response || data.answer || data.message;

    // --- CRITICAL FIX: PARSE AI ARRAYS/OBJECTS INTO A CLEAN STRING ---
    if (Array.isArray(rawContent)) {
      finalContent = rawContent.map((block: any) => {
        if (typeof block === 'string') return block;
        if (block && typeof block === 'object') {
          return block.text || block.content || JSON.stringify(block);
        }
        return String(block);
      }).join('');
    } else if (typeof rawContent === 'object' && rawContent !== null) {
      finalContent = rawContent.text || rawContent.content || JSON.stringify(rawContent);
    } else {
      finalContent = String(rawContent || "");
    }

  } catch (error: any) {
    console.error("Fetch Error:", error);
    finalContent = "### ⨯ ERROR\nNeural link disrupted. Could not reach local development server.";
  }

  // 4. Save Assistant response to DB
  await supabaseAdmin.from('chat_messages').insert({ 
    session_id: currentSessionId, 
    role: 'assistant', 
    content: finalContent 
  });

  // 5. Update session timestamp
  await supabaseAdmin.from('chat_sessions').update({ 
    updated_at: new Date().toISOString() 
  }).eq('id', currentSessionId);

  return { sessionId: currentSessionId, content: finalContent };
}