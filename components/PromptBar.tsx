'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Paperclip, Send, Loader2, Square, Zap, Globe, FileText, X } from 'lucide-react'

interface PromptBarProps {
  onSubmit: (val: string, files: File[], deep: boolean, web: boolean) => Promise<void>
  onStop: () => void
  isGenerating: boolean
  isUploading: boolean
  editTrigger: {text: string, ts: number} | null
  isCentered?: boolean
}

export const PromptBar = ({ 
  onSubmit, 
  onStop,
  isGenerating,
  isUploading,
  editTrigger,
  isCentered = false
}: PromptBarProps) => {
  const [text, setText] = useState('')
  const [deepSearch, setDeepSearch] = useState(false)
  const [webAccess, setWebAccess] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editTrigger && editTrigger.text) {
      setText(editTrigger.text)
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
      }
    }
  }, [editTrigger])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAction()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)])
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleAction = async () => {
    if (isGenerating || isUploading) {
      onStop()
    } else if (text.trim() || files.length > 0) {
      const submittedText = text
      const submittedFiles = [...files]
      setText('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      setFiles([])
      await onSubmit(submittedText, submittedFiles, deepSearch, webAccess)
    }
  }

  return (
    <div className={`w-full flex justify-center items-center shrink-0 z-20 pointer-events-none ${
      isCentered ? 'px-4 mb-20' : 'px-4 sm:px-6 md:px-8 pb-4 sm:pb-6'
    }`}>
      <div className={`w-full pointer-events-auto transition-all duration-500 ease-in-out ${
        isCentered ? 'max-w-2xl translate-y-[-20%]' : 'max-w-4xl'
      }`}>
        
        <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 focus-within:border-blue-500 dark:focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/5 rounded-2xl sm:rounded-[2.5rem] transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col relative overflow-hidden">
          
          {/* FILE PREVIEW AREA */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2.5 px-5 pt-5 pb-2">
              {files.map((file, idx) => (
                <div key={idx} className="relative flex items-center gap-2.5 p-2 pr-3 rounded-xl bg-zinc-50 dark:bg-[#111113] border border-zinc-100 dark:border-zinc-800 max-w-[180px] group transition-all">
                  {file.type.startsWith('image/') ? (
                    <div className="w-8 h-8 shrink-0 rounded-lg overflow-hidden bg-zinc-200">
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <FileText size={15} />
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 truncate w-full font-google-sans">
                    {file.name}
                  </span>
                  {!isUploading && (
                    <button 
                      onClick={() => removeFile(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 px-5 pt-4 pb-3">
            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating || isUploading}
              className="h-10 w-10 sm:h-11 sm:w-11 mb-0.5 shrink-0 flex items-center justify-center rounded-xl text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all disabled:opacity-50"
            >
              <Paperclip size={20} />
            </button>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={isUploading ? "Uploading to Infera..." : "What research can I help with today?"}
              className="flex-1 bg-transparent font-outfit text-[15px] sm:text-[16px] font-medium text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 min-h-[44px] max-h-[180px] resize-none custom-scrollbar leading-relaxed pt-2.5"
              disabled={isGenerating || isUploading}
              rows={1}
            />
            
            <button
              onClick={handleAction}
              disabled={(isUploading || !isGenerating) && !text.trim() && files.length === 0}
              className={`h-10 w-10 sm:h-11 sm:w-11 mb-0.5 shrink-0 flex items-center justify-center rounded-xl transition-all duration-300 ${
                isGenerating || isUploading
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-black scale-90'
                  : (!text.trim() && files.length === 0)
                    ? 'bg-zinc-50 dark:bg-zinc-900 text-zinc-300 dark:text-zinc-700 pointer-events-none'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-500/20'
              }`}
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : isGenerating ? <Square size={16} className="fill-current" /> : <Send size={18} />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-5 pb-4 pt-1">
            <button
              onClick={() => setDeepSearch(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-google-sans font-bold transition-all ${
                deepSearch
                  ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200/50 dark:border-violet-500/20 text-violet-700 dark:text-violet-400'
                  : 'bg-zinc-50/50 dark:bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-500'
              }`}
            >
              <Zap size={12} className={deepSearch ? 'text-violet-600' : ''} />
              <span>Deep Analysis</span>
            </button>

            <button
              onClick={() => setWebAccess(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-google-sans font-bold transition-all ${
                webAccess
                  ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200/50 dark:border-blue-500/20 text-blue-700 dark:text-blue-400'
                  : 'bg-zinc-50/50 dark:bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-500'
              }`}
            >
              <Globe size={12} className={webAccess ? 'text-blue-600' : ''} />
              <span>Deep Search</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
