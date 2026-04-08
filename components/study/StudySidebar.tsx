'use client'

import React, { useState } from 'react'
import { 
  Plus, Search, Trash2, Edit3, Archive, 
  History, Check, CheckSquare, Square as SquareIcon, 
  MessageSquare
} from 'lucide-react'

export const StudySidebar = React.memo(({ 
  sessions, sessionId, filter, setFilter, loadSession, 
  setEditingId, editingId, editTitle, setEditTitle, 
  saveRename, handleDelete, createNewSession, onShowQuizHistory 
}: any) => {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);

  const activeSessions = (sessions || []).filter((s:any) => !s.is_archived);
  const archivedSessions = (sessions || []).filter((s:any) => s.is_archived);

  const displaySessions = showArchived ? archivedSessions : activeSessions;
  const filteredSessions = displaySessions.filter((s:any) => s.title.toLowerCase().includes(filter.toLowerCase()));

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredSessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSessions.map((s: any) => s.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    for (let id of Array.from(selectedIds)) {
      await handleDelete({ stopPropagation: () => {} } as any, id);
    }
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-[#0c0c0e] font-inter relative w-full min-w-0">
      
      {/* Top Actions & Search */}
      <div className="p-3 sm:p-4 space-y-3 shrink-0 border-b border-zinc-200 dark:border-zinc-800 w-full min-w-0 bg-white dark:bg-[#050505]">
        <div className="flex gap-2 w-full min-w-0">
          <button 
            onClick={() => { createNewSession(); setIsSelectMode(false); }} 
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[13px] rounded-md transition-colors min-w-0 shadow-sm border border-blue-700"
          >
            <Plus size={16} className="shrink-0" />
            <span className="truncate">New Workspace</span>
          </button>
          
          <button 
            onClick={onShowQuizHistory} 
            className="w-9 h-9 shrink-0 flex items-center justify-center bg-zinc-50 dark:bg-[#111113] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-md transition-colors shadow-sm" 
            title="Assessment History"
          >
            <History size={16} />
          </button>
        </div>

        {/* History Header & Controls */}
        <div className="space-y-2.5 w-full min-w-0">
          <div className="flex items-center justify-between px-1 w-full min-w-0">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 truncate">History</h3>
            <button 
              onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds(new Set()); }} 
              className={`text-[11px] font-semibold uppercase tracking-wider transition-colors shrink-0 pl-2 ${isSelectMode ? 'text-blue-600 dark:text-blue-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
            >
              {isSelectMode ? 'Done' : 'Edit'}
            </button>
          </div>
          
          {isSelectMode ? (
            <div className="flex items-center justify-between bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-md shadow-sm w-full min-w-0">
              <button 
                onClick={handleSelectAll} 
                className="text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 px-1 truncate"
              >
                {selectedIds.size === filteredSessions.length && filteredSessions.length > 0 ? <CheckSquare size={14} className="text-blue-600 shrink-0" /> : <SquareIcon size={14} className="shrink-0" />} 
                <span className="truncate">{selectedIds.size === filteredSessions.length ? 'Deselect All' : 'Select All'}</span>
              </button>
              <button 
                onClick={handleDeleteSelected} 
                disabled={selectedIds.size === 0} 
                className="text-[12px] font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-2 shrink-0"
              >
                Delete ({selectedIds.size})
              </button>
            </div>
          ) : (
            <div className="relative group w-full min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={14} />
              <input 
                placeholder="Search sessions..." 
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 rounded-md text-[13px] font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 shadow-sm" 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 sm:px-4 py-2 shrink-0 w-full min-w-0 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0c0c0e]">
        <div className="flex gap-1 bg-zinc-200/50 dark:bg-zinc-900/50 p-1 rounded-md border border-zinc-200 dark:border-zinc-800/80 w-full min-w-0">
          <button 
            onClick={() => setShowArchived(false)} 
            className={`flex-1 flex items-center justify-center gap-2 py-1 rounded text-[11px] font-semibold uppercase tracking-wider transition-all min-w-0 ${!showArchived ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent'}`}
          >
            <span className="truncate">Active</span>
          </button>
          <button 
            onClick={() => setShowArchived(true)} 
            className={`flex-1 flex items-center justify-center gap-2 py-1 rounded text-[11px] font-semibold uppercase tracking-wider transition-all min-w-0 ${showArchived ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent'}`}
          >
            <span className="truncate">Archived</span>
          </button>
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-2 mt-2 space-y-0.5 custom-scrollbar pb-6 w-full min-w-0">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((s:any) => (
            <div 
              key={s.id} 
              onClick={() => { if(isSelectMode) { toggleSelect(s.id, { stopPropagation: ()=>{} } as any) } else { loadSession(s.id) } }} 
              className={`group relative px-2.5 py-2 rounded-md cursor-pointer transition-colors flex items-center gap-2.5 w-full min-w-0 ${sessionId === s.id && !isSelectMode ? 'bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 shadow-sm' : isSelectMode && selectedIds.has(s.id) ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50' : 'border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
            >
              
              {/* Icon / Checkbox */}
              <div className="shrink-0 text-zinc-400 dark:text-zinc-500 flex items-center justify-center">
                {isSelectMode ? (
                  <button onClick={(e) => toggleSelect(s.id, e)} className="transition-colors">
                    {selectedIds.has(s.id) ? <CheckSquare size={15} className="text-blue-600 dark:text-blue-500" /> : <SquareIcon size={15} />}
                  </button>
                ) : (
                  <MessageSquare size={14} className={`transition-colors ${sessionId === s.id ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`} />
                )}
              </div>

              {/* Title / Input */}
              <div className="flex-1 min-w-0 flex items-center">
                {editingId === s.id && !isSelectMode ? (
                  <div className="flex items-center gap-1.5 w-full min-w-0" onClick={e => e.stopPropagation()}>
                    <input 
                      autoFocus 
                      value={editTitle} 
                      onChange={(e) => setEditTitle(e.target.value)} 
                      className="bg-zinc-100 dark:bg-[#111113] text-[13px] font-medium outline-none w-full border border-blue-500 rounded px-1.5 py-0.5 text-zinc-900 dark:text-white min-w-0" 
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(e as any, s.id)} 
                    />
                    <button 
                      onClick={(e) => saveRename(e, s.id)} 
                      className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors shrink-0"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div className={`w-full text-left text-[13px] truncate transition-colors ${sessionId === s.id && !isSelectMode ? 'font-medium text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'}`}>
                    {s.title}
                  </div>
                )}
              </div>

              {/* Hover Actions */}
              {!isSelectMode && editingId !== s.id && (
                <div className="flex gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 shrink-0">
                  <button 
                    onClick={(e)=>{ e.stopPropagation(); setEditingId(s.id); setEditTitle(s.title); }} 
                    className="p-1 text-zinc-400 hover:text-blue-600 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors" 
                    title="Rename"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button 
                    onClick={(e)=>handleDelete(e, s.id)} 
                    className="p-1 text-zinc-400 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors" 
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center w-full min-w-0">
             <MessageSquare size={20} className="text-zinc-300 dark:text-zinc-700 mb-2" />
             <p className="text-[12px] font-medium text-zinc-500">
               No {showArchived ? 'archived' : 'active'} sessions found.
             </p>
          </div>
        )}
      </div>
    </div>
  )
});

StudySidebar.displayName = 'StudySidebar';