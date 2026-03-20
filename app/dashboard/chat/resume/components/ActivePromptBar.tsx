'use client'

import React, { useState, useRef } from 'react'
import { Send, Square, Globe, Zap } from 'lucide-react'

export const ActivePromptBar = ({ onSubmit, onStop, loading, isTyping }: any) => {
  const [chatInput, setChatInput] = useState('');
  const [deepSearch, setDeepSearch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && !isTyping && chatInput.trim()) {
        onSubmit(chatInput); setChatInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-12 sm:pb-20">
      <div className="bg-white/60 dark:bg-[#0c0c0e]/60 backdrop-blur-3xl border border-blue-500/30 hover:border-blue-500/50 focus-within:border-blue-500/70 focus-within:ring-4 focus-within:ring-blue-500/10 rounded-[2.25rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden flex flex-col">
        <div className="flex items-end gap-4 px-6 pt-6 pb-3">
          <textarea
            ref={textareaRef} value={chatInput} onKeyDown={handleKeyDown}
            onChange={(e) => {
              setChatInput(e.target.value);
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
              }
            }}
            placeholder="Ask a follow-up about your resume..."
            className="flex-1 bg-transparent text-[16px] font-medium text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 min-h-[72px] max-h-[200px] resize-none custom-scrollbar leading-relaxed pt-1"
            disabled={loading || isTyping} rows={1}
          />
          <button
            onClick={() => {
              if (loading || isTyping) onStop();
              else if (chatInput.trim()) { onSubmit(chatInput); setChatInput(''); if (textareaRef.current) textareaRef.current.style.height = 'auto'; }
            }}
            disabled={!loading && !isTyping && !chatInput.trim()}
            className={`h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl transition-all duration-300 shadow-lg ${loading || isTyping ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-95' : !chatInput.trim() ? 'bg-zinc-200/50 dark:bg-zinc-800/40 text-zinc-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-blue-500/25'}`}
          >
            {loading || isTyping ? <Square size={18} className="fill-current" /> : <Send size={20} className="-translate-x-px translate-y-[1px]" />}
          </button>
        </div>
        <div className="flex items-center gap-3 px-5 sm:px-7 py-3.5 border-t border-zinc-200/20 dark:border-zinc-800/30 bg-white/20 dark:bg-black/10">
          <button type="button" onClick={() => setDeepSearch(v => !v)} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] font-bold tracking-tight transition-all duration-300 ${deepSearch ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-700/50 text-zinc-500 hover:bg-zinc-50'}`}>
            <Zap size={14} className={deepSearch ? 'fill-current' : ''} /> Deep Analysis
          </button>
        </div>
      </div>
    </div>
  );
};