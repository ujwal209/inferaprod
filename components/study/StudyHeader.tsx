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
    <header className="h-14 sm:h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 z-40 bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 w-full font-outfit">
      
      {/* Left Section: Navigation & Identity */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <button 
          className="flex md:hidden items-center justify-center w-9 h-9 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0" 
          onClick={onMobileMenuOpen}
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>
        
        <div 
          className="flex items-center gap-3 min-w-0 cursor-pointer group" 
          onClick={onRename}
          title="Click to rename"
        >
           <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shrink-0 transition-transform group-hover:scale-105">
              <BookOpen size={16} className="text-white" />
           </div>
           
           <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                 <span className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                   {title || 'New Workspace'}
                 </span>
                 {isArchived && (
                   <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-zinc-200 dark:border-zinc-700 shrink-0">
                     Archived
                   </span>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-4">
        {sessionId && (
          <div className="flex items-center gap-1 sm:gap-2">
            {canClone && (
              <button 
                onClick={onClone} 
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm transition-all active:scale-95"
              >
                <GitFork size={14} />
                <span className="hidden sm:inline">Duplicate</span>
              </button>
            )}

            {!isArchived && !canClone && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={onShare} 
                  className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-lg text-xs font-medium transition-colors" 
                  title="Share Workspace"
                >
                  <Share2 size={14} />
                  <span className="hidden lg:inline">Share</span>
                </button>

                <button 
                  onClick={onArchive} 
                  className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-lg text-xs font-medium transition-colors" 
                  title="Archive Workspace"
                >
                  <Archive size={14} />
                  <span className="hidden lg:inline">Archive</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}