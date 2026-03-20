'use server'

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

export async function sendStudyMessage(
  sessionId: string | null, 
  content: string, 
  initData?: { subject: string, level: string },
  truncateIndex?: number
) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  let currentSessionId = sessionId;
  let chatHistory: { role: string; content: string }[] = [];

  if (!currentSessionId && initData) {
    const { data: session } = await supabaseAdmin
      .from('study_sessions')
      .insert({ 
        user_id: user.id, 
        title: `Study: ${initData.subject}`,
        subject: initData.subject,
        level: initData.level
      })
      .select().single();
    currentSessionId = session.id;
  } else if (currentSessionId) {
    const { data: pastMessages } = await supabaseAdmin
      .from('study_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
    if (pastMessages) {
      if (typeof truncateIndex === 'number' && truncateIndex < pastMessages.length) {
        const { data: allMsgs } = await supabaseAdmin
          .from('study_messages')
          .select('id')
          .eq('session_id', currentSessionId)
          .order('created_at', { ascending: true });
          
        if (allMsgs && truncateIndex < allMsgs.length) {
          const idsToDelete = allMsgs.slice(truncateIndex).map(m => m.id);
          await supabaseAdmin.from('study_messages').delete().in('id', idsToDelete);
        }
        chatHistory = pastMessages.slice(0, truncateIndex);
      } else {
        chatHistory = pastMessages;
      }
    }
  } else {
    throw new Error("Missing session data.");
  }

  await supabaseAdmin.from('study_messages').insert({ session_id: currentSessionId, role: 'user', content });

  let finalContent = "";
  try {
    const response = await fetch("https://inferaagent.onrender.com/api/v1/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, history: chatHistory }),
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    let rawContent = data.response || data.answer || data.message;
    finalContent = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

  } catch (error) {
    finalContent = "### ⨯ Connection Disrupted\nCould not reach the INFERA Study engine.";
  }

  await supabaseAdmin.from('study_messages').insert({ session_id: currentSessionId, role: 'assistant', content: finalContent });
  await supabaseAdmin.from('study_sessions').update({ updated_at: new Date().toISOString() }).eq('id', currentSessionId);

  return { sessionId: currentSessionId, content: finalContent };
}