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
    <div className="w-full max-w-4xl mx-auto font-inter relative z-10 w-full min-w-0">
      <form 
        onSubmit={handleSubmit} 
        className="relative bg-white dark:bg-[#0c0c0e] border border-zinc-300 dark:border-zinc-700/80 rounded-xl shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all flex flex-col w-full min-w-0 overflow-hidden"
      >
        {/* Uploaded Files Wrapper */}
        {uploadedFiles?.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/60 max-h-32 overflow-y-auto custom-scrollbar w-full min-w-0">
            {uploadedFiles.map((f: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-md text-[13px] transition-all">
                <Search size={14} className="text-blue-600 dark:text-blue-500 shrink-0" />
                <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[120px] sm:max-w-[200px]">
                  {f.name}
                </span>
                <button 
                  type="button" 
                  onClick={() => removeFile(idx)} 
                  className="ml-1 p-0.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end gap-2 px-2 py-2 w-full min-w-0">
          <button 
            type="button" 
            onClick={onUploadClick}
            disabled={loading || isUploading}
            className="w-9 h-9 mb-0.5 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          <div className="flex-1 min-w-0 py-1.5">
            <textarea 
              ref={textareaRef}
              value={text}
              onChange={(e) => { setText(e.target.value); adjustHeight(); }}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or type a message..."
              className="w-full flex-1 max-h-[200px] bg-transparent border-none focus:ring-0 text-[15px] outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 resize-none leading-relaxed custom-scrollbar pt-0.5" 
              rows={1}
            />
          </div>

          <div className="h-10 flex items-center pr-1 shrink-0">
            {loading || isUploading ? (
              <button 
                type="button" 
                onClick={onStop}
                className="w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-all"
                title="Stop generation"
              >
                <Square size={14} className="fill-current" />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={!text.trim() && uploadedFiles.length === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  text.trim() || uploadedFiles.length > 0 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <Send size={15} className={text.trim() || uploadedFiles.length > 0 ? "translate-x-0.5 -translate-y-0.5" : ""} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions Footer - Mobile Scrollable Row */}
        <div className="flex items-center gap-2 px-3 pb-3 overflow-x-auto no-scrollbar w-full min-w-0 border-t border-transparent">
          <button 
            type="button" 
            onClick={() => onSubmit("Quiz me on what we've learned so far", [])} 
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-medium text-[12px] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            <BookOpen size={13} />
            <span>Practice Quiz</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => onSubmit("Show my study roadmap", [])} 
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-medium text-[12px] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            <Map size={13} />
            <span>View Roadmap</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => onSubmit("Show my progress tracker", [])} 
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-medium text-[12px] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            <BarChart size={13} />
            <span>Check Progress</span>
          </button>

          <button 
            type="button" 
            onClick={onShowQuizHistory} 
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-medium text-[12px] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
            title="View past quiz results"
          >
            <History size={13} />
            <span>Quiz History</span>
          </button>
        </div>
      </form>
      
      <div className="mt-2.5 text-center px-4 w-full">
        <span className="text-[12px] text-zinc-400 dark:text-zinc-500 font-medium">
          AI can make mistakes. Verify important information.
        </span>
      </div>
    </div>
  )
}