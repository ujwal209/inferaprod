'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Loader2, FileText, UploadCloud, CheckCircle2, ArrowRight } from 'lucide-react'

export const InitForm = ({ onSubmit, loading }: { onSubmit: (e: any) => void, loading: boolean }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-6 duration-1000 mx-auto px-4 py-12 font-sans">
      
      {/* LARGE CENTERED BRANDING */}
      <div className="flex flex-col items-center mb-12 md:mb-16 text-center">
        <div className="relative w-[280px] h-[80px] sm:w-[350px] sm:h-[100px] md:w-[450px] md:h-[130px] mb-6">
          <Image 
            src="/logo.png" 
            fill 
            alt="Infera Core Logo" 
            className="dark:invert object-contain opacity-100" 
            priority 
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Resume Optimizer
          </h1>
          <p className="text-[15px] md:text-[17px] text-zinc-500 dark:text-zinc-400 font-medium max-w-lg mx-auto leading-relaxed">
            Professional ATS scanning and neural bullet-point rewriting.
          </p>
        </div>
      </div>
      
      {/* CENTERED HORIZONTAL ACTION BOX */}
      <div className="w-full max-w-5xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] md:rounded-[3rem] shadow-2xl md:shadow-[0_30px_100px_-20px_rgba(37,99,235,0.15)] p-5 md:p-8 transition-all">
        <form onSubmit={onSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-end gap-5 md:gap-8">
          
          {/* ROLE INPUT */}
          <div className="flex-[1.2] space-y-2.5">
            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] pl-2">
              Target Job Role
            </label>
            <input 
              name="target_role" 
              required 
              placeholder="e.g. Senior Software Engineer" 
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 px-5 py-4 md:py-5 rounded-2xl text-[15px] md:text-[16px] font-medium outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" 
              disabled={loading} 
            />
          </div>

          {/* UPLOAD ZONE */}
          <div className="flex-[1.5] space-y-2.5">
            <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] pl-2">
              Resume Document
            </label>
            <div className="relative group h-[60px] md:h-[72px]">
              <input 
                type="file" 
                name="file" 
                accept=".pdf" 
                required 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
                disabled={loading}
              />
              <div className={`w-full h-full border-2 border-dashed rounded-2xl flex items-center px-6 gap-4 transition-all duration-300 ${fileName ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/5' : 'border-zinc-300 dark:border-zinc-700 group-hover:border-blue-400 bg-zinc-50/50 dark:bg-zinc-900/30'}`}>
                {fileName ? (
                  <CheckCircle2 className="text-blue-600 shrink-0 w-6 h-6 animate-in zoom-in" />
                ) : (
                  <UploadCloud className="text-zinc-400 shrink-0 w-6 h-6 group-hover:text-blue-600 transition-colors" />
                )}
                <span className="text-[14px] md:text-[15px] font-semibold text-zinc-700 dark:text-zinc-200 truncate pr-4">
                  {fileName || "Drop your PDF resume here"}
                </span>
              </div>
            </div>
          </div>

          {/* ANALYZE BUTTON */}
          <div className="lg:shrink-0">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full lg:w-auto h-[60px] md:h-[72px] px-10 md:px-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl md:rounded-[1.5rem] text-[16px] font-bold shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 group"
            >
              {loading ? (
                <Loader2 className="animate-spin w-6 h-6" />
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>Analyze</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}