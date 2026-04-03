'use client'

import React, { useState, useRef, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  Loader2, X, ThumbsUp, ThumbsDown, 
  RefreshCw, CheckCircle2, PenLine 
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
  // Unwrap params using React.use() for Next.js 15+ compatibility
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;
  const router = useRouter();

  // 🚀 STATE
  const [messages, setMessages] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Default true since we are loading an ID
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

  // 🚀 FETCH SESSIONS
  const fetchSessions = useCallback(async () => {
    const data = await getStudySessions();
    setSessions(data);
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
      setMessages(msgs);
      setCurrentSession(sessionData);
    } catch (e) {
      toast.error("Failed to load session data.");
      router.push('/dashboard/chat/study/new'); // Fallback route
    }
    setLoading(false);
    setMobileMenuOpen(false);
  }, [router]);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  // 🚀 AUTO-SCROLL
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading, isTyping, isUploading]);

  // 🚀 SESSION HANDLERS
  const handleCreateNew = () => {
    router.push('/dashboard/chat/study/new'); // Must create a new landing page route
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
      // 1. Show User Message Immediately
      const previewFiles = files.map(f => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        if (['png','jpg','jpeg','webp','gif'].includes(ext)) return `\n\n![${f.name}](${URL.createObjectURL(f)})`;
        return `\n\n[${f.name}](attachment)`;
      }).join("");
      
      setMessages(prev => [...prev, { role: 'user', content: text + previewFiles }]);

      // 2. Upload Files
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

      // 3. Send to AI
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

  // 🚀 UI COMPONENT MAPPING
  const currentTitle = currentSession?.title || "Study Session";
  const isGuest = currentSession && currentUserId && currentSession.user_id !== currentUserId;

  return (
    <>
      <div className="fixed inset-0 top-14 sm:top-16 flex w-full h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] overflow-hidden bg-[#fafafa] dark:bg-[#050505] font-outfit text-zinc-900 dark:text-zinc-100 antialiased">

        {/* 🚀 SIDEBAR (Desktop) */}
        <aside className="hidden md:flex flex-col w-[280px] shrink-0 border-r border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#050505] relative z-30">
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

        {/* 🚀 MAIN CHAT AREA */}
        <main className="flex-1 flex flex-col min-w-0 relative h-full bg-white dark:bg-[#050505]">
          
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

          {/* 🚀 MESSAGES CONTENT */}
          <div 
            ref={scrollRef} 
            className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-8 sm:space-y-12 custom-scrollbar pb-32 relative z-0"
          >
            {loading && messages.length === 0 ? (
               <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
               </div>
            ) : (
              <div className="max-w-4xl mx-auto w-full space-y-10 sm:space-y-12 pb-44">
                {messages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col gap-2 w-full animate-in fade-in duration-300 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`relative ${m.role === 'user' ? 'max-w-[90%] sm:max-w-[80%] bg-zinc-100 dark:bg-zinc-800/80 px-5 py-3.5 rounded-2xl text-zinc-900 dark:text-zinc-100' : 'w-full text-zinc-900 dark:text-zinc-200'}`}>
                      {editingMessageId === idx ? (
                        <div className="flex flex-col gap-3 w-full">
                           <textarea 
                             className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-sm font-outfit outline-none focus:border-blue-500 min-h-[100px] resize-none"
                             autoFocus
                             value={editMessageValue}
                             onChange={(e) => setEditMessageValue(e.target.value)}
                           />
                           <div className="flex items-center justify-end gap-2">
                             <button onClick={() => setEditingMessageId(null)} className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
                             <button onClick={() => { handleEditSubmit(idx, editMessageValue); setEditingMessageId(null); }} className="px-4 py-2 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">Save & Resend</button>
                           </div>
                        </div>
                      ) : (
                        <StudyMarkdown 
                          content={m.content} 
                          role={m.role} 
                          isLast={idx === messages.length - 1}
                          isTyping={isTyping && idx === messages.length - 1}
                          sessionId={sessionId || undefined}
                          onAnswerSubmitted={(txt: string) => handleChatSubmit(txt)}
                          isCompleted={currentSession?.status === 'completed'}
                        />
                      )}
                    </div>

                    {/* Actions under message */}
                    {!editingMessageId && (
                      <div className={`flex items-center gap-1 text-zinc-400 mt-1 ${m.role === 'user' ? 'mr-2 justify-end' : 'ml-0 justify-start'}`}>
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
                            <button onClick={() => { setEditingMessageId(idx); setEditMessageValue(m.content); }} className="p-1.5 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors" title="Edit message"><PenLine size={14} /></button>
                            <CopyButton text={m.content} />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex items-center gap-4 animate-in fade-in duration-500">
                     <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Loader2 size={16} className="text-zinc-500 animate-spin" />
                     </div>
                     <div className="text-sm font-medium text-zinc-500">Generating response...</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🚀 INPUT AREA */}
          <div className="absolute bottom-0 left-0 right-0 z-50">
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
        </main>

        {/* 🚀 MOBILE SIDEBAR OVERLAY */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200" onClick={() => setMobileMenuOpen(false)}>
             <aside className="w-[280px] h-full bg-white dark:bg-[#050505] shadow-2xl animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
                <div className="absolute top-3 right-3 z-50">
                   <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 rounded-lg transition-colors"><X size={18} /></button>
                </div>
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
                  createNewSession={handleCreateNew} 
                  onShowQuizHistory={() => setShowQuizHistory(true)}
                />
             </aside>
          </div>
        )}
      </div>

      {/* 🚀 MODALS RENDERED AT HIGHEST LEVEL TO PREVENT Z-INDEX CLIPPING */}
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