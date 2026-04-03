'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { HistorySidebar } from '@/components/HistorySidebar'
import { PromptBar } from '@/components/PromptBar'
import { 
  getSessions, deleteSession, renameSession, deleteSessions, initializeSession 
} from '@/app/actions/coaching'
import { Menu, X } from 'lucide-react'

export default function NewChatLanding() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const refreshSessions = async () => { 
    setSessions(await getSessions()); 
  };

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
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="fixed inset-0 top-14 sm:top-16 flex w-full h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-[#050505] font-outfit text-zinc-900 dark:text-zinc-100 antialiased min-w-0">
        
        {/* 🚀 DESKTOP SIDEBAR */}
        <aside className="hidden md:flex flex-col w-[280px] shrink-0 border-r border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#050505] min-w-0">
          <HistorySidebar 
            sessions={sessions} 
            sessionId={null} 
            loadSession={(id: string) => router.push(`/dashboard/chat/${id}`)} 
            handleDelete={async (e: any, id: string) => { e.stopPropagation(); await deleteSession(id); refreshSessions(); }} 
            handleBulkDelete={async (ids: string[]) => { await deleteSessions(ids); refreshSessions(); }} 
            renameSession={renameSession} 
            refreshSessions={refreshSessions} 
            createNewSession={() => {}} 
          />
        </aside>

        {/* 🚀 MOBILE SIDEBAR OVERLAY */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200" onClick={() => setMobileMenuOpen(false)}>
            <aside className="w-[280px] max-w-[85vw] h-full bg-white dark:bg-[#050505] shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center px-4 shrink-0 min-w-0">
                <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden w-full min-w-0">
                <HistorySidebar 
                  sessions={sessions} 
                  sessionId={null} 
                  loadSession={(id: string) => { setMobileMenuOpen(false); router.push(`/dashboard/chat/${id}`); }} 
                  handleDelete={async (e: any, id: string) => { e.stopPropagation(); await deleteSession(id); refreshSessions(); }} 
                  handleBulkDelete={async (ids: string[]) => { await deleteSessions(ids); refreshSessions(); }} 
                  renameSession={renameSession} 
                  refreshSessions={refreshSessions} 
                  createNewSession={() => { setMobileMenuOpen(false); }} 
                />
              </div>
            </aside>
          </div>
        )}

        {/* 🚀 MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 relative h-full bg-white dark:bg-[#050505]">
          
          {/* Header */}
          <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md flex items-center px-4 sm:px-6 z-30 absolute top-0 w-full min-w-0 shrink-0">
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="md:hidden p-2 -ml-2 mr-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
            >
              <Menu size={20} />
            </button>
            <h2 className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
              New Workspace
            </h2>
          </header>

          {/* Centered Input Area */}
          <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto w-full min-w-0 relative">
            
            {/* my-auto forces perfect vertical centering within the flex container */}
            <div className="w-full max-w-3xl my-auto flex flex-col items-center text-center animate-in fade-in duration-500 min-w-0">
              
              {/* Branding */}
              <div className="mb-8 sm:mb-10 w-36 sm:w-44 shrink-0 flex items-center justify-center">
                <Image 
                  src="/logo.png" 
                  alt="Logo" 
                  width={180} 
                  height={60} 
                  className="w-full h-auto object-contain dark:invert opacity-90" 
                  priority 
                />
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-4 sm:mb-5 tracking-tight break-words px-2">
                How can I help you today?
              </h1>
              
              <p className="text-[14px] sm:text-[15px] text-zinc-500 dark:text-zinc-400 mb-10 sm:mb-12 max-w-md px-4 break-words">
                Ask a question, attach documents for analysis, or start a deep dive into a new topic.
              </p>

              {/* Input Wrapper */}
              <div className="w-full max-w-2xl min-w-0 px-2 sm:px-0">
                <PromptBar 
                  onSubmit={submitPrompt} 
                  onStop={() => {}} 
                  isGenerating={loading} 
                  isUploading={false} 
                  isCentered={true} 
                />
              </div>

            </div>
          </main>
          
        </div>
      </div>
    </>
  )
}