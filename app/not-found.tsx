'use client'

import Link from 'next/link'
import { Home, ChevronLeft, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 font-sans overflow-hidden relative transition-colors duration-300">
      
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] dark:bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 text-center space-y-10 max-w-xl">
        
        {/* Warning Icon Container */}
        <div className="flex justify-center">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border-2 border-zinc-200 dark:border-zinc-800 shadow-xl">
            <AlertCircle size={48} className="text-blue-600 dark:text-blue-500" strokeWidth={2} />
          </div>
        </div>

        {/* Essential Error Content */}
        <div className="space-y-4">
          <h1 className="text-9xl font-black text-zinc-200 dark:text-zinc-800/40 tracking-tighter leading-none select-none">
            404
          </h1>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
            Page Not <span className="text-blue-600 dark:text-blue-500">Found</span>
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-bold uppercase tracking-widest leading-relaxed">
            The link you followed may be broken, or the page may have been removed.
          </p>
        </div>

        {/* Direct Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button 
            asChild
            variant="outline"
            className="w-full sm:w-auto h-14 px-10 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all font-black uppercase tracking-widest text-[11px]"
          >
            <Link href="/" className="flex items-center gap-2">
              <ChevronLeft size={18} strokeWidth={3} /> Go Back
            </Link>
          </Button>

          <Button 
            asChild
            className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-blue-600 text-white hover:bg-blue-500 transition-all font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/20 active:scale-95"
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <Home size={18} strokeWidth={3} /> Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Brand Footer */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-40">
         <span className="font-black tracking-tighter uppercase text-2xl italic text-zinc-900 dark:text-white">
           INFERA<span className="text-blue-600 dark:text-blue-500">CORE</span>
         </span>
      </div>
    </div>
  )
}