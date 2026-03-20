'use server'

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getResumeSessions() {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return [];
  const { data } = await supabaseAdmin.from('resume_sessions').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
  return data || [];
}

export async function getResumeMessages(sessionId: string) {
  const { data } = await supabaseAdmin.from('resume_messages').select('role, content').eq('session_id', sessionId).order('created_at', { ascending: true });
  return data || [];
}

export async function deleteResumeSession(id: string) {
  await supabaseAdmin.from('resume_sessions').delete().eq('id', id);
}

export async function analyzeResumeAction(sessionId: string | null, formData: FormData) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const targetRole = (formData.get('target_role') as string) || "General Role";
  const message = formData.get('message') as string;
  const file = formData.get('file') as File;

  let currentSessionId = sessionId;
  let isNewSession = !currentSessionId;

  // 1. Create session if it doesn't exist
  if (!currentSessionId) {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('resume_sessions')
      .insert({
        user_id: user.id,
        title: `Resume: ${targetRole}`,
        target_role: targetRole 
      })
      .select()
      .single();

    if (sessionError || !session) {
      if (sessionError?.code === 'PGRST204') {
        throw new Error("DB Error: Missing 'target_role' column in resume_sessions table.");
      }
      throw new Error("Failed to initialize resume session.");
    }
    currentSessionId = session.id;
  }

  // --- NEW: FETCH & ATTACH HISTORY FOR MEMORY ---
  let historyArray: { role: string; content: string }[] = [];
  if (currentSessionId && !isNewSession) {
    const pastMsgs = await getResumeMessages(currentSessionId);
    historyArray = pastMsgs.map((m: any) => ({
      role: m.role,
      content: m.content
    }));
  }
  // Append as a JSON string so FastAPI can parse it out of the multipart form
  formData.append('history', JSON.stringify(historyArray));

  // 2. Save User Message to DB
  const userContent = file 
    ? `Analyzed Resume for **${targetRole}** (File: ${file.name})` 
    : message;

  await supabaseAdmin.from('resume_messages').insert({
    session_id: currentSessionId,
    role: 'user',
    content: userContent
  });

  // 3. Send to FastAPI
  let finalContent = "";
  try {
    const response = await fetch("https://inferaagent.onrender.com/api/v1/resume-analyze", {
      method: "POST",
      body: formData, 
    });

    if (!response.ok) throw new Error("FastAPI connection failed");
    const data = await response.json();
    finalContent = data.response;
  } catch (error) {
    finalContent = "### ⨯ Connection Disrupted\nInfera Engine could not process this resume. Check your local backend.";
  }

  // 4. Save AI Response to DB
  await supabaseAdmin.from('resume_messages').insert({
    session_id: currentSessionId,
    role: 'assistant',
    content: finalContent
  });

  // 5. Update timestamp
  await supabaseAdmin.from('resume_sessions').update({ updated_at: new Date().toISOString() }).eq('id', currentSessionId);

  return { sessionId: currentSessionId, content: finalContent };
}