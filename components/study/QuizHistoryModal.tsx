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
        setHistory(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredHistory = history.filter(h => 
    h.topic.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm font-outfit">
      
      {/* Modal Container */}
      <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5 flex items-center justify-between shrink-0">
           <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Assessment History</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Review your past performance and scores.</p>
           </div>
           
           <button 
             onClick={onClose} 
             className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
           >
             <X size={20} />
           </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
           <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                placeholder="Search assessments..." 
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)} 
              />
           </div>
        </div>

        {/* History Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar bg-white dark:bg-[#0c0c0e]">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={24} className="text-blue-500 animate-spin" />
                <span className="text-sm font-medium text-zinc-500">Loading history...</span>
             </div>
          ) : filteredHistory.length > 0 ? (
            filteredHistory.map((item: any) => {
               const percentage = Math.round((item.score / item.total_questions) * 100);
               const isMastered = percentage >= 80;

               return (
                  <div key={item.id} className="p-4 sm:p-5 bg-white dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-900/50 transition-colors shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                     
                     {/* Circular Progress */}
                     <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 self-center sm:self-auto">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-100 dark:text-zinc-800" />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke="#2563eb" 
                            strokeWidth="8" 
                            lineCap="round"
                            strokeDasharray={2 * Math.PI * 45} 
                            strokeDashoffset={(2 * Math.PI * 45) - (percentage / 100) * (2 * Math.PI * 45)} 
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                              {percentage}%
                           </span>
                        </div>
                     </div>

                     {/* Details */}
                     <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-center gap-3 mb-1.5">
                           <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                              <Calendar size={12} />
                              <span className="text-xs font-medium">{new Date(item.created_at).toLocaleDateString()}</span>
                           </div>
                           <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                           <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                              <Target size={12} />
                              <span className="text-xs font-bold uppercase tracking-wider">{item.subject || 'General'}</span>
                           </div>
                        </div>
                        
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate mb-3">
                          {item.topic}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-2">
                           <span className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border ${isMastered ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'}`}>
                              {isMastered ? <CheckCircle2 size={12} /> : <BookOpen size={12} />}
                              {isMastered ? 'Mastered' : 'Needs Review'}
                           </span>
                           <span className="text-xs font-medium text-zinc-500">
                              {item.score} of {item.total_questions} correct
                           </span>
                        </div>
                     </div>

                  </div>
               );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
               <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                  <BookOpen size={24} className="text-zinc-400" />
               </div>
               <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white">No history found</h4>
                  <p className="text-sm text-zinc-500 mt-1">You haven't completed any assessments yet.</p>
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}