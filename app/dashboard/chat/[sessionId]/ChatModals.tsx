// app/dashboard/chat/[sessionId]/ChatModals.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'

export const ShareModal = ({ isOpen, onClose, shareUrl }: { isOpen: boolean, onClose: () => void, shareUrl: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111113] rounded-lg w-full max-w-md overflow-hidden shadow-xl border border-zinc-200 dark:border-zinc-800 font-inter">
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Share Session</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><X size={16} /></button>
        </div>
        <div className="p-4">
          <p className="text-xs text-zinc-500 mb-3">Anyone with this link can view this session.</p>
          <div className="flex gap-2">
            <input readOnly value={shareUrl} className="flex-1 bg-zinc-50 dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 focus:outline-none" />
            <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Copied to clipboard"); }} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700 transition-colors">Copy</button>
          </div>
        </div>
      </div>
    </div>
  )
};

export const RenameModal = ({ isOpen, onClose, currentTitle, onRename }: { isOpen: boolean, onClose: () => void, currentTitle: string, onRename: (title: string) => void }) => {
  const [title, setTitle] = useState(currentTitle);
  useEffect(() => { setTitle(currentTitle); }, [currentTitle, isOpen]);
  
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111113] rounded-lg w-full max-w-sm overflow-hidden shadow-xl border border-zinc-200 dark:border-zinc-800 font-inter">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Rename Session</h3>
        </div>
        <div className="p-4">
          <input 
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-zinc-900 dark:text-white"
            autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { onRename(title); onClose(); } if (e.key === 'Escape') onClose(); }}
          />
        </div>
        <div className="p-3 bg-zinc-50 dark:bg-[#0c0c0e] border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors">Cancel</button>
          <button onClick={() => { onRename(title); onClose(); }} className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors">Save</button>
        </div>
      </div>
    </div>
  )
};