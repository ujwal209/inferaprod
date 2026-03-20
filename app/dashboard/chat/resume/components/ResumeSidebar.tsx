'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, Plus, MoreVertical, Trash2, FileText, FileSearch } from 'lucide-react'

export const ResumeSidebar = ({ sessions = [], sessionId, loadSession, handleDelete, createNewSession }: any) => {
  const [filter, setFilter] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredSessions = sessions.filter((s: any) => 
    (s?.title || 'Resume Analysis').toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#050505] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50/50 dark:from-blue-900/10 to-transparent pointer-events-none" />
      
      {/* HEADER SECTION */}
      <div className="p-6 pb-2 space-y-6 relative z-10">
        <button 
          onClick={createNewSession}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-[14px] shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>New Resume Analysis</span>
        </button>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">History</h3>
          </div>

          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={15} />
            <input 
              placeholder="Search history..." 
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[13px] font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 mt-4 pb-10 custom-scrollbar">
        <div className="space-y-2">
          {filteredSessions.length === 0 ? (
            <div className="pt-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-4">
                <FileSearch className="text-zinc-300 dark:text-zinc-700" size={32} />
              </div>
              <p className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest">Empty History</p>
            </div>
          ) : (
            filteredSessions.map((s: any) => (
              <div 
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`group relative flex items-center gap-4 px-4 py-4 rounded-[1.5rem] cursor-pointer transition-all duration-300 ${
                  sessionId === s.id 
                  ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 shadow-sm' 
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 border-transparent'
                } border`}
              >
                {/* ICON COMPONENT */}
                <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-all ${
                  sessionId === s.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:bg-white dark:group-hover:bg-zinc-700'
                }`}>
                  <FileText size={20} strokeWidth={2} />
                </div>
                
                {/* TEXT CONTENT */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-bold truncate leading-tight transition-colors ${
                    sessionId === s.id ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-900 dark:text-zinc-100'
                  }`}>
                    {s.title || "Resume Analysis"}
                  </p>
                  <p className="text-[11px] font-bold opacity-50 mt-1 uppercase tracking-wider truncate">
                    {s.target_role || 'General Optimization'}
                  </p>
                </div>

                {/* MORE MENU */}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(e, s.id);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}