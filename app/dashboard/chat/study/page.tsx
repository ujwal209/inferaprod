'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Loader2 } from 'lucide-react'

// 🚀 STUDY COMPONENTS
import { StudyHeader } from '@/components/study/StudyHeader'
import { StudySidebar } from '@/components/study/StudySidebar'
import { WelcomeHero } from '@/components/study/WelcomeHero'
import { QuizHistoryModal } from '@/components/study/QuizHistoryModal'

// 🚀 UTILS & ACTIONS
import { 
  getStudySessions, deleteStudySession, renameStudySession, 
  initializeSession, sendStudyMessage 
} from '@/app/actions/study'
import { uploadFilesDirectly } from '@/utils/uploadHelper'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient();

export default function StudyLandingPage() {
  const router = useRouter();

  // 🚀 STATE
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [filter, setFilter] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuizHistory, setShowQuizHistory] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 🚀 FETCH SESSIONS FOR SIDEBAR
  const fetchSessions = useCallback(async () => {
    try {
      const data = await getStudySessions();
      setSessions(data || []);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // 🚀 HANDLERS
  const handleRemoveFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteStudySession(id);
      fetchSessions();
    } catch (error) {
      toast.error("Failed to delete session.");
    }
  };

  const handleRename = async (e: React.MouseEvent, id: string, newTitle: string) => {
    e.stopPropagation();
    try {
      await renameStudySession(id, newTitle);
      fetchSessions();
    } catch (error) {
      toast.error("Failed to rename session.");
    }
  };

  const onStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    setIsUploading(false);
  };

  // 🚀 INITIALIZE NEW SESSION
  const onInitSubmit = async (e: React.FormEvent, files: File[], formData: FormData) => {
    e.preventDefault();
    if (loading || isUploading) return;

    const subject = formData.get('subject') as string;
    const level = formData.get('level') as string;
    const question = formData.get('question') as string;

    const userMessage = `Topic: ${subject} (${level})\nQuestion: ${question}\n\nPlease start teaching me step-by-step.`;

    try {
      setLoading(true);
      
      // 1. Create the session in DB
      const targetSessionId = await initializeSession(userMessage.slice(0, 35));

      // 2. Upload Files if attached
      let uploadedUrls: string[] = [];
      if (files.length > 0) {
        setIsUploading(true);
        abortControllerRef.current = new AbortController();
        try {
          uploadedUrls = await uploadFilesDirectly(files, targetSessionId, abortControllerRef.current.signal);
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.log('Upload aborted');
            return;
          }
          throw err;
        } finally {
          setIsUploading(false);
          abortControllerRef.current = null;
        }
      }

      // 3. Fire the first AI message (We await this so the UI is ready when redirected)
      await sendStudyMessage(targetSessionId, userMessage, uploadedUrls);

      // 4. Redirect to the newly created session page
      router.push(`/dashboard/chat/study/${targetSessionId}`);
      
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to initialize workspace.");
      setLoading(false);
      setIsUploading(false);
    }
  };

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

      {/* 🚀 FIXED RESPONSIVE SHELL (100dvh strictly locks the UI to prevent mobile Safari blowout) */}
      <div className="fixed inset-0 top-[56px] sm:top-[64px] flex w-full h-[calc(100dvh-56px)] sm:h-[calc(100dvh-64px)] overflow-hidden bg-white dark:bg-[#050505] font-inter text-zinc-900 dark:text-zinc-100 antialiased min-w-0">

        {/* 🚀 SIDEBAR (Desktop) */}
        <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0c0c0e] relative z-30 min-w-0 transition-all duration-300">
          <StudySidebar 
            sessions={sessions} 
            sessionId={null} 
            filter={filter} 
            setFilter={setFilter} 
            loadSession={(id: string) => router.push(`/dashboard/chat/study/${id}`)} 
            saveRename={handleRename} 
            handleDelete={handleDelete} 
            createNewSession={() => {}} 
            onShowQuizHistory={() => setShowQuizHistory(true)}
          />
        </aside>

        {/* 🚀 MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-w-0 relative h-full bg-white dark:bg-[#050505] w-full overflow-hidden">
          
          <StudyHeader 
            sessionId={null} 
            title="New Study Workspace" 
            isArchived={false}
            canClone={false}
            onMobileMenuOpen={() => setMobileMenuOpen(true)}
          />

          <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-0 custom-scrollbar w-full min-w-0 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] w-full animate-in fade-in duration-500">
                <div className="flex flex-col items-center gap-4 bg-zinc-50 dark:bg-[#111113] p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-sm w-[90%] text-center mx-auto">
                  <Loader2 size={28} className="animate-spin text-blue-600 dark:text-blue-500" />
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-[15px] text-zinc-900 dark:text-white">
                      {isUploading ? "Uploading Documents..." : "Preparing Workspace..."}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      Configuring AI and setting up your environment.
                    </span>
                  </div>
                  {(loading || isUploading) && (
                    <button onClick={onStop} className="mt-2 px-4 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors bg-zinc-200/50 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full max-w-4xl mx-auto min-w-0 px-4 py-8 sm:py-12 flex-1 flex flex-col">
                <WelcomeHero 
                  onInitSubmit={onInitSubmit} 
                  loading={loading} 
                  isUploading={isUploading} 
                  onStop={onStop} 
                  uploadedFiles={uploadedFiles} 
                  removeFile={handleRemoveFile}
                  setUploadedFiles={setUploadedFiles} // Passed down to allow direct updates if needed by Hero
                />
              </div>
            )}
          </div>
        </main>

        {/* 🚀 MOBILE SIDEBAR OVERLAY */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden transition-opacity" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-[80vw] max-w-[320px] bg-zinc-50 dark:bg-[#0c0c0e] flex flex-col shadow-2xl animate-in slide-in-from-left duration-300 border-r border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
              <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center px-4 shrink-0 bg-white dark:bg-[#050505]">
                <span className="font-semibold text-sm text-zinc-900 dark:text-white">Study Workspaces</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden min-w-0 w-full relative">
                <StudySidebar 
                  sessions={sessions} 
                  sessionId={null} 
                  filter={filter} 
                  setFilter={setFilter} 
                  loadSession={(id: string) => { setMobileMenuOpen(false); router.push(`/dashboard/chat/study/${id}`); }} 
                  saveRename={handleRename} 
                  handleDelete={handleDelete} 
                  createNewSession={() => setMobileMenuOpen(false)} 
                  onShowQuizHistory={() => { setMobileMenuOpen(false); setShowQuizHistory(true); }}
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 🚀 MODALS */}
      <div className="relative z-[999]">
        <QuizHistoryModal 
          isOpen={showQuizHistory}
          onClose={() => setShowQuizHistory(false)}
        />
      </div>
    </>
  );
}