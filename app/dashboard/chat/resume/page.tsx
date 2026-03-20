'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Menu, Loader2 } from 'lucide-react'
import { 
  getResumeSessions, 
  getResumeMessages, 
  deleteResumeSession, 
  analyzeResumeAction 
} from '@/app/actions/resume'

// Swapped the Sidebar import here
import { ResumeSidebar } from './components/ResumeSidebar' 
import { InitForm } from './components/InitForm'
import { ActivePromptBar } from './components/ActivePromptBar'
import { MessageItem } from './components/MessageItem'
import { TypewriterMessage } from './components/Typewriter'

export default function ResumeChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [forceStop, setForceStop] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastAssistantIndex, setLastAssistantIndex] = useState(-1);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'instant' });
    }
  }, [messages, loading, isTyping]);

  useEffect(() => {
    getResumeSessions().then((fetched) => {
      setSessions(fetched);
      if (fetched.length > 0 && !sessionId) {
        // Option: automatically load the most recent session
        // loadSession(fetched[0].id); 
      }
    });
  }, []);

  const loadSession = async (id: string) => {
    setLoading(true);
    setSessionId(id);
    const msgs = await getResumeMessages(id);
    setMessages(msgs);
    setLoading(false);
    setMobileMenuOpen(false);
  };

  const handleStop = () => {
    setLoading(false);
    setForceStop(true);
    setIsTyping(false);
  };

  const handleInitSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const role = formData.get('target_role') as string;
    const file = formData.get('file') as File;

    setMessages([{ role: 'user', content: `Evaluating resume for: **${role}**\nDocument: ${file.name}` }]);

    try {
      const res = await analyzeResumeAction(null, formData);
      setSessionId(res.sessionId);
      getResumeSessions().then(setSessions);
      
      setMessages(prev => [...prev, { role: 'assistant', content: res.content }]);
      setLastAssistantIndex(1);
      setIsTyping(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (text: string) => {
    if (loading || isTyping || !text.trim()) return;
    setForceStop(false);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', text);
      
      const res = await analyzeResumeAction(sessionId, formData);
      setMessages(prev => {
        const updated = [...prev, { role: 'assistant', content: res.content }];
        setLastAssistantIndex(updated.length - 1);
        return updated;
      });
      setIsTyping(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fafafa] dark:bg-[#0c0c0e] font-sans selection:bg-blue-500/20 antialiased">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex flex-col w-80 z-10 shrink-0 border-r border-zinc-200/80 dark:border-zinc-800/80 bg-[#fafafa]/50 dark:bg-[#050505]/50 backdrop-blur-xl">
        <ResumeSidebar 
          sessions={sessions} 
          sessionId={sessionId} 
          loadSession={loadSession} 
          handleDelete={(e: any, id: string) => {
            e.stopPropagation();
            deleteResumeSession(id).then(() => getResumeSessions().then(setSessions));
          }}
          createNewSession={() => { setMessages([]); setSessionId(null); }}
        />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        
        {/* MOBILE HEADER */}
        <header className="h-16 shrink-0 flex items-center px-4 sm:px-6 bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 z-20">
          <button className="md:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 transition-colors" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={20} />
          </button>
        </header>

        {!messages.length ? (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center">
            <InitForm onSubmit={handleInitSubmit} loading={loading} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto pt-6 px-4 sm:px-6 lg:px-8 scroll-smooth custom-scrollbar" ref={scrollRef}>
              <div className="max-w-5xl mx-auto space-y-8">
                {messages.map((m, i) => {
                  const isNewAssistant = m.role === 'assistant' && i === lastAssistantIndex;
                  if (isNewAssistant) {
                    return (
                      <TypewriterMessage key={i} content={m.content} isNew={true} forceStop={forceStop} onComplete={() => setIsTyping(false)} scrollRef={scrollRef}>
                        {(displayed: string) => (
                          <MessageItem m={m} index={i} isLast={i === messages.length - 1} loading={loading} isTypingGlobal={isTyping} isNewAssistant={true} displayedContent={displayed} onEditSubmit={() => {}} onRegenerate={() => {}} />
                        )}
                      </TypewriterMessage>
                    );
                  }
                  return <MessageItem key={i} m={m} index={i} isLast={m.role === 'assistant' && i === messages.length - 1} loading={loading} isTypingGlobal={isTyping} isNewAssistant={false} onEditSubmit={() => {}} onRegenerate={() => {}} />;
                })}
                
                {loading && !isTyping && (
                  <div className="flex w-full items-start animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-3 text-zinc-500 bg-white dark:bg-[#111113] px-6 py-4 rounded-[2rem] border border-blue-500/20 shadow-sm w-fit">
                      <Loader2 className="animate-spin text-blue-500" size={18} /> 
                      <span className="text-[14px] font-medium text-zinc-700 dark:text-zinc-300">Scanning ATS compatibility...</span>
                    </div>
                  </div>
                )}
                <div className="h-[220px] sm:h-[240px]" />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
              <div className="pointer-events-auto">
                <ActivePromptBar onSubmit={handleChatSubmit} onStop={handleStop} loading={loading} isTyping={isTyping} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-[280px] bg-white dark:bg-[#09090b] shadow-2xl" onClick={e => e.stopPropagation()}>
             <ResumeSidebar 
                sessions={sessions} 
                sessionId={sessionId} 
                loadSession={loadSession} 
                handleDelete={() => {}} 
                createNewSession={() => { setMessages([]); setSessionId(null); setMobileMenuOpen(false); }}
             />
          </div>
        </div>
      )}
    </div>
  )
}