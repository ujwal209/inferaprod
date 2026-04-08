'use client'

import React, { useState, useMemo, MouseEvent, KeyboardEvent, ChangeEvent } from 'react'
import { 
  Search, Plus, Trash2, Edit3, RefreshCw, 
  Archive, Clock, ChevronDown, ChevronRight, 
  CheckSquare, Square, MessageSquare
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

  const isActive = sessionId === s.id && !isBulkMode;

  return (
    <div 
      onClick={handleClick}
      className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all w-full min-w-0 ${
        isActive 
          ? 'bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-sm' 
          : 'border border-transparent hover:bg-zinc-100 dark:hover:bg-[#18181b]/50'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="shrink-0 flex items-center justify-center text-zinc-400">
          {isBulkMode ? (
            <div className={`transition-colors ${isSelected ? 'text-blue-600' : 'hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
              {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            </div>
          ) : (
            <MessageSquare size={14} className={isActive ? 'text-blue-600 dark:text-blue-500' : 'group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors'} />
          )}
        </div>

        <span className={`font-inter text-sm truncate min-w-0 w-full transition-colors ${
          isActive 
            ? 'font-semibold text-zinc-900 dark:text-white' 
            : 'font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
        }`}>
          {s.title}
        </span>
      </div>

      {!isBulkMode && (
        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0 ml-2">
          <button 
            onClick={(e: MouseEvent<HTMLButtonElement>)=>{ e.stopPropagation(); onRename(s.id, s.title); }} 
            className="p-1.5 text-zinc-400 hover:text-blue-600 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800" 
            title="Rename"
          >
            <Edit3 size={14} />
          </button>
          <button 
            onClick={(e: MouseEvent<HTMLButtonElement>)=>onDelete(e, s.id)} 
            className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800" 
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
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#0a0a0c] w-full min-w-0 overflow-hidden font-inter">
      
      {/* 🚀 FIXED HEADER AREA */}
      <div className="p-4 flex flex-col gap-4 shrink-0 border-b border-zinc-200/60 dark:border-zinc-800/60 w-full min-w-0">
        
        <div className="flex items-center justify-between w-full min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-xs uppercase tracking-wider text-zinc-500 truncate">Workspace</span>
            <button onClick={refreshSessions} className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shrink-0 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800" title="Refresh">
              <RefreshCw size={12} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
             {isBulkMode && selectedIds.size > 0 && (
                <button 
                  onClick={onBulkDelete}
                  className="font-semibold text-xs text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={12} />
                  Delete ({selectedIds.size})
                </button>
             )}
             <button 
                onClick={() => { setIsBulkMode(!isBulkMode); setSelectedIds(new Set()); }}
                className={`font-semibold text-xs px-2 py-1 rounded-md transition-colors ${
                  isBulkMode 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20' 
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {isBulkMode ? 'Done' : 'Edit'}
              </button>
          </div>
        </div>

        <button
          onClick={createNewSession}
          disabled={isBulkMode}
          className="w-full h-9 flex items-center justify-center sm:justify-start gap-2 px-3 rounded-lg bg-zinc-900 dark:bg-white hover:opacity-90 text-white dark:text-zinc-900 transition-all font-semibold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0 min-w-0"
        >
          <Plus size={16} className="shrink-0" />
          <span className="truncate">New Session</span>
        </button>

        <div className="relative group w-full min-w-0 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={14} />
          <input 
            placeholder="Search sessions..." 
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm"
            value={filter}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
          />
        </div>
      </div>
      
      {/* 🚀 SCROLLABLE HISTORY AREA */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 w-full min-w-0">
        
        {/* ACTIVE SECTION */}
        <div className="space-y-1 w-full min-w-0">
          <div className="px-2 flex items-center gap-2 mb-2 min-w-0">
            <Clock size={12} className="text-zinc-400 shrink-0" />
            <span className="font-semibold text-xs text-zinc-500 truncate">Recent</span>
          </div>
          
          {activeSessions.length === 0 && (
            <p className="px-3 py-2 text-sm text-zinc-500 font-medium italic">No active sessions found.</p>
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

        {/* ARCHIVED SECTION */}
        {archivedSessions.length > 0 && (
          <div className="space-y-1 pt-2 w-full min-w-0 border-t border-zinc-200 dark:border-zinc-800/60">
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className="w-full px-2 py-1.5 flex items-center justify-between group/archive rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Archive size={12} className="text-zinc-400 shrink-0" />
                <span className="font-semibold text-xs text-zinc-500 truncate">Archived</span>
              </div>
              {showArchived ? <ChevronDown size={14} className="text-zinc-400 shrink-0" /> : <ChevronRight size={14} className="text-zinc-400 shrink-0" />}
            </button>
            
            {showArchived && (
              <div className="space-y-1 animate-in slide-in-from-top-1 duration-200 w-full min-w-0 pt-1">
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
          </div>
        )}

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