'use client'

import React from 'react'
import { 
  Menu, BookOpen, Share2, Archive, GitFork 
} from 'lucide-react'

export const StudyHeader = ({ 
  sessionId, 
  onShare, 
  onArchive, 
  onMobileMenuOpen, 
  title, 
  isArchived, 
  canClone, 
  onClone, 
  onRename 
}: any) => {
  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 w-full min-w-0 z-40 sticky top-0 font-inter">
      
      {/* Left Section: Navigation & Identity */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        
        <button 
          className="md:hidden p-1.5 -ml-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors shrink-0" 
          onClick={onMobileMenuOpen}
          aria-label="Open Menu"
        >
          <Menu size={18} />
        </button>
        
        <div 
          className="flex items-center gap-2.5 min-w-0 cursor-pointer rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 px-1 -ml-1 py-1 transition-colors" 
          onClick={onRename}
          title="Click to rename"
        >
           <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
              <BookOpen size={14} className="text-zinc-600 dark:text-zinc-400" />
           </div>
           
           <div className="flex items-center gap-2 min-w-0">
              <span className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {title || 'New Workspace'}
              </span>
              {isArchived && (
                <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-semibold uppercase tracking-wider rounded border border-zinc-200 dark:border-zinc-700 shrink-0">
                  Archived
                </span>
              )}
           </div>
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-4">
        {sessionId && (
          <div className="flex items-center gap-1 sm:gap-2">
            
            {canClone && (
              <button 
                onClick={onClone} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-md transition-colors hover:opacity-90 font-medium text-[13px] shrink-0 shadow-sm"
              >
                <GitFork size={14} />
                <span className="hidden sm:inline">Clone Session</span>
              </button>
            )}

            {!isArchived && !canClone && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={onShare} 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md text-[13px] font-medium transition-colors shrink-0" 
                  title="Share Workspace"
                >
                  <Share2 size={14} />
                  <span className="hidden sm:inline">Share</span>
                </button>

                <button 
                  onClick={onArchive} 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md text-[13px] font-medium transition-colors shrink-0" 
                  title="Archive Workspace"
                >
                  <Archive size={14} />
                  <span className="hidden sm:inline">Archive</span>
                </button>
              </div>
            )}
            
          </div>
        )}
      </div>
    </header>
  )
}