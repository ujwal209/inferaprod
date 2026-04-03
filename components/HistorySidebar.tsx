'use client'

import React, { useState, useMemo, MouseEvent, KeyboardEvent, ChangeEvent } from 'react'
import { 
  Search, Plus, Trash2, Edit3, RefreshCw, 
  Archive, Clock, ChevronDown, ChevronRight, 
  CheckSquare, Square 
} from 'lucide-react'
import { RenameModal } from '@/components/RenameModal'
import { toast } from 'sonner'

interface Session {
  id: string
  title: string
  updated_at: string
  status?: 'active' | 'archived' | 'shared'
}

interface HistorySidebarProps {
  sessions: Session[]
  sessionId: string | null
  loadSession: (id: string) => void
  handleDelete: (e: MouseEvent | KeyboardEvent, id: string) => void
  handleBulkDelete: (ids: string[]) => Promise<void>
  renameSession: (id: string, title: string) => Promise<void>
  refreshSessions: () => void
  createNewSession: () => void
}

interface SessionItemProps {
  s: Session
  sessionId: string | null
  isBulkMode: boolean
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onRename: (id: string, currentTitle: string) => void
  onDelete: (e: MouseEvent | KeyboardEvent, id: string) => void
  loadSession: (id: string) => void
}

const SessionItem = ({ 
  s, sessionId, isBulkMode, isSelected, onToggleSelect, 
  onRename, onDelete, loadSession 
}: SessionItemProps) => {
  const handleClick = (e: React.MouseEvent) => {
    if (isBulkMode) {
      onToggleSelect(s.id);
    } else {
      loadSession(s.id);
    }
  }

  return (
    <div 
      onClick={handleClick}
      className={`group relative p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${
        sessionId === s.id && !isBulkMode 
          ? 'bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-700 shadow-sm' 
          : 'border border-transparent hover:bg-zinc-100 dark:hover:bg-[#0c0c0e]'
      }`}
    >
      <div className="shrink-0">
        {isBulkMode ? (
          <div className={`p-1 rounded-md transition-colors ${isSelected ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' : 'text-zinc-300 dark:text-zinc-700 hover:text-zinc-400'}`}>
            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
          </div>
        ) : (
          <div className={`w-1.5 h-1.5 rounded-full transition-transform duration-300 ${sessionId === s.id ? 'bg-blue-600 scale-125' : 'bg-transparent group-hover:bg-zinc-300'}`} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <button className={`w-full text-left font-outfit text-[14px] truncate transition-colors ${sessionId === s.id && !isBulkMode ? 'font-bold text-zinc-900 dark:text-white' : 'font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'}`}>
          {s.title}
        </button>
      </div>

      {!isBulkMode && (
        <div className="flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
          <button 
            onClick={(e: MouseEvent<HTMLButtonElement>)=>{ e.stopPropagation(); onRename(s.id, s.title); }} 
            className="p-1.5 text-zinc-400 hover:text-blue-600 transition-colors rounded-md hover:bg-white dark:hover:bg-zinc-800" 
            title="Rename"
          >
            <Edit3 size={14} />
          </button>
          <button 
            onClick={(e: MouseEvent<HTMLButtonElement>)=>onDelete(e, s.id)} 
            className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-md hover:bg-white dark:hover:bg-zinc-800" 
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export const HistorySidebar = ({ 
  sessions, 
  sessionId, 
  loadSession, 
  handleDelete, 
  handleBulkDelete,
  renameSession, 
  refreshSessions,
  createNewSession 
}: HistorySidebarProps) => {
  const [filter, setFilter] = useState('')
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<{id: string, title: string} | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const activeSessions = useMemo(() => {
    return (sessions || []).filter(s => 
      (s.status !== 'archived') && 
      (s.title?.toLowerCase().includes(filter.toLowerCase()))
    )
  }, [sessions, filter])

  const archivedSessions = useMemo(() => {
    return (sessions || []).filter(s => 
      (s.status === 'archived') && 
      (s.title?.toLowerCase().includes(filter.toLowerCase()))
    )
  }, [sessions, filter])

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  const handleOpenRename = (id: string, title: string) => {
    setEditingSession({ id, title });
    setRenameModalOpen(true);
  }

  const onRenameSuccess = async (newTitle: string) => {
    if (!editingSession) return;
    await renameSession(editingSession.id, newTitle);
    toast.success("Session renamed successfully");
    refreshSessions();
  }

  const onBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    
    const promise = handleBulkDelete(ids);
    toast.promise(promise, {
      loading: 'Deleting selected sessions...',
      success: () => {
        setIsBulkMode(false);
        setSelectedIds(new Set());
        return `Successfully deleted ${ids.length} sessions`;
      },
      error: 'Failed to delete sessions.'
    });
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-[#050505] border-r border-zinc-200 dark:border-zinc-800/80">
      <div className="p-4 sm:p-5 flex flex-col gap-4 shrink-0">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11px] uppercase tracking-widest text-zinc-500">Chat History</span>
            <button onClick={refreshSessions} className="p-1 text-zinc-400 hover:text-blue-600 transition-colors" title="Refresh">
              <RefreshCw size={12} />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
             {isBulkMode && selectedIds.size > 0 && (
                <button 
                  onClick={onBulkDelete}
                  className="font-bold text-[11px] uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={12} />
                  Delete ({selectedIds.size})
                </button>
             )}
             <button 
                onClick={() => { setIsBulkMode(!isBulkMode); setSelectedIds(new Set()); }}
                className={`font-bold text-[11px] uppercase tracking-wider transition-colors ${isBulkMode ? 'text-blue-600 dark:text-blue-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
              >
                {isBulkMode ? 'Done' : 'Edit'}
              </button>
          </div>
        </div>

        <button
          onClick={createNewSession}
          disabled={isBulkMode}
          className="w-full h-11 flex items-center justify-center sm:justify-start gap-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all font-bold text-[13px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          <span>New Session</span>
        </button>

        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={15} />
          <input 
            placeholder="Search sessions..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-xl font-outfit text-[13px] font-medium focus:outline-none focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm"
            value={filter}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 space-y-4 custom-scrollbar pb-6 mt-1">
        
        {/* ARCHIVED SECTION */}
        {archivedSessions.length > 0 && (
          <div className="space-y-1.5">
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className="w-full px-2 flex items-center justify-between group/archive mb-2"
            >
              <div className="flex items-center gap-2">
                <Archive size={12} className="text-zinc-400 group-hover/archive:text-zinc-600 dark:group-hover/archive:text-zinc-300 transition-colors" />
                <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-500 group-hover/archive:text-zinc-700 dark:group-hover/archive:text-zinc-300 transition-colors">Archived</span>
              </div>
              {showArchived ? <ChevronDown size={12} className="text-zinc-400" /> : <ChevronRight size={12} className="text-zinc-400" />}
            </button>
            
            {showArchived && (
              <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                {archivedSessions.map((s) => (
                  <SessionItem 
                    key={s.id} 
                    s={s} 
                    sessionId={sessionId} 
                    isBulkMode={isBulkMode}
                    isSelected={selectedIds.has(s.id)}
                    onToggleSelect={toggleSelect}
                    onRename={handleOpenRename}
                    onDelete={handleDelete}
                    loadSession={loadSession}
                  />
                ))}
              </div>
            )}
            <div className="pt-2 border-b border-zinc-200 dark:border-zinc-800/50 mx-2" />
          </div>
        )}

        {/* ACTIVE SECTION */}
        <div className="space-y-1">
          <div className="px-2 flex items-center gap-2 mb-2">
            <Clock size={12} className="text-blue-500" />
            <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-500">Active Sessions</span>
          </div>
          
          {activeSessions.length === 0 && (
            <p className="px-4 py-3 text-[12px] text-zinc-500 font-medium italic">No active sessions found.</p>
          )}
          
          {activeSessions.map((s) => (
            <SessionItem 
              key={s.id} 
              s={s} 
              sessionId={sessionId} 
              isBulkMode={isBulkMode}
              isSelected={selectedIds.has(s.id)}
              onToggleSelect={toggleSelect}
              onRename={handleOpenRename}
              onDelete={handleDelete}
              loadSession={loadSession}
            />
          ))}
        </div>
      </div>

      <RenameModal 
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        currentTitle={editingSession?.title || ""}
        onRename={onRenameSuccess}
      />
    </div>
  )
}