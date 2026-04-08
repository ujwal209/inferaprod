'use client'

import React, { useState, useEffect } from 'react'
import { X, Copy, CheckCircle2, Globe } from 'lucide-react'

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl?: string; // Made optional
  sessionId?: string;
  sessionTitle?: string;
  onShare?: () => Promise<any>;
}

export const ShareModal = ({ isOpen, onClose, shareUrl: providedUrl, onShare }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [actualUrl, setActualUrl] = useState('');

  // Automatically grab the current URL if one wasn't provided, and trigger DB share
  useEffect(() => {
    if (isOpen) {
      if (providedUrl) {
        setActualUrl(providedUrl);
      } else if (typeof window !== 'undefined') {
        setActualUrl(window.location.href);
      }
      
      // Silently update the database to mark it as shared
      if (onShare) {
        onShare().catch(console.error);
      }
    }
  }, [isOpen, providedUrl, onShare]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!actualUrl) return;
    navigator.clipboard.writeText(actualUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-inter">
      
      {/* Modal Container */}
      <div className="w-full max-w-[420px] bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-base text-zinc-900 dark:text-white">Share Workspace</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5">
          
          {/* Info Box */}
          <div className="flex items-start gap-3 p-3.5 bg-zinc-50 dark:bg-[#111113] rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <Globe className="text-zinc-500 mt-0.5 shrink-0" size={16} />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Public Access</span>
              <span className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Anyone with the link can view and clone this session into their own workspace.
              </span>
            </div>
          </div>

          {/* Link Input & Copy */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Public Link</label>
            <div className="flex items-center gap-2">
              <input 
                readOnly 
                value={actualUrl} 
                className="flex-1 bg-white dark:bg-[#050505] border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-[13px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono min-w-0 truncate"
              />
              <button 
                onClick={handleCopy}
                disabled={!actualUrl}
                className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                  copied 
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                    : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white'
                } disabled:opacity-50`}
                title="Copy to clipboard"
              >
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}