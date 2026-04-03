'use client'

import React, { useState, useEffect } from 'react'
import { X, Edit3, Loader2 } from 'lucide-react'

interface RenameModalProps {
  isOpen: boolean
  onClose: () => void
  currentTitle: string
  onRename: (newTitle: string) => Promise<void>
}

export const RenameModal = ({ isOpen, onClose, currentTitle, onRename }: RenameModalProps) => {
  const [newTitle, setNewTitle] = useState(currentTitle)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) setNewTitle(currentTitle)
  }, [isOpen, currentTitle])

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setIsSaving(true)
    try {
      await onRename(newTitle)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <Edit3 size={18} />
            </div>
            <h3 className="font-google-sans font-bold text-[16px] text-zinc-900 dark:text-white">Rename Session</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[12px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 ml-1">Session Title</label>
            <input 
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title..."
              className="w-full px-5 py-4 bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 rounded-2xl font-outfit text-[15px] text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-zinc-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-zinc-500 dark:text-zinc-400 font-google-sans font-bold text-[14px] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving || !newTitle.trim()}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-google-sans font-bold text-[14px] shadow-sm transition-all active:scale-95 flex items-center gap-2"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
