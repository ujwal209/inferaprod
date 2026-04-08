'use client'

import React, { useState, useRef, useEffect, useCallback, use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  Loader2, X, ThumbsUp, ThumbsDown, 
  RefreshCw, CheckCircle2, PenLine, FileText 
} from 'lucide-react'

// 🚀 STUDY COMPONENTS
import { StudyHeader } from '@/components/study/StudyHeader'
import { StudySidebar } from '@/components/study/StudySidebar'
import { ChatInput } from '@/components/study/ChatInput'
import { QuizHistoryModal } from '@/components/study/QuizHistoryModal'
import { ShareModal } from '@/components/ShareModal'
import { RenameModal } from '@/components/RenameModal'
import { StudyMarkdown, CopyButton } from '@/components/StudyMarkdown'

// 🚀 UTILS & ACTIONS
import { 
  getStudySessions, getStudyMessages, deleteStudySession, 
  renameStudySession, sendStudyMessage, initializeSession, 
  archiveStudySession, shareStudySession, getStudySessionById, 
  duplicateStudySession 
} from '@/app/actions/study'
import { uploadFilesDirectly } from '@/utils/uploadHelper'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient();

export default function ActiveStudySessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;
  const router = useRouter();

  // 🚀 STATE
  const [messages, setMessages] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [forceStop, setForceStop] = useState(false);
  
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showQuizHistory, setShowQuizHistory] = useState(false);
  const [editMessageValue, setEditMessageValue] = useState("");
  const [editTitle, setEditTitle] = useState('');
  const [filter, setFilter] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 🚀 THE FIX: Use a Ref instead of State for scrolling to prevent re-renders!
  const isUserScrolledUp = useRef(false);

  // 🚀 FETCH SESSIONS
  const fetchSessions = useCallback(async () => {
    try {
      const data = await getStudySessions();
      setSessions(data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, [fetchSessions]);

  // 🚀 LOAD SPECIFIC SESSION
  const loadSession = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [msgs, sessionData] = await Promise.all([
        getStudyMessages(id),
        getStudySessionById(id)
      ]);
      setMessages(msgs || []);
      setCurrentSession(sessionData);
    } catch (e) {
      toast.error("Failed to load session data.");
      router.push('/dashboard/chat/study');
    }
    setLoading(false);
    setMobileMenuOpen(false);
  }, [router]);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  // 🚀 SILENT SCROLL HANDLER (No React state changes = zero lag)
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    isUserScrolledUp.current = !isNearBottom;
  }, []);

  useEffect(() => {
    if (scrollRef.current && !isUserScrolledUp.current && !isTyping && !isUploading) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading, isTyping, isUploading]);

  // 🚀 SESSION HANDLERS
  const handleCreateNew = () => {
    router.push('/dashboard/chat/study'); 
  };

  const handleDelete = async (e: any, id: string) => {
    e.stopPropagation();
    await deleteStudySession(id);
    if (sessionId === id) handleCreateNew();
    fetchSessions();
  };

  const handleRename = async (e: any, id: string) => {
    e.stopPropagation();
    await renameStudySession(id, editTitle);
    setEditingId(null);
    fetchSessions();
  };

  const handleArchive = async () => {
    if (!sessionId) return;
    const promise = archiveStudySession(sessionId);
    toast.promise(promise, {
      loading: 'Archiving session...',
      success: () => {
        fetchSessions();
        handleCreateNew();
        return "Session archived successfully.";
      },
      error: 'Failed to archive session.'
    });
  };

  const handleClone = async () => {
    if (!sessionId) return;
    try {
      const newId = await duplicateStudySession(sessionId);
      router.push(`/dashboard/chat/study/${newId}`);
      toast.success("Session duplicated successfully!");
    } catch (err) {
      toast.error("Failed to duplicate session.");
    }
  };

  const handleRenameSession = async (newTitle: string) => {
    if (!sessionId) return;
    try {
      await renameStudySession(sessionId, newTitle);
      fetchSessions();
      setCurrentSession((prev: any) => ({ ...prev, title: newTitle }));
      toast.success("Session renamed successfully.");
    } catch (err) {
      toast.error("Failed to rename session.");
    }
  };

  // 🚀 CHAT HANDLERS
  const handleChatSubmit = async (text: string, files: File[] = []) => {
    if (loading || isTyping || isUploading || !sessionId) return;
    const reqId = ++requestRef.current;
    
    try {
      const previewFiles = files.map(f => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        if (['png','jpg','jpeg','webp','gif'].includes(ext)) return `\n\n![${f.name}](${URL.createObjectURL(f)})`;
        return `\n\n[${f.name}](attachment)`;
      }).join("");
      
      setMessages(prev => [...prev, { role: 'user', content: text + previewFiles }]);
      isUserScrolledUp.current = false; // Force auto-scroll to bottom

      let uploadedUrls: string[] = [];
      if (files.length > 0) {
        setIsUploading(true);
        abortControllerRef.current = new AbortController();
        try {
          uploadedUrls = await uploadFilesDirectly(files, sessionId, abortControllerRef.current.signal);
        } catch (err: any) {
          if (err.name === 'AbortError') return;
          throw err;
        } finally {
          setIsUploading(false);
          abortControllerRef.current = null;
        }
      }

      setLoading(true);
      setIsTyping(true);
      setUploadedFiles([]);

      const res = await sendStudyMessage(sessionId, text, uploadedUrls);
      if (requestRef.current !== reqId) return;

      setMessages(prev => [...prev, { role: 'assistant', content: res.content }]);
      
      setIsTyping(false); 
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to send message.");
      setIsTyping(false);
      setLoading(false);
      setIsUploading(false);
    }
  };

  const memoizedAnswerSubmit = useCallback((txt: string) => {
    handleChatSubmit(txt);
  }, [sessionId, loading, isTyping, isUploading]);

  const onStop = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setForceStop(true);
    setLoading(false);
    setIsUploading(false);
    setIsTyping(false);
  };

  const handleRemoveFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFileClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e: any) => setUploadedFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    input.click();
  };
  
  const handleRegenerate = async (index: number) => {
    if (loading || isTyping || isUploading) return;
    let userMsgIndex = -1;
    let lastUserMsg = "";
    for (let i = index; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMsg = messages[i].content;
        userMsgIndex = i;
        break;
      }
    }
    if (userMsgIndex !== -1) {
      setMessages(prev => prev.slice(0, userMsgIndex + 1));
      handleChatSubmit(lastUserMsg);
    }
  };

  const handleEditSubmit = (index: number, newContent: string) => {
    if (loading || isTyping || isUploading) return;
    const newMessages = messages.slice(0, index);
    setMessages(newMessages);
    handleChatSubmit(newContent);
  };

  const handleMarkAsDone = () => {
    if (loading || isUploading) return;
    const autoPrompt = "I've understood this, move to next.";
    handleChatSubmit(autoPrompt);
    toast.success("Concept marked as complete. Generating next steps...");
  };

  // 🚀 USER MESSAGE RENDERER (Parses Images, Links, & Removes Hidden Prompts)
  const renderUserMessage = (rawText: string) => {
    // 1. Hide the extracted document context and orchestration blocks from UI
    let cleanText = rawText.replace(/\[STUDY MATERIAL CONTEXT FOR .*?\][\s\S]*?\[END OF DOCUMENT CONTEXT\]/g, '');
    cleanText = cleanText.replace(/\[AUTO-EXTRACTED DOCUMENT CONTEXT FOR .*?\][\s\S]*?\[END OF DOCUMENT CONTEXT\]/g, '');
    cleanText = cleanText.replace(/\[ORCHESTRATION CONTEXT\][\s\S]*/, '');
    
    // 2. Split by Markdown Image ![alt](url) OR File [alt](url)
    const regex = /(!?\[[^\]]*\]\([^)]+\))/g;
    const parts = cleanText.split(regex);
    
    return (
      <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words font-inter">
        {parts.map((part, i) => {
          const trimmedPart = part.trim();

          // A. Detect Image Markdown
          const imgMatch = trimmedPart.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
          if (imgMatch) {
            return (
              <div key={i} className="my-3 flex flex-col items-start">
                <img 
                  src={imgMatch[2]} 
                  alt={imgMatch[1]} 
                  className="w-full max-w-full sm:max-w-md h-auto rounded-lg border border-black/10 dark:border-white/10 shadow-sm object-contain bg-white dark:bg-zinc-900" 
                  loading="lazy"
                />
              </div>
            );
          }
          
          // B. Detect File/Document Markdown
          const fileMatch = trimmedPart.match(/^\[([^\]]*)\]\(([^)]+)\)$/);
          if (fileMatch) {
            let displayName = fileMatch[1];
            const fileUrl = fileMatch[2];
            const isOptimistic = fileUrl === 'attachment';

            if (!isOptimistic && (displayName.includes('Attached File') || displayName.includes('Attached Document') || displayName.includes('Attached Study Material'))) {
                const urlParts = fileUrl.split('/');
                const lastSegment = urlParts[urlParts.length - 1].split('?')[0];
                if (lastSegment && lastSegment.includes('.')) {
                    displayName = lastSegment;
                }
            }

            return (
              <div key={i} className="my-2">
                <a 
                  href={isOptimistic ? '#' : fileUrl} 
                  target={isOptimistic ? '_self' : '_blank'} 
                  rel="noopener noreferrer" 
                  onClick={(e) => isOptimistic && e.preventDefault()}
                  className={`inline-flex items-center gap-2 px-3 py-2 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg text-sm font-medium transition-colors break-all ${isOptimistic ? 'opacity-70 cursor-wait' : 'hover:bg-black/10 dark:hover:bg-white/20'}`}
                >
                  <FileText size={16} className="text-white dark:text-zinc-900 shrink-0" /> 
                  <span className="truncate">{displayName}</span>
                </a>
              </div>
            );
          }
          
          // C. Regular Text
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  const currentTitle = currentSession?.title || "Study Session";
  const isGuest = currentSession && currentUserId && currentSession.user_id !== currentUserId;

  // 🚀 THE FIX: Memoize the entire message list so it ignores external state changes
  const renderedMessages = useMemo(() => {
    return messages.map((m, idx) => (
      <div 
        key={idx} 
        className={`flex flex-col gap-2 w-full animate-in fade-in duration-300 min-w-0 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
      >
        <div className={`
          w-fit max-w-[95%] md:max-w-[85%] lg:max-w-[75%] min-w-0 overflow-hidden
          ${m.role === 'user' 
            ? 'px-4 py-3.5 rounded-xl shadow-sm border bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900' 
            : 'w-full text-zinc-900 dark:text-zinc-100'
          }
        `}>
          {editingMessageId === idx ? (
            <div className="flex flex-col gap-3 w-full sm:w-[400px] max-w-full">
               <textarea 
                 className="w-full bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg p-3 text-sm outline-none resize-y min-h-[100px] text-white dark:text-zinc-900 focus:border-blue-500 transition-colors"
                 autoFocus
                 value={editMessageValue}
                 onChange={(e) => setEditMessageValue(e.target.value)}
                 placeholder="Edit your message..."
               />
               <div className="flex items-center justify-end gap-2">
                 <button onClick={() => setEditingMessageId(null)} className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors">Cancel</button>
                 <button onClick={() => { handleEditSubmit(idx, editMessageValue); setEditingMessageId(null); }} className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors border border-blue-700">Save & Resend</button>
               </div>
            </div>
          ) : (
            m.role === 'user' ? (
              renderUserMessage(m.content)
            ) : (
              <div className="w-full min-w-0">
                <StudyMarkdown 
                  content={m.content} 
                  role={m.role} 
                  isLast={idx === messages.length - 1}
                  isTyping={isTyping && idx === messages.length - 1}
                  sessionId={sessionId || undefined}
                  onAnswerSubmitted={memoizedAnswerSubmit}
                  isCompleted={currentSession?.status === 'completed'}
                />
              </div>
            )
          )}
        </div>

        {/* Actions under message */}
        {!editingMessageId && (
          <div className={`flex items-center gap-1 text-zinc-400 mt-1 px-1 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' ? (
              <>
                <button className="p-1.5 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"><ThumbsUp size={14} /></button>
                <button className="p-1.5 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"><ThumbsDown size={14} /></button>
                <div className="w-[1px] h-3 bg-zinc-200 dark:bg-zinc-800 mx-1" />
                <button onClick={() => handleRegenerate(idx)} className="p-1.5 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors" title="Regenerate"><RefreshCw size={14} /></button>
                <button onClick={handleMarkAsDone} className="p-1.5 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors" title="Mark as complete"><CheckCircle2 size={14} /></button>
                <CopyButton text={m.content} />
              </>
            ) : (
              <>
                <button onClick={() => { setEditingMessageId(idx); setEditMessageValue(m.content); }} className="p-1.5 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors" title="Edit message"><PenLine size={14} /></button>
                <CopyButton text={m.content} />
              </>
            )}
          </div>
        )}
      </div>
    ));
  }, [messages, editingMessageId, editMessageValue, isTyping, currentSession?.status, sessionId, memoizedAnswerSubmit]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .font-inter { font-family: 'Inter', sans-serif !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.5); }
      `}} />

      <div className="fixed inset-0 top-[56px] sm:top-[64px] flex w-full h-[calc(100dvh-56px)] sm:h-[calc(100dvh-64px)] overflow-hidden bg-white dark:bg-[#050505] font-inter text-zinc-900 dark:text-zinc-100 antialiased min-w-0">

        {/* SIDEBAR */}
        <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0c0c0e] relative z-30 min-w-0">
          <StudySidebar 
            sessions={sessions} 
            sessionId={sessionId} 
            filter={filter} 
            setFilter={setFilter} 
            loadSession={(id: string) => router.push(`/dashboard/chat/study/${id}`)} 
            setEditingId={setEditingId} 
            editingId={editingId} 
            editTitle={editTitle} 
            setEditTitle={setEditTitle} 
            saveRename={handleRename} 
            handleDelete={handleDelete} 
            createNewSession={handleCreateNew} 
            onShowQuizHistory={() => setShowQuizHistory(true)}
          />
        </aside>

        {/* MAIN CHAT AREA */}
        <main className="flex-1 flex flex-col min-w-0 relative h-full bg-white dark:bg-[#050505] overflow-hidden">
          
          <StudyHeader 
            sessionId={sessionId} 
            title={currentTitle} 
            isArchived={currentSession?.is_archived}
            canClone={isGuest}
            onClone={handleClone}
            onShare={() => setShowShareModal(true)}
            onArchive={handleArchive} 
            onMobileMenuOpen={() => setMobileMenuOpen(true)}
            onRename={() => setShowRenameModal(true)}
          />

          {/* MESSAGES */}
          <div 
            ref={scrollRef} 
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 scroll-smooth custom-scrollbar w-full min-w-0 relative z-0"
          >
            {loading && messages.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-500" />
                  <span className="text-sm font-medium">Loading session...</span>
               </div>
            ) : (
              <div className="max-w-4xl mx-auto w-full space-y-8 sm:space-y-10 pb-4">
                
                {/* 🚀 Render the heavily cached messages array */}
                {renderedMessages}
                
                {isTyping && (
                  <div className="flex items-center gap-3 animate-in fade-in duration-500 px-2">
                     <Loader2 size={16} className="text-blue-600 dark:text-blue-500 animate-spin shrink-0" />
                     <div className="text-[13px] font-medium text-zinc-500 truncate">Generating response...</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* INPUT AREA */}
          <div className="shrink-0 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800/80 p-3 sm:p-4 w-full z-10 min-w-0">
            <div className="max-w-4xl mx-auto w-full">
              <ChatInput 
                onSubmit={handleChatSubmit} 
                loading={isTyping || isUploading} 
                isUploading={isUploading} 
                onStop={onStop} 
                uploadedFiles={uploadedFiles} 
                removeFile={handleRemoveFile}
                onUploadClick={handleFileClick}
                onShowQuizHistory={() => setShowQuizHistory(true)}
              />
            </div>
          </div>
        </main>

        {/* MOBILE SIDEBAR OVERLAY */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200" onClick={() => setMobileMenuOpen(false)}>
             <aside className="w-[280px] h-full bg-zinc-50 dark:bg-[#0c0c0e] shadow-2xl animate-in slide-in-from-left duration-300 border-r border-zinc-200 dark:border-zinc-800 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center px-4 shrink-0 bg-white dark:bg-[#050505]">
                  <span className="font-semibold text-sm text-zinc-900 dark:text-white">Study Workspaces</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-hidden min-w-0 w-full relative">
                  <StudySidebar 
                    sessions={sessions} 
                    sessionId={sessionId} 
                    filter={filter} 
                    setFilter={setFilter} 
                    loadSession={(id: string) => { setMobileMenuOpen(false); router.push(`/dashboard/chat/study/${id}`); }} 
                    setEditingId={setEditingId} 
                    editingId={editingId} 
                    editTitle={editTitle} 
                    setEditTitle={setEditTitle} 
                    saveRename={handleRename} 
                    handleDelete={handleDelete} 
                    createNewSession={() => { setMobileMenuOpen(false); handleCreateNew(); }} 
                    onShowQuizHistory={() => { setMobileMenuOpen(false); setShowQuizHistory(true); }}
                  />
                </div>
             </aside>
          </div>
        )}
      </div>

      {/* MODALS */}
      <div className="relative z-[999]">
        <QuizHistoryModal 
          isOpen={showQuizHistory}
          onClose={() => setShowQuizHistory(false)}
        />

        {sessionId && (
          <ShareModal 
            isOpen={showShareModal} 
            onClose={() => setShowShareModal(false)} 
            sessionId={sessionId} 
            sessionTitle={currentTitle}
            onShare={async () => { 
              const link = await shareStudySession(sessionId);
              return link;
            }}
          />
        )}

        {sessionId && (
          <RenameModal 
            isOpen={showRenameModal}
            onClose={() => setShowRenameModal(false)}
            currentTitle={currentTitle}
            onRename={handleRenameSession}
          />
        )}
      </div>
    </>
  );
}