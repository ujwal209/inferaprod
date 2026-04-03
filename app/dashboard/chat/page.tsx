'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { HistorySidebar } from '@/components/HistorySidebar'
import { PromptBar } from '@/components/PromptBar'
import { 
  getSessions, deleteSession, renameSession, deleteSessions, initializeSession 
} from '@/app/actions/coaching'
import { Menu, Loader2 } from 'lucide-react'

export default function NewChatLanding() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const refreshSessions = async () => { setSessions(await getSessions()); };

  useEffect(() => { 
    refreshSessions(); 
  }, []);

  const submitPrompt = async (text: string) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const newId = await initializeSession(text);
      // Redirect to the new chat page with the first prompt as a query param
      // This ensures the AI is triggered on the next page mount
      router.push(`/dashboard/chat/${newId}?initialPrompt=${encodeURIComponent(text)}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:opsz,wght@6..12,400..700&family=Outfit:wght@100..900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .font-google-sans { font-family: 'Google Sans', sans-serif !important; }
      `}} />

      <div className="fixed inset-0 top-[64px] sm:top-[72px] flex w-full overflow-hidden bg-white dark:bg-[#050505] font-outfit text-zinc-900 dark:text-zinc-100">
        <aside className="hidden md:flex flex-col w-80 shrink-0 border-r border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#050505]">
          <HistorySidebar sessions={sessions} sessionId={null} loadSession={(id) => router.push(`/dashboard/chat/${id}`)} handleDelete={async (e, id) => { await deleteSession(id); refreshSessions(); }} handleBulkDelete={async (ids) => { await deleteSessions(ids); refreshSessions(); }} renameSession={renameSession} refreshSessions={refreshSessions} createNewSession={() => {}} />
        </aside>

        <div className="flex-1 flex flex-col relative h-full bg-white dark:bg-[#0c0c0e]">
          <header className="h-14 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-md flex items-center px-4 sm:px-6 z-30">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-zinc-500"><Menu size={20} /></button>
            <h2 className="font-google-sans font-bold text-[14px] text-zinc-900 dark:text-white ml-2">Initiate Research</h2>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-hidden pt-10">
            <div className="w-full flex flex-col items-center text-center max-w-3xl animate-in fade-in duration-700">
              <div className="mb-20 sm:mb-24 w-48 sm:w-56"><Image src="/logo.png" alt="Logo" width={220} height={60} className="w-full h-auto dark:invert opacity-95" priority /></div>
              <PromptBar onSubmit={submitPrompt} onStop={() => {}} isGenerating={loading} isUploading={false} isCentered={true} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}