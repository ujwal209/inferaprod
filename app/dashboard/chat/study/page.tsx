'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X } from 'lucide-react'

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
    const data = await getStudySessions();
    setSessions(data);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // 🚀 HANDLERS
  const handleRemoveFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDelete = async (e: any, id: string) => {
    e.stopPropagation();
    await deleteStudySession(id);
    fetchSessions();
  };

  const handleRename = async (e: any, id: string, newTitle: string) => {
    e.stopPropagation();
    await renameStudySession(id, newTitle);
    fetchSessions();
  };

  const onStop = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setLoading(false);
    setIsUploading(false);
  };

  // 🚀 INITIALIZE NEW SESSION
  const onInitSubmit = async (e: any, files: File[], formData: FormData) => {
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
          if (err.name === 'AbortError') return;
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
      <div className="fixed inset-0 top-14 sm:top-16 flex w-full h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] overflow-hidden bg-[#fafafa] dark:bg-[#050505] font-outfit text-zinc-900 dark:text-zinc-100 antialiased">

        {/* 🚀 SIDEBAR (Desktop) */}
        <aside className="hidden md:flex flex-col w-[280px] shrink-0 border-r border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#050505] relative z-30">
          <StudySidebar 
            sessions={sessions} 
            sessionId={null} 
            filter={filter} 
            setFilter={setFilter} 
            loadSession={(id: string) => router.push(`/dashboard/chat/study/${id}`)} 
            saveRename={handleRename} 
            handleDelete={handleDelete} 
            createNewSession={() => {}} // Already on the new session page
            onShowQuizHistory={() => setShowQuizHistory(true)}
          />
        </aside>

        {/* 🚀 MAIN AREA */}
        <main className="flex-1 flex flex-col min-w-0 relative h-full bg-white dark:bg-[#050505]">
          
          <StudyHeader 
            sessionId={null} // null hides the share/archive/duplicate buttons
            title="New Workspace" 
            isArchived={false}
            canClone={false}
            onMobileMenuOpen={() => setMobileMenuOpen(true)}
          />

          <div className="flex-1 overflow-y-auto relative z-0">
            <WelcomeHero 
              onInitSubmit={onInitSubmit} 
              loading={loading} 
              isUploading={isUploading} 
              onStop={onStop} 
              uploadedFiles={uploadedFiles} 
              removeFile={handleRemoveFile} 
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
                  sessionId={null} 
                  filter={filter} 
                  setFilter={setFilter} 
                  loadSession={(id: string) => { setMobileMenuOpen(false); router.push(`/dashboard/chat/study/${id}`); }} 
                  saveRename={handleRename} 
                  handleDelete={handleDelete} 
                  createNewSession={() => setMobileMenuOpen(false)} 
                  onShowQuizHistory={() => { setMobileMenuOpen(false); setShowQuizHistory(true); }}
                />
             </aside>
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