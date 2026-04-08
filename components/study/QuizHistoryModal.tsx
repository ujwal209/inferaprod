'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, Calendar, Target, Loader2, Search, 
  BookOpen, ChevronRight, CheckCircle2 
} from 'lucide-react'
import { getQuizHistory } from '@/app/actions/study'

export const QuizHistoryModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getQuizHistory().then(data => {
        setHistory(data || []);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredHistory = history.filter(h => 
    (h.topic || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-inter">
      
      {/* Modal Container */}
      <div className="w-full max-w-3xl max-h-[90dvh] bg-white dark:bg-[#0c0c0e] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-0">
        
        {/* Header */}
        <div className="bg-zinc-50 dark:bg-[#111113] border-b border-zinc-200 dark:border-zinc-800 px-5 py-4 flex items-center justify-between shrink-0 w-full min-w-0">
           <div className="min-w-0 flex-1 pr-4">
              <h2 className="text-[16px] font-semibold text-zinc-900 dark:text-white truncate">Assessment History</h2>
              <p className="text-[13px] text-zinc-500 mt-0.5 truncate">Review your past performance and scores.</p>
           </div>
           
           <button 
             onClick={onClose} 
             className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shrink-0"
           >
             <X size={18} />
           </button>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-[#0c0c0e] w-full min-w-0">
           <div className="relative group w-full min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
              <input 
                placeholder="Search assessments..." 
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500" 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)} 
              />
           </div>
        </div>

        {/* History Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar bg-zinc-50/50 dark:bg-[#050505] w-full min-w-0">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={20} className="text-blue-600 dark:text-blue-500 animate-spin" />
                <span className="text-[13px] font-medium text-zinc-500">Loading records...</span>
             </div>
          ) : filteredHistory.length > 0 ? (
            filteredHistory.map((item: any) => {
               const percentage = item.total_questions > 0 ? Math.round((item.score / item.total_questions) * 100) : 0;
               const isMastered = percentage >= 80;
               
               // Math for SVG circle
               const radius = 40;
               const circumference = 2 * Math.PI * radius;
               const offset = circumference - (percentage / 100) * circumference;

               return (
                  <div key={item.id} className="p-3.5 sm:p-4 bg-white dark:bg-[#111113] rounded-lg border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm flex flex-row items-center gap-4 w-full min-w-0">
                     
                     {/* Circular Progress (Fixed size, never wraps on mobile) */}
                     <div className="relative w-12 h-12 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-100 dark:text-zinc-800" />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r={radius} 
                            fill="none" 
                            stroke={isMastered ? "#10b981" : "#3b82f6"} 
                            strokeWidth="8" 
                            strokeLinecap="round"
                            strokeDasharray={circumference} 
                            strokeDashoffset={offset} 
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <span className="text-[11px] sm:text-[12px] font-semibold text-zinc-900 dark:text-white">
                              {percentage}%
                           </span>
                        </div>
                     </div>

                     {/* Details */}
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2.5 mb-1 w-full min-w-0">
                           <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 shrink-0">
                              <Calendar size={11} />
                              <span className="text-[11px] font-medium">{new Date(item.created_at).toLocaleDateString()}</span>
                           </div>
                           <div className="w-[1px] h-2.5 bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                           <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-500 min-w-0">
                              <Target size={11} className="shrink-0" />
                              <span className="text-[11px] font-semibold uppercase tracking-wider truncate">{item.subject || 'General'}</span>
                           </div>
                        </div>
                        
                        <h3 className="text-[14px] sm:text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight truncate mb-2.5 w-full">
                          {item.topic}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-2 w-full min-w-0">
                           <span className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 border ${isMastered ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'}`}>
                              {isMastered ? <CheckCircle2 size={11} /> : <BookOpen size={11} />}
                              {isMastered ? 'Mastered' : 'Needs Review'}
                           </span>
                           <span className="text-[11px] font-medium text-zinc-500 shrink-0">
                              {item.score} / {item.total_questions} correct
                           </span>
                        </div>
                     </div>

                  </div>
               );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center w-full min-w-0">
               <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-[#111113] flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shrink-0">
                  <BookOpen size={20} className="text-zinc-400" />
               </div>
               <div className="px-4">
                  <h4 className="text-[14px] font-semibold text-zinc-900 dark:text-white">No history found</h4>
                  <p className="text-[13px] text-zinc-500 mt-0.5">You haven't completed any assessments yet.</p>
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}