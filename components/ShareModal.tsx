'use client'

import React, { useState } from 'react'
import { X, Copy, CheckCircle2, Globe, Shield } from 'lucide-react'

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
}

export const ShareModal = ({ isOpen, onClose, shareUrl }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-outfit">
      
      {/* Modal Container */}
      <div className="w-full max-w-md bg-white dark:bg-[#050505] border border-zinc-200 dark:border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <Globe className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="font-bold text-[16px] text-zinc-900 dark:text-white leading-tight">Share Workspace</h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Link Access</p>
            <div className="flex items-start gap-3 p-3.5 bg-zinc-50 dark:bg-[#0c0c0e] rounded-xl border border-zinc-200 dark:border-zinc-800">
              <Shield className="text-emerald-500 shrink-0 mt-0.5" size={16} />
              <div className="flex flex-col">
                <span className="text-[13px] text-zinc-900 dark:text-zinc-100 font-bold">Public Access Enabled</span>
                <span className="text-[12px] text-zinc-500">Anyone with the link can view this workspace and clone it to their own account.</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Workspace Link</p>
            <div className="relative group flex items-center">
              <input 
                readOnly 
                value={shareUrl} 
                className="w-full pl-4 pr-14 py-3.5 bg-zinc-50 dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-xl font-mono text-[12px] text-zinc-600 dark:text-zinc-300 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button 
                onClick={handleCopy}
                disabled={!shareUrl}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                  copied 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-200 dark:border-zinc-700 shadow-sm'
                }`}
              >
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-zinc-600 dark:text-zinc-300 font-bold text-[13px] bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
      
    </div>
  )
}