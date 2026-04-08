// app/dashboard/chat/[sessionId]/ChatPromptBar.tsx
'use client'
import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react'
import { Paperclip, Send, Loader2, Zap, Globe, FileText, X, StopCircle } from 'lucide-react'

export const ChatPromptBar = ({ onSubmit, onStop, isGenerating }: any) => {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [deepSearch, setDeepSearch] = useState(false)
  const [webAccess, setWebAccess] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAction(); }
  }

  const handleAction = () => {
    if (isGenerating) {
      onStop(); return;
    }
    if (text.trim() || files.length > 0) {
      onSubmit(text, [...files]);
      setText(''); setFiles([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  }

  return (
    <div className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-300 dark:border-zinc-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-xl transition-all shadow-sm flex flex-col relative min-w-0 font-inter">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-3 w-full min-w-0">
          {files.map((file, idx) => (
            <div key={idx} className="relative flex items-center gap-2 p-1.5 pr-3 rounded bg-zinc-100 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 max-w-[160px] group shrink-0">
              <FileText size={12} className="text-blue-500 shrink-0" />
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 truncate w-full">{file.name}</span>
              <button onClick={() => setFiles(f => f.filter((_, i) => i !== idx))} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 px-2 pt-2 pb-2 w-full min-w-0">
        <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => { if(e.target.files) setFiles(f => [...f, ...Array.from(e.target.files!)]) }} />
        <button onClick={() => fileInputRef.current?.click()} disabled={isGenerating} className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"><Paperclip size={18} /></button>
        <textarea ref={textareaRef} value={text} onChange={handleInput} onKeyDown={handleKeyDown} placeholder="Message Infera..." className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-500 min-h-[36px] max-h-[150px] resize-none no-scrollbar pt-2 w-full min-w-0" disabled={isGenerating} rows={1} />
        <button onClick={handleAction} disabled={isGenerating ? false : (!text.trim() && files.length === 0)} className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-md transition-colors ${isGenerating ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : (!text.trim() && files.length === 0) ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
          {isGenerating ? <StopCircle size={14} /> : <Send size={14} className="ml-0.5"/>}
        </button>
      </div>
      <div className="flex items-center gap-2 px-3 pb-2 pt-1 w-full min-w-0 border-t border-zinc-100 dark:border-zinc-800/50 mt-1">
        <button onClick={() => setDeepSearch(!deepSearch)} className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-medium transition-colors shrink-0 ${deepSearch ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white' : 'border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}><Zap size={10} className={deepSearch ? 'text-zinc-900 dark:text-white' : ''} /> Analysis</button>
        <button onClick={() => setWebAccess(!webAccess)} className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-medium transition-colors shrink-0 ${webAccess ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white' : 'border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}><Globe size={10} className={webAccess ? 'text-zinc-900 dark:text-white' : ''} /> Web Search</button>
      </div>
    </div>
  )
};