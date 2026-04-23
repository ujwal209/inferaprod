// app/dashboard/chat/[sessionId]/ChatPromptBar.tsx
'use client'

import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react'
import { Send, Zap, Globe, StopCircle, Sparkles } from 'lucide-react'

export const ChatPromptBar = ({ onSubmit, onStop, isGenerating }: any) => {
  const [text, setText] = useState('')
  const [deepSearch, setDeepSearch] = useState(false)
  const [webAccess, setWebAccess] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleAction(); 
    }
  }

  const handleAction = () => {
    if (isGenerating) {
      onStop(); 
      return;
    }
    if (text.trim()) {
      onSubmit(text, []); // Keeping empty array to not break parent signature
      setText(''); 
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  }

  return (
    <div className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl shadow-zinc-200/20 dark:shadow-none focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all flex flex-col relative min-w-0 font-outfit">
      
      {/* Input Area */}
      <div className="flex w-full min-w-0">
        <textarea 
          ref={textareaRef} 
          value={text} 
          onChange={handleInput} 
          onKeyDown={handleKeyDown} 
          placeholder="Message the Execution Agent..." 
          className="flex-1 bg-transparent text-[15px] text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 min-h-[44px] max-h-[150px] resize-none custom-scrollbar p-4 w-full min-w-0 leading-relaxed" 
          disabled={isGenerating} 
          rows={1} 
        />
      </div>

      {/* Toggles & Send Action */}
      <div className="flex items-center justify-between gap-2 px-3 pb-3 w-full min-w-0">
        
        {/* Toggle Pills */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setDeepSearch(!deepSearch)} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold font-google-sans text-[12px] transition-colors shrink-0 ${
              deepSearch 
                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400' 
                : 'bg-zinc-50 dark:bg-[#111113] border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Zap size={13} className={deepSearch ? 'text-blue-600 dark:text-blue-400' : ''} /> 
            Analysis Mode
          </button>
          
          <button 
            onClick={() => setWebAccess(!webAccess)} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold font-google-sans text-[12px] transition-colors shrink-0 ${
              webAccess 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' 
                : 'bg-zinc-50 dark:bg-[#111113] border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Globe size={13} className={webAccess ? 'text-emerald-600 dark:text-emerald-400' : ''} /> 
            Web Search
          </button>
        </div>

        {/* Send Button */}
        <div className="shrink-0 pl-2">
          <button 
            onClick={handleAction} 
            disabled={isGenerating ? false : !text.trim()} 
            className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all active:scale-95 ${
              isGenerating 
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md' 
                : !text.trim() 
                  ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
            }`}
          >
            {isGenerating ? <StopCircle size={16} className="fill-current" /> : <Send size={16} className="ml-0.5" />}
          </button>
        </div>

      </div>
    </div>
  )
};