'use client'

import React, { useState, useMemo } from 'react'
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Archive, 
  ChevronDown, 
  ChevronRight, 
  CheckSquare, 
  Square, 
  MessageSquare,
  ArchiveRestore
} from 'lucide-react'
import { RenameModal } from './ChatModals'

export const ChatSidebar = ({ 
  sessions, 
  sessionId, 
  loadSession, 
  handleDelete, 
  handleBulkDelete, 
  renameSession, 
  refreshSessions, 
  createNewSession,
  handleArchive
}: any) => {
  const [filter, setFilter] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Filter sessions based on status and search query
  const activeSessionsList = useMemo(() => 
    (sessions || []).filter((s: any) => 
      s.status !== 'archived' && 
      s.is_archived !== true && 
      s.title?.toLowerCase().includes(filter.toLowerCase())
    ), [sessions, filter]);

  const archivedSessionsList = useMemo(() => 
    (sessions || []).filter((s: any) => 
      (s.status === 'archived' || s.is_archived === true) && 
      s.title?.toLowerCase().includes(filter.toLowerCase())
    ), [sessions, filter]);

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  return (
    <div className="flex flex-col h-full bg-[#fdfdfe] dark:bg-[#09090b] border-r border-zinc-200 dark:border-zinc-800 w-full font-sans select-none overflow-hidden">
      {/* Header Section */}
      <div className="p-4 flex flex-col gap-4 shrink-0 border-b border-zinc-100 dark:border-zinc-800 w-full">
        <div className="flex items-center justify-between w-full">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 shrink-0">
            History
          </h2>
          <div className="flex items-center gap-3 shrink-0">
            {isBulkMode && selectedIds.size > 0 && (
              <button 
                onClick={() => handleBulkDelete(Array.from(selectedIds)).then(() => setIsBulkMode(false))} 
                className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} /> Delete ({selectedIds.size})
              </button>
            )}
            <button 
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                setSelectedIds(new Set());
              }} 
              className={`text-xs font-semibold transition-colors ${isBulkMode ? 'text-blue-500' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
            >
              {isBulkMode ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>

        <button 
          onClick={createNewSession} 
          disabled={isBulkMode}
          className="group w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Plus size={16} className="text-white dark:text-zinc-900 shrink-0" />
          <span className="text-sm font-semibold text-white dark:text-zinc-900 truncate">New Chat</span>
        </button>

        <div className="relative group w-full shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 shrink-0" size={14} />
          <input 
            placeholder="Search conversations..." 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
            className="w-full pl-9 pr-3 py-2 bg-zinc-100/50 dark:bg-zinc-900/50 border border-transparent focus:border-zinc-200 dark:focus:border-zinc-700 rounded-lg text-sm focus:outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
      </div>
      
      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 custom-scrollbar overflow-x-hidden w-full">
        
        {/* Archived Section (Moved to Top) */}
        {archivedSessionsList.length > 0 && (
          <div className="pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800/50 w-full">
            <button 
              onClick={() => setShowArchived(!showArchived)} 
              className="w-full px-2 py-2 flex items-center justify-between group rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Archive size={14} className="text-zinc-400 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 truncate">Archived Chats</span>
              </div>
              {showArchived ? <ChevronDown size={14} className="text-zinc-400 shrink-0" /> : <ChevronRight size={14} className="text-zinc-400 shrink-0" />}
            </button>

            {showArchived && (
              <div className="mt-1 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200 w-full">
                {archivedSessionsList.map((s: any) => (
                  <div 
                    key={s.id} 
                    onClick={() => isBulkMode ? toggleSelection(s.id) : loadSession(s.id)}
                    className="group flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-zinc-500 border border-transparent transition-all w-full"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 opacity-70">
                       <MessageSquare size={16} className="text-zinc-400 shrink-0" />
                       <span className="text-sm truncate w-full">{s.title || "Untitled Chat"}</span>
                    </div>
                    {!isBulkMode && (
                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleArchive(s.id, false); }} 
                          className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                          title="Restore to History"
                        >
                          <ArchiveRestore size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(e, s.id); }} 
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                          title="Delete Permanently"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Chats */}
        <div className="space-y-1 w-full">
          {activeSessionsList.length === 0 && !filter && (
            <div className="px-4 py-8 text-center w-full">
              <p className="text-xs text-zinc-400">No recent activity</p>
            </div>
          )}
          
          {activeSessionsList.map((s: any) => (
            <div 
              key={s.id} 
              onClick={() => isBulkMode ? toggleSelection(s.id) : loadSession(s.id)} 
              className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border w-full ${
                sessionId === s.id && !isBulkMode 
                ? 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-900 dark:text-white' 
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 border-transparent text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="shrink-0">
                  {isBulkMode ? (
                    <div className={selectedIds.has(s.id) ? 'text-blue-500' : 'text-zinc-300 dark:text-zinc-600'}>
                      {selectedIds.has(s.id) ? <CheckSquare size={16} fill="currentColor" className="text-blue-500 fill-blue-500/20" /> : <Square size={16} />}
                    </div>
                  ) : (
                    <MessageSquare size={16} className={sessionId === s.id ? 'text-blue-500' : 'text-zinc-400'} />
                  )}
                </div>
                <span className="text-sm font-medium truncate w-full">{s.title || "Untitled Chat"}</span>
              </div>

              {!isBulkMode && (
                <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleArchive(s.id, true); }} 
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    title="Archive"
                  >
                    <Archive size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingSession({ id: s.id, title: s.title }); setRenameModalOpen(true); }} 
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    title="Rename"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <RenameModal 
        isOpen={renameModalOpen} 
        onClose={() => setRenameModalOpen(false)} 
        currentTitle={editingSession?.title || ""} 
        onRename={async (t: string) => { 
          await renameSession(editingSession.id, t); 
          refreshSessions(); 
        }} 
      />
    </div>
  )
}