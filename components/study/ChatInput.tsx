'use client'

import React, { useState, useRef } from 'react'
import { 
  Send, Paperclip, X, Square, 
  Search, BarChart, BookOpen, Map, History
} from 'lucide-react'

export const ChatInput = ({ 
  onSubmit, 
  loading, 
  isUploading, 
  onStop, 
  uploadedFiles, 
  removeFile, 
  onUploadClick,
  onShowQuizHistory
}: any) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading || isUploading) return;
    onSubmit(text, uploadedFiles);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-6 pt-2 font-outfit relative z-10">
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#fafafa] via-[#fafafa]/90 to-transparent dark:from-[#050505] dark:via-[#050505]/90 dark:to-transparent -z-10 pointer-events-none" />
      
      <form 
        onSubmit={handleSubmit} 
        className="relative bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all flex flex-col"
      >
        {/* Uploaded Files Wrapper */}
        {uploadedFiles?.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 max-h-32 overflow-y-auto custom-scrollbar">
            {uploadedFiles.map((f: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                <Search size={14} className="text-blue-500 shrink-0" />
                <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[120px] sm:max-w-[200px]">
                  {f.name}
                </span>
                <button 
                  type="button" 
                  onClick={() => removeFile(idx)} 
                  className="ml-1 p-0.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end gap-2 px-2 py-2">
          <button 
            type="button" 
            onClick={onUploadClick}
            disabled={loading || isUploading}
            className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>

          <div className="flex-1 min-w-0 py-1">
            <textarea 
              ref={textareaRef}
              value={text}
              onChange={(e) => { setText(e.target.value); adjustHeight(); }}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or type a message..."
              className="w-full flex-1 max-h-[200px] py-1.5 bg-transparent border-none focus:ring-0 font-medium text-[15px] outline-none transition-all dark:text-white placeholder:text-zinc-400 resize-none leading-relaxed custom-scrollbar" 
              rows={1}
            />
          </div>

          <div className="h-10 flex items-center pr-1 shrink-0">
            {loading || isUploading ? (
              <button 
                type="button" 
                onClick={onStop}
                className="w-9 h-9 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all"
                title="Stop generation"
              >
                <Square size={14} className="fill-current" />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={!text.trim() || loading || isUploading}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${text.trim() ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed'}`}
                title="Send message"
              >
                <Send size={16} className={text.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3 pt-1 border-t border-transparent overflow-x-auto custom-scrollbar flex-nowrap sm:flex-wrap">
          <button 
            type="button" 
            onClick={() => onSubmit("Quiz me on what we've learned so far", [])} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-medium text-xs transition-all hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 shrink-0"
          >
            <BookOpen size={13} />
            <span>Practice Quiz</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => onSubmit("Show my study roadmap", [])} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-medium text-xs transition-all hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 shrink-0"
          >
            <Map size={13} />
            <span>View Roadmap</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => onSubmit("Show my progress tracker", [])} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-medium text-xs transition-all hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 shrink-0"
          >
            <BarChart size={13} />
            <span>Check Progress</span>
          </button>

          <button 
            type="button" 
            onClick={onShowQuizHistory} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-medium text-xs transition-all hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 shrink-0"
            title="View past quiz results"
          >
            <History size={13} />
            <span>Quiz History</span>
          </button>
        </div>
      </form>
      
      <div className="mt-3 text-center px-4">
        <span className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium tracking-wide">
          AI can make mistakes. Verify important information.
        </span>
      </div>
    </div>
  )
}