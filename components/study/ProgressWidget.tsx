'use client'

import React from 'react'
import { BarChart, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react'

export const ProgressWidget = ({ title, topic, masteryPercentage, completedConcepts, nextConcept }: any) => {
  const percentage = Math.max(0, Math.min(100, masteryPercentage || 0));
  const normalizedTitle = topic || title || 'Current Topic';

  return (
    <div className="my-6 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 w-full max-w-full sm:max-w-xl font-outfit shadow-sm overflow-hidden">
      
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm">
          <BarChart size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Progress Overview</h3>
          <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight truncate w-full">{normalizedTitle}</p>
        </div>
      </div>
      
      {/* Circular Progress Arc */}
      <div className="relative flex justify-center items-end h-[70px] sm:h-[80px] mb-8">
        <svg className="w-[140px] h-[70px] sm:w-[160px] sm:h-[80px] drop-shadow-sm" viewBox="0 0 160 80">
          <path 
            d="M 10 70 A 70 70 0 0 1 150 70" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="12" 
            strokeLinecap="round" 
            className="text-zinc-100 dark:text-zinc-800" 
          />
          <path 
            d="M 10 70 A 70 70 0 0 1 150 70" 
            fill="none" 
            stroke="#2563eb" 
            strokeWidth="12" 
            strokeLinecap="round" 
            strokeDasharray={Math.PI * 70} 
            strokeDashoffset={(Math.PI * 70) - (percentage / 100) * (Math.PI * 70)} 
            className="transition-all duration-1000 ease-out" 
          />
        </svg>
        <div className="absolute bottom-0 flex flex-col items-center">
          <span className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white leading-none tracking-tight">
            {percentage}<span className="text-blue-600 text-lg sm:text-xl font-semibold">%</span>
          </span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">Completed</span>
        </div>
      </div>

      {/* Details Section */}
      <div className="space-y-6">
        
        {/* Completed Concepts */}
        <div>
          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-blue-500" />
            Completed Concepts
          </p>
          <div className="flex flex-wrap gap-2">
            {completedConcepts?.length > 0 ? completedConcepts.map((c: string, i: number) => (
              <span 
                key={i} 
                className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 break-words transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                {c}
              </span>
            )) : (
              <span className="text-zinc-500 text-xs font-medium italic">No concepts completed yet...</span>
            )}
          </div>
        </div>
        
        {/* Up Next / Objective */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 min-w-0">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <BookOpen size={14} className="text-zinc-400" />
            Up Next
          </p>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 break-words w-full">
            <ArrowRight size={16} className="text-blue-600 shrink-0" /> 
            <span className="truncate">{nextConcept || 'Determining next steps...'}</span>
          </p>
        </div>

      </div>
    </div>
  )
}