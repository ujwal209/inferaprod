'use client'

import React, { useState, useRef } from 'react'
import { 
  Send, Square, 
  BarChart, BookOpen, Map, History, Sparkles
} from 'lucide-react'

export const ChatInput = ({ 
  onSubmit, 
  loading, 
  onStop, 
  onShowQuizHistory
}: any) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSubmit(text, []); // Passing empty array since files are removed
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow 'Enter' to naturally create a new line.
    // Trigger submit only if they press Ctrl+Enter or Cmd+Enter.
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto font-outfit relative z-10 min-w-0">
      <form 
        onSubmit={handleSubmit} 
        className="relative bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-zinc-200/20 dark:shadow-none focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all flex flex-col w-full min-w-0 overflow-hidden"
      >
        {/* Input Area */}
        <div className="flex flex-col w-full min-w-0">
          <textarea 
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); adjustHeight(); }}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question or type a message... (Ctrl + Enter to send)"
            className="w-full max-h-[200px] bg-transparent border-none focus:ring-0 text-[15px] outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none leading-relaxed custom-scrollbar p-4" 
            rows={1}
          />
        </div>

        {/* Quick Actions & Send Row */}
        <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1 w-full min-w-0">
          
          {/* Scrollable Quick Actions */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-fade-right">
            <button 
              type="button" 
              onClick={() => onSubmit("Quiz me on what we've learned so far", [])} 
              className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111113] text-zinc-600 dark:text-zinc-400 font-semibold font-google-sans text-[12px] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <BookOpen size={13} className="text-blue-500" />
              Practice Quiz
            </button>
            
            <button 
              type="button" 
              onClick={() => onSubmit("Show my study roadmap", [])} 
              className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111113] text-zinc-600 dark:text-zinc-400 font-semibold font-google-sans text-[12px] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <Map size={13} className="text-indigo-500" />
              Roadmap
            </button>
            
            <button 
              type="button" 
              onClick={() => onSubmit("Show my progress tracker", [])} 
              className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111113] text-zinc-600 dark:text-zinc-400 font-semibold font-google-sans text-[12px] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <BarChart size={13} className="text-emerald-500" />
              Progress
            </button>

            <button 
              type="button" 
              onClick={onShowQuizHistory} 
              className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111113] text-zinc-600 dark:text-zinc-400 font-semibold font-google-sans text-[12px] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
              title="View past quiz results"
            >
              <History size={13} />
              History
            </button>
          </div>

          {/* Send / Stop Button */}
          <div className="shrink-0 pl-2">
            {loading ? (
              <button 
                type="button" 
                onClick={onStop}
                className="w-10 h-10 flex items-center justify-center bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl transition-all shadow-md active:scale-95"
                title="Stop generation"
              >
                <Square size={16} className="fill-current" />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={!text.trim()}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 ${
                  text.trim() 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <Send size={16} className={text.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
              </button>
            )}
          </div>
        </div>
      </form>
      
      <div className="mt-3 text-center px-4 w-full flex items-center justify-center gap-1.5">
        <Sparkles size={12} className="text-zinc-400" />
        <span className="text-[12px] text-zinc-400 dark:text-zinc-500 font-medium font-google-sans">
          Neural Study Engine can make mistakes. Verify important information.
        </span>
      </div>
    </div>
  )
}