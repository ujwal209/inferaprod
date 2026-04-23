'use client'

import React, { useState, useEffect, useRef, useMemo, MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { 
  getSessions, deleteSession, renameSession, deleteSessions, initializeSession, unarchiveSession 
} from '@/app/actions/coaching'
import { 
  Menu, X, Loader2, Plus, Search, Trash2, Edit3, 
  Archive, ChevronDown, ChevronRight, CheckSquare, 
  Square, MessageSquare, Send, Zap, Globe, ArchiveRestore
} from 'lucide-react'

// --- 1. RENAME MODAL COMPONENT (Self-Contained) ---
const RenameModal = ({ isOpen, onClose, currentTitle, onRename }: any) => {
  const [title, setTitle] = useState(currentTitle);
  useEffect(() => { setTitle(currentTitle); }, [currentTitle, isOpen]);
  
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111113] rounded-lg w-full max-w-sm overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-white">Rename Session</h3>
        </div>
        <div className="p-4">
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 text-sm text-zinc-900 dark:text-white"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') { onRename(title); onClose(); } if (e.key === 'Escape') onClose(); }}
          />
        </div>
        <div className="p-3 bg-zinc-50 dark:bg-[#0c0c0e] border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors">Cancel</button>
          <button onClick={() => { onRename(title); onClose(); }} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors shadow-sm">Save</button>
        </div>
      </div>
    </div>
  )
}

// --- 2. SIDEBAR COMPONENT (Self-Contained) ---
interface Session { id: string; title: string; updated_at: string; status?: 'active' | 'archived' | 'shared' }

const SessionItem = ({ s, isBulkMode, isSelected, onToggleSelect, onRename, onDelete, onUnarchive, loadSession, isArchived }: any) => {
  return (
    <div 
      onClick={() => isBulkMode ? onToggleSelect(s.id) : loadSession(s.id)}
      className="group flex items-center justify-between p-2 rounded-md cursor-pointer transition-all w-full min-w-0 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="shrink-0 flex items-center justify-center">
          {isBulkMode ? (
            <div className={`transition-colors ${isSelected ? 'text-blue-600' : 'hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
              {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
            </div>
          ) : (
            <MessageSquare size={14} className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
          )}
        </div>
        <span className="text-sm truncate min-w-0 w-full transition-colors font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-200">{s.title}</span>
      </div>
      {!isBulkMode && (
        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0 ml-2">
          {isArchived ? (
            <button onClick={(e) => { e.stopPropagation(); onUnarchive(e, s.id); }} className="p-1 text-blue-500 hover:text-blue-600 transition-colors rounded hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Restore Chat">
              <ArchiveRestore size={13} />
            </button>
          ) : (
            <>
              <button onClick={(e)=>{ e.stopPropagation(); onRename(s.id, s.title); }} className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded hover:bg-zinc-200 dark:hover:bg-zinc-700" title="Rename"><Edit3 size={13} /></button>
              <button onClick={(e)=>{ e.stopPropagation(); onDelete(e, s.id); }} className="p-1 text-zinc-400 hover:text-red-500 transition-colors rounded hover:bg-zinc-200 dark:hover:bg-zinc-700" title="Delete"><Trash2 size={13} /></button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// --- 3. PROMPT BAR COMPONENT (Self-Contained) ---
const IntegratedPromptBar = ({ onSubmit, isGenerating }: { onSubmit: (text: string) => void, isGenerating: boolean }) => {
  const [text, setText] = useState('')
  const [deepSearch, setDeepSearch] = useState(false)
  const [webAccess, setWebAccess] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAction();
    }
  }

  const handleAction = () => {
    if (isGenerating) return;
    if (text.trim()) {
      const submittedText = text;
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      onSubmit(submittedText);
    }
  }

  return (
    <div className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 rounded-xl transition-all duration-300 shadow-sm flex flex-col relative overflow-hidden min-w-0">
      
      {/* Input Area */}
      <div className="flex items-end gap-2 px-3 pt-3 pb-2 w-full min-w-0">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="What can I help you with today?"
          className="flex-1 bg-transparent text-[14px] text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-500 min-h-[36px] max-h-[150px] resize-none no-scrollbar pt-2 w-full min-w-0"
          disabled={isGenerating}
          rows={1}
        />
        
        <button
          onClick={handleAction}
          disabled={isGenerating || !text.trim()}
          className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-md transition-all duration-300 ${
            !text.trim()
              ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 pointer-events-none'
              : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 shadow-sm'
          }`}
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap items-center gap-2 px-3 pb-3 pt-1 w-full min-w-0">
        <button onClick={() => setDeepSearch(v => !v)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-all shrink-0 ${deepSearch ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white' : 'bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-500'}`}>
          <Zap size={12} className={deepSearch ? 'text-zinc-900 dark:text-white' : ''} />
          <span>Analysis</span>
        </button>
        <button onClick={() => setWebAccess(v => !v)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-all shrink-0 ${webAccess ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white' : 'bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-500'}`}>
          <Globe size={12} className={webAccess ? 'text-zinc-900 dark:text-white' : ''} />
          <span>Web Search</span>
        </button>
      </div>
    </div>
  )
}

// --- 4. MAIN PAGE ---
export default function NewChatLanding() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [filter, setFilter] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<{id: string, title: string} | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  
  const refreshSessions = async () => { setSessions(await getSessions()); };
  useEffect(() => { refreshSessions(); }, []);

  const submitPrompt = async (text: string) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    
    try {
      const newId = await initializeSession(text);
      const promptQuery = text ? `?initialPrompt=${encodeURIComponent(text)}` : '?initialPrompt=';
      
      router.push(`/dashboard/chat/${newId}${promptQuery}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to initialize session.");
      setLoading(false);
    }
  };

  const activeSessions = useMemo(() => sessions.filter(s => s.status !== 'archived' && s.title?.toLowerCase().includes(filter.toLowerCase())), [sessions, filter]);
  const archivedSessions = useMemo(() => sessions.filter(s => s.status === 'archived' && s.title?.toLowerCase().includes(filter.toLowerCase())), [sessions, filter]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  }

  const handleDelete = async (e: MouseEvent | KeyboardEvent, id: string) => {
    e.stopPropagation();
    await deleteSession(id);
    refreshSessions();
  }

  const handleUnarchive = async (e: MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await unarchiveSession(id);
      toast.success("Chat restored to Workspace");
      refreshSessions();
    } catch (err) {
      toast.error("Failed to restore chat");
    }
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    await deleteSessions(ids);
    setIsBulkMode(false);
    setSelectedIds(new Set());
    refreshSessions();
    toast.success(`Deleted ${ids.length} sessions`);
  }

  const onRenameSuccess = async (newTitle: string) => {
    if (!editingSession) return;
    await renameSession(editingSession.id, newTitle);
    toast.success("Session renamed");
    refreshSessions();
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-[#0c0c0e] w-full min-w-0 font-inter">
      <div className="p-3 flex flex-col gap-3 shrink-0 border-b border-zinc-200 dark:border-zinc-800 w-full min-w-0">
        <div className="flex items-center justify-between w-full min-w-0 px-1">
          <span className="font-semibold text-xs tracking-wide text-zinc-500 truncate">Workspace</span>
          <div className="flex items-center gap-2 shrink-0">
             {isBulkMode && selectedIds.size > 0 && (
                <button onClick={handleBulkDelete} className="font-medium text-xs text-red-500 hover:text-red-600 transition-colors flex items-center gap-1">
                  <Trash2 size={12} /> ({selectedIds.size})
                </button>
             )}
             <button onClick={() => { setIsBulkMode(!isBulkMode); setSelectedIds(new Set()); }} className={`font-medium text-xs transition-colors ${isBulkMode ? 'text-blue-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
               {isBulkMode ? 'Done' : 'Edit'}
             </button>
          </div>
        </div>

        <button onClick={() => router.push('/dashboard/chat')} disabled={isBulkMode} className="w-full h-9 flex items-center justify-start gap-2 px-3 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 text-zinc-900 dark:text-white transition-all font-medium text-sm shadow-sm disabled:opacity-50 min-w-0">
          <Plus size={14} className="shrink-0" />
          <span className="truncate">New Chat</span>
        </button>

        <div className="relative group w-full min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input placeholder="Search..." className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 rounded-md text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 space-y-4 py-3 w-full min-w-0 no-scrollbar">
        
        {archivedSessions.length > 0 && (
          <div className="space-y-0.5 pb-2 border-b border-zinc-200 dark:border-zinc-800 w-full min-w-0">
            <button onClick={() => setShowArchived(!showArchived)} className="w-full px-2 py-1.5 flex items-center justify-between group/archive rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Archive size={12} className="text-zinc-400 shrink-0" />
                <span className="font-semibold text-xs text-zinc-500 truncate">Archived</span>
              </div>
              {showArchived ? <ChevronDown size={12} className="text-zinc-400 shrink-0" /> : <ChevronRight size={12} className="text-zinc-400 shrink-0" />}
            </button>
            {showArchived && (
              <div className="space-y-0.5 animate-in slide-in-from-top-1 duration-200 w-full min-w-0 pt-1">
                {archivedSessions.map((s) => (
                  <SessionItem key={s.id} s={s} sessionId={null} isBulkMode={isBulkMode} isSelected={selectedIds.has(s.id)} onToggleSelect={toggleSelect} onUnarchive={handleUnarchive} isArchived={true} loadSession={(id:string) => router.push(`/dashboard/chat/${id}`)} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-0.5 w-full min-w-0">
          {activeSessions.length === 0 && <p className="px-3 py-2 text-xs text-zinc-500 italic">No chats found.</p>}
          {activeSessions.map((s) => (
            <SessionItem key={s.id} s={s} sessionId={null} isBulkMode={isBulkMode} isSelected={selectedIds.has(s.id)} onToggleSelect={toggleSelect} onRename={(id:string, t:string)=>{setEditingSession({id, title:t}); setRenameModalOpen(true);}} onDelete={handleDelete} isArchived={false} loadSession={(id:string) => router.push(`/dashboard/chat/${id}`)} />
          ))}
        </div>

      </div>
      <RenameModal isOpen={renameModalOpen} onClose={() => setRenameModalOpen(false)} currentTitle={editingSession?.title || ""} onRename={onRenameSuccess} />
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 top-[56px] sm:top-[64px] flex w-full h-[calc(100dvh-56px)] sm:h-[calc(100dvh-64px)] overflow-hidden bg-white dark:bg-[#050505] font-sans text-zinc-900 dark:text-zinc-100 min-w-0">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex flex-col w-[260px] shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0c0c0e] min-w-0">
          <SidebarContent />
        </aside>

        {/* MOBILE SIDEBAR OVERLAY */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden transition-opacity" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-[80vw] max-w-[300px] bg-white dark:bg-[#0c0c0e] flex flex-col shadow-2xl animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
              <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center px-4 shrink-0 min-w-0">
                <span className="font-semibold text-sm text-zinc-900 dark:text-white truncate">Workspace</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors shrink-0">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden w-full min-w-0">
                <SidebarContent />
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 relative h-full bg-white dark:bg-[#050505] w-full overflow-hidden">
          
          <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md flex items-center px-4 sm:px-6 z-30 absolute top-0 w-full min-w-0 shrink-0">
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="md:hidden p-1.5 -ml-1.5 mr-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors shrink-0"
            >
              <Menu size={18} />
            </button>
            <h2 className="font-medium text-sm text-zinc-900 dark:text-white truncate">
              New Workspace
            </h2>
          </header>

          <main className="flex-1 flex flex-col items-center pt-14 overflow-y-auto overflow-x-hidden w-full min-w-0 relative custom-scrollbar">
            <div className="w-full max-w-2xl my-auto flex flex-col items-center text-center animate-in fade-in duration-700 min-w-0 relative z-10 py-10 sm:py-16 px-4">
              
              <div className="mb-6 sm:mb-8 w-32 sm:w-40 shrink-0 flex items-center justify-center">
                <Image src="/logo.png" alt="Logo" width={220} height={60} className="w-full h-auto object-contain dark:invert opacity-90" priority />
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-white mb-2 sm:mb-3 tracking-tight break-words w-full leading-tight">
                How can I help you today?
              </h1>
              
              <p className="text-[14px] text-zinc-500 dark:text-zinc-400 mb-8 sm:mb-10 max-w-sm px-2 break-words">
                Ask a question, analyze data, or start a deep dive into a new topic.
              </p>

              <div className="w-full min-w-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-6 bg-zinc-50 dark:bg-[#111113] rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm w-full mx-auto animate-in fade-in zoom-in-95 duration-300">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    <span className="font-medium text-[13px] text-zinc-600 dark:text-zinc-400">Configuring workspace...</span>
                  </div>
                ) : (
                  <IntegratedPromptBar onSubmit={submitPrompt} isGenerating={false} />
                )}
              </div>

            </div>
          </main>
          
        </div>
      </div>
    </>
  )
}