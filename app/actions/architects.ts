'use server'

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getRoadmapSessions() {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return [];

  const { data } = await supabaseAdmin
    .from('roadmap_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  return data || [];
}

export async function getRoadmapMessages(sessionId: string) {
  const { data } = await supabaseAdmin
    .from('roadmap_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  return data || [];
}

export async function deleteRoadmapSession(id: string) {
  await supabaseAdmin.from('roadmap_sessions').delete().eq('id', id);
}

export async function renameRoadmapSession(id: string, title: string) {
  await supabaseAdmin.from('roadmap_sessions').update({ title }).eq('id', id);
}

// --- UNIFIED ROADMAP CHAT ACTION ---
export async function sendRoadmapMessage(
  sessionId: string | null, 
  content: string, 
  initData?: { role: string, skills: string, timeframe: number },
  truncateIndex?: number
) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  let currentSessionId = sessionId;
  let chatHistory: { role: string; content: string }[] = [];

  // 1. CREATE OR FETCH SESSION
  if (!currentSessionId && initData) {
    // FIRST TIME INITIALIZATION
    const { data: session } = await supabaseAdmin
      .from('roadmap_sessions')
      .insert({ 
        user_id: user.id, 
        title: `Roadmap: ${initData.role}`,
        target_role: initData.role,
        current_skills: initData.skills,
        timeframe_months: initData.timeframe
      })
      .select().single();
    
    currentSessionId = session.id;
  } else if (currentSessionId) {
    // FOLLOW UP CHAT
    const { data: sessionData, error } = await supabaseAdmin
      .from('roadmap_sessions')
      .select('user_id')
      .eq('id', currentSessionId)
      .single();

    if (error || !sessionData || sessionData.user_id !== user.id) {
      throw new Error("Unauthorized session access.");
    }

    const { data: pastMessages } = await supabaseAdmin
      .from('roadmap_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true });

    if (pastMessages) {
      if (typeof truncateIndex === 'number' && truncateIndex < pastMessages.length) {
        const { data: allMsgs } = await supabaseAdmin
          .from('roadmap_messages')
          .select('id')
          .eq('session_id', currentSessionId)
          .order('created_at', { ascending: true });
          
        if (allMsgs && truncateIndex < allMsgs.length) {
          const idsToDelete = allMsgs.slice(truncateIndex).map(m => m.id);
          await supabaseAdmin.from('roadmap_messages').delete().in('id', idsToDelete);
        }
        chatHistory = pastMessages.slice(0, truncateIndex);
      } else {
        chatHistory = pastMessages;
      }
    }
  } else {
    throw new Error("Missing session or initialization data.");
  }

  // 2. SAVE USER MESSAGE
  await supabaseAdmin.from('roadmap_messages').insert({ 
    session_id: currentSessionId, role: 'user', content 
  });

  let finalContent = "";

  // 3. SEND TO PYTHON BACKEND
  try {
    let response;
    if (initData) {
      // First generation hits the specialized roadmap endpoint
      response = await fetch("https://inferaagent.onrender.com/api/v1/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          target_role: initData.role, 
          current_skills: initData.skills, 
          timeframe_months: initData.timeframe 
        }),
      });
    } else {
      // Follow-up questions hit the general chat endpoint with history
      response = await fetch("https://inferaagent.onrender.com/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history: chatHistory }),
      });
    }

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    
    let rawContent = data.response || data.answer || data.message;
    finalContent = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

  } catch (error) {
    finalContent = "### ⨯ Connection Disrupted\nCould not reach the neural engine.";
  }

  // 4. SAVE ASSISTANT RESPONSE
  await supabaseAdmin.from('roadmap_messages').insert({ 
    session_id: currentSessionId, role: 'assistant', content: finalContent 
  });

  await supabaseAdmin.from('roadmap_sessions').update({ 
    updated_at: new Date().toISOString() 
  }).eq('id', currentSessionId);

  return { sessionId: currentSessionId, content: finalContent };
}