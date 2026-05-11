'use client'

import React, { useState, useRef, useEffect, Suspense, MouseEvent, KeyboardEvent } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { createClient as createBrowserClient } from '@/utils/supabase/client'

// Server Actions 
import { 
  getSessions, deleteSession, renameSession, deleteSessions,
  getChatMessages, sendCoachingMessage, initializeSession,
  archiveSession, unarchiveSession, shareSession, getSessionById, duplicateSession
} from '@/app/actions/coaching'

import { Menu, Loader2, GitFork, Lock, Share2, Archive, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { uploadFilesDirectly } from './chat-utils'
import { ShareModal } from './ChatModals'
import { ChatSidebar } from './ChatSidebar'
import { ChatPromptBar } from './ChatPromptBar'
import { ChatMessageItem } from './ChatMessage'

function ActiveStudySessionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activeSessionId = typeof params?.sessionId === 'string' ? params.sessionId : null;
  
  // 🚀 GRAB DATA FROM LANDING PAGE
  const initialPrompt = searchParams.get('initialPrompt');
  const initialFilesRaw = searchParams.get('initialFiles');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(!!activeSessionId); 
  const [isTyping, setIsTyping] = useState(false);
  const [forceStop, setForceStop] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialPromptHandled = useRef(false);
  const supabase = createBrowserClient();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedSidebar = localStorage.getItem('infera_sidebar_collapsed');
    if (savedSidebar === 'true') setSidebarCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const newVal = !sidebarCollapsed;
    setSidebarCollapsed(newVal);
    localStorage.setItem('infera_sidebar_collapsed', String(newVal));
  };

  const refreshSessions = async () => { setSessions(await getSessions()); };

  useEffect(() => { 
    refreshSessions(); 
  }, []);

  useEffect(() => {
    if (activeSessionId) { 
      initialPromptHandled.current = false;
      loadChatHistory(activeSessionId); 
    } 
    else { 
      setMessages([]); setSessionData(null); setIsInitialLoading(false); 
    }
  }, [activeSessionId]);

  // 🚀 PROCESS INCOMING DATA FROM LANDING PAGE
  useEffect(() => {
    if ((initialPrompt || initialFilesRaw) && activeSessionId && messages.length === 0 && !loading && !isInitialLoading && !initialPromptHandled.current) {
      initialPromptHandled.current = true; 
      
      let parsedUrls: string[] = [];
      if (initialFilesRaw) {
          try {
              parsedUrls = JSON.parse(initialFilesRaw);
          } catch(e) { 
              console.error("Failed to parse initial files", e); 
          }
      }

      submitPrompt(initialPrompt || "", [], parsedUrls);
      
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('initialPrompt');
      newUrl.searchParams.delete('initialFiles');
      window.history.replaceState(null, '', newUrl.toString());
    }
  }, [initialPrompt, initialFilesRaw, activeSessionId, messages.length, loading, isInitialLoading]);

  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsUserScrolledUp(!isNearBottom);
  };

  useEffect(() => { 
    if (scrollRef.current && !isUserScrolledUp && !isTyping) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading, isTyping, isUserScrolledUp]);

  const loadChatHistory = async (id: string) => {
    setIsInitialLoading(true);
    try { 
      const [msgs, data] = await Promise.all([getChatMessages(id), getSessionById(id)]);
      setMessages(msgs || []); setSessionData(data);
    } 
    catch (err) { console.error(err); } 
    finally { setIsInitialLoading(false); setMobileMenuOpen(false); }
  };

  // 🚀 SUBMIT PROMPT LOGIC
  const submitPrompt = async (text: string, attachedFiles: File[] = [], preUploadedUrls: string[] = []) => {
    if (!text.trim() && attachedFiles.length === 0 && preUploadedUrls.length === 0) return;
    setLoading(true); setForceStop(false);
    
    let finalFileMarkdown = "";

    if (preUploadedUrls.length > 0) {
        finalFileMarkdown += preUploadedUrls.map(url => {
            const urlLower = url.toLowerCase();
            const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].some(ext => urlLower.includes(ext)) || urlLower.includes('/image/upload');
            return isImage ? `\n\n![Uploaded Image](${url})` : `\n\n[Attached File](${url})`;
        }).join("");
    }

    if (attachedFiles.length > 0) {
        finalFileMarkdown += attachedFiles.map(f => f.type.startsWith('image/') ? `\n\n![${f.name}](${URL.createObjectURL(f)})` : `\n\n[${f.name}](attachment)`).join("");
    }

    setMessages(prev => [...prev, { role: 'user', content: (text || "Uploaded files.") + finalFileMarkdown }]);

    try {
      let targetId = activeSessionId;
      if (!targetId) {
        targetId = await initializeSession(text || "Uploaded File");
        window.history.replaceState(null, '', `/dashboard/chat/${targetId}`);
        refreshSessions();
      }

      let uploadedUrls: string[] = [...preUploadedUrls];
      
      if (attachedFiles.length > 0) {
          const newUrls = await uploadFilesDirectly(attachedFiles, targetId as string);
          uploadedUrls = [...uploadedUrls, ...newUrls];
      }

      const res = await sendCoachingMessage(targetId as string, text, 'gpt-4o', uploadedUrls);
      refreshSessions();
      setMessages(prev => [...prev, { role: 'assistant', content: res.content, sources: res.sources }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `**Error:** Failed to reach server.` }]);
    } finally { setLoading(false); setIsTyping(false); }
  };

  const handleEditSubmit = async (index: number, newText: string) => {
    if (!newText.trim() || loading || isTyping) return;
    setForceStop(false);
    const truncatedMessages = messages.slice(0, index);
    setMessages([...truncatedMessages, { role: 'user', content: newText }]);
    setLoading(true);
    try {
      const res = await sendCoachingMessage(activeSessionId!, newText, 'gpt-4o', [], index);
      setMessages([...truncatedMessages, { role: 'user', content: newText }, { role: 'assistant', content: res.content, sources: res.sources }]);
    } catch (err) { console.error(err); } finally { setLoading(false); setIsTyping(false); }
  };

  const handleStop = () => { setForceStop(true); setLoading(false); setIsTyping(false); };

  const handleShare = async () => {
    if (!activeSessionId) return;
    try {
      await shareSession(activeSessionId);
      setShareUrl(`${window.location.origin}/dashboard/chat/${activeSessionId}`);
      setIsShareModalOpen(true);
    } catch (err) { toast.error("Failed to generate share link."); }
  };

  const handleArchiveToggle = async (id: string, shouldArchive: boolean) => {
    if (!id) return;
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status: shouldArchive ? 'archived' : 'active', is_archived: shouldArchive, updated_at: new Date().toISOString() } : s));

    if (shouldArchive) {
      toast.promise(archiveSession(id), {
        loading: 'Archiving session...',
        success: () => { 
          if (id === activeSessionId) router.push('/dashboard/chat');
          refreshSessions(); 
          return "Session archived."; 
        },
        error: () => { refreshSessions(); return "Archive failed."; }
      });
    } else {
      toast.promise(unarchiveSession(id), {
        loading: 'Restoring session...',
        success: () => { refreshSessions(); return "Session restored."; },
        error: () => { refreshSessions(); return "Restore failed."; }
      });
    }
  };

  const handleDelete = async (e: MouseEvent | KeyboardEvent, id: string) => {
    e.stopPropagation(); await deleteSession(id); refreshSessions();
    if(id === activeSessionId) router.push('/dashboard/chat');
  }

  return (
    <>
      <div className="fixed inset-0 top-[56px] sm:top-[64px] flex w-full h-[calc(100dvh-56px)] sm:h-[calc(100dvh-64px)] overflow-hidden bg-white dark:bg-[#050505] font-sans text-zinc-900 dark:text-zinc-100 min-w-0">
        
        <aside className={`hidden md:flex flex-col shrink-0 z-10 border-r border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#0c0c0e] min-w-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-[60px]' : 'w-[260px]'}`}>
          <ChatSidebar 
            sidebarCollapsed={sidebarCollapsed} 
            toggleSidebar={toggleSidebar} 
            sessions={sessions} 
            sessionId={activeSessionId} 
            loadSession={(id:string)=>router.push(`/dashboard/chat/${id}`)} 
            handleDelete={handleDelete} 
            handleArchive={handleArchiveToggle} 
            handleBulkDelete={async (ids: string[]) => { await deleteSessions(ids); refreshSessions(); if (activeSessionId && ids.includes(activeSessionId)) router.push('/dashboard/chat'); }} 
            renameSession={renameSession} 
            refreshSessions={refreshSessions} 
            createNewSession={()=>router.push('/dashboard/chat')} 
          />
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden transition-opacity" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-[80vw] max-w-[300px] bg-white dark:bg-[#0c0c0e] flex flex-col shadow-2xl animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
              <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center px-4 shrink-0">
                <span className="font-semibold text-sm text-zinc-900 dark:text-white">Workspace</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-hidden min-w-0 w-full">
                <ChatSidebar 
                  sidebarCollapsed={false} 
                  sessions={sessions} 
                  sessionId={activeSessionId} 
                  loadSession={(id:string)=>{setMobileMenuOpen(false); router.push(`/dashboard/chat/${id}`);}} 
                  handleDelete={handleDelete} 
                  handleArchive={handleArchiveToggle} 
                  handleBulkDelete={async (ids: string[]) => { await deleteSessions(ids); refreshSessions(); if (activeSessionId && ids.includes(activeSessionId)) router.push('/dashboard/chat'); }} 
                  renameSession={renameSession} 
                  refreshSessions={refreshSessions} 
                  createNewSession={()=>{setMobileMenuOpen(false); router.push('/dashboard/chat');}} 
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#050505] relative h-full w-full">
          
          <header className="h-14 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#050505]/90 flex items-center justify-between px-4 sm:px-6 shrink-0 w-full min-w-0 z-10">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-1.5 -ml-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors shrink-0"><Menu size={18} /></button>
              {sidebarCollapsed && <button onClick={toggleSidebar} className="hidden md:block p-1.5 -ml-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors shrink-0"><PanelLeftOpen size={18} /></button>}
              <h2 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate w-full max-w-[180px] sm:max-w-md">{activeSessionId ? sessionData?.title || "Session" : "New Chat"}</h2>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {activeSessionId && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={handleShare} className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors font-medium text-xs"><Share2 size={14} /><span className="hidden sm:inline">Share</span></button>
                  <button onClick={() => handleArchiveToggle(activeSessionId as string, true)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors font-medium text-xs"><Archive size={14} /><span className="hidden sm:inline">Archive</span></button>
                </div>
              )}
            </div>
          </header>

          <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} shareUrl={shareUrl} />

          {isInitialLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#050505] w-full min-w-0"><div className="flex flex-col items-center gap-3"><Loader2 size={20} className="animate-spin text-zinc-400" /><span className="text-sm font-medium text-zinc-500">Loading workspace...</span></div></div>
          ) : (
            <>
              {messages.length === 0 ? (
                <main className="flex-1 flex flex-col items-center overflow-y-auto overflow-x-hidden w-full min-w-0 relative custom-scrollbar p-4">
                  <div className="w-full max-w-2xl my-auto flex flex-col items-center text-center animate-in fade-in duration-700 min-w-0 relative z-10 py-10 sm:py-16">
                    <div className="mb-6 sm:mb-8 w-32 sm:w-40 shrink-0 flex items-center justify-center"><Image src="/logo.png" alt="Logo" width={220} height={60} className="w-full h-auto object-contain dark:invert opacity-90" priority /></div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-white mb-2 tracking-tight break-words w-full leading-tight">How can I help you today?</h1>
                    <p className="text-[14px] text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm px-2 break-words font-medium">Ask a question, attach documents for analysis, or start a deep dive.</p>
                    <div className="w-full min-w-0"><ChatPromptBar onSubmit={(text, files) => submitPrompt(text, files, [])} isGenerating={loading} onStop={handleStop} /></div>
                  </div>
                </main>
              ) : (
                <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 scroll-smooth custom-scrollbar w-full min-w-0">
                  <div className="max-w-3xl mx-auto w-full min-w-0 flex flex-col pt-2 pb-4">
                    {messages.map((m, i) => (
                      <ChatMessageItem key={i} m={m} index={i} isLast={i === messages.length - 1} loading={loading} isTypingGlobal={isTyping} displayedContent={m.content} onRegenerate={() => handleEditSubmit(i-1, messages[i-1].content)} onEditSubmit={handleEditSubmit} sessionId={activeSessionId} />
                    ))}
                    {loading && messages[messages.length - 1]?.role === 'user' && (<div className="flex items-center gap-2.5 px-2 py-2 ml-1 min-w-0"><Loader2 className="animate-spin text-zinc-400 shrink-0" size={14} /><span className="text-[13px] font-medium text-zinc-500 truncate">Thinking...</span></div>)}
                  </div>
                </div>
              )}
              
              {messages.length > 0 && (
                <div className="shrink-0 bg-gradient-to-t from-white via-white dark:from-[#050505] dark:via-[#050505] to-transparent pt-4 pb-4 sm:pb-6 w-full min-w-0">
                  <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 min-w-0 pointer-events-auto">
                    {/* 🚀 FIXED: View-Only logic completely removed. Always renders ChatPromptBar now! */}
                    <ChatPromptBar onSubmit={(text, files) => submitPrompt(text, files, [])} isGenerating={loading} onStop={handleStop} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-[#050505]"><Loader2 className="animate-spin text-zinc-400" size={24} /></div>}>
      <ActiveStudySessionPage />
    </Suspense>
  )
}