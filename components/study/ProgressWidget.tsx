'use client'

import React from 'react'
import { BarChart, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react'

export const ProgressWidget = ({ title, topic, masteryPercentage, completedConcepts, nextConcept }: any) => {
  const percentage = Math.max(0, Math.min(100, masteryPercentage || 0));
  const normalizedTitle = topic || title || 'Current Topic';

  return (
    <div className="my-6 p-5 rounded-xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 w-full min-w-0 shadow-sm font-inter overflow-hidden">
      
      {/* Header Section */}
      <div className="flex items-center gap-3 mb-8 w-full min-w-0">
        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20">
          <BarChart size={16} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">
            Progress Overview
          </h3>
          <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100 truncate w-full">
            {normalizedTitle}
          </p>
        </div>
      </div>
      
      {/* Circular Progress Arc */}
      <div className="flex flex-col items-center mb-8 w-full min-w-0">
        <div className="relative flex justify-center items-end h-[80px] w-full max-w-[160px]">
          <svg className="w-full h-full drop-shadow-sm" viewBox="0 0 160 80">
            <path 
              d="M 10 70 A 70 70 0 0 1 150 70" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="12" 
              strokeLinecap="round" 
              className="text-zinc-100 dark:text-zinc-800/80" 
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
            <span className="text-3xl font-semibold text-zinc-900 dark:text-white leading-none tracking-tight">
              {percentage}<span className="text-blue-600 dark:text-blue-500 text-lg font-medium">%</span>
            </span>
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1.5">
              Completed
            </span>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="space-y-6 w-full min-w-0">
        
        {/* Completed Concepts */}
        <div className="w-full min-w-0">
          <p className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-blue-500" />
            Mastered Concepts
          </p>
          <div className="flex flex-wrap gap-2 w-full min-w-0">
            {completedConcepts?.length > 0 ? completedConcepts.map((c: string, i: number) => (
              <span 
                key={i} 
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-[#111113] text-zinc-700 dark:text-zinc-300 text-[12px] font-medium rounded-md border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 break-words transition-colors"
              >
                {c}
              </span>
            )) : (
              <span className="text-zinc-400 dark:text-zinc-500 text-[12px] font-medium italic">
                No concepts mastered yet...
              </span>
            )}
          </div>
        </div>
        
        {/* Up Next / Objective */}
        <div className="w-full min-w-0">
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-r-lg rounded-l-sm border border-zinc-200 dark:border-zinc-800/80 border-l-[3px] border-l-blue-500 w-full min-w-0">
            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <BookOpen size={13} className="text-zinc-400" />
              Up Next
            </p>
            <p className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2 break-words w-full min-w-0">
              <ArrowRight size={14} className="text-blue-600 dark:text-blue-500 shrink-0" /> 
              <span className="truncate">{nextConcept || 'Determining next steps...'}</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}