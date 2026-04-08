'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

const AVATARS = [
  {
    title: "Neural Study Buddy",
    description: (
      <ul className="list-disc pl-5 space-y-2.5 sm:space-y-3 mt-4 font-outfit text-[15px] sm:text-[17px] text-zinc-500 dark:text-zinc-400">
        <li>Personalized AI tutoring</li>
        <li>Adaptive quiz generation</li>
        <li>Complex query resolution</li>
        <li>Learning progress tracking</li>
      </ul>
    ),
    href: "/dashboard/chat/study",
  },
  {
    title: "General Assistant",
    description: (
      <ul className="list-disc pl-5 space-y-2.5 sm:space-y-3 mt-4 font-outfit text-[15px] sm:text-[17px] text-zinc-500 dark:text-zinc-400">
        <li>Multi-domain query handling</li>
        <li>Advanced problem solving</li>
        <li>Intelligent content generation</li>
        <li>Structured response delivery</li>
      </ul>
    ),
    href: "/dashboard/chat",
  }
]

export default function WorkspaceSelector() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap');
        
        .font-outfit {
          font-family: 'Outfit', sans-serif !important;
        }
        
        .font-google-sans {
          font-family: 'Google Sans', sans-serif !important;
        }
      `}} />

      <div className="font-outfit w-full min-h-[calc(100vh-64px)] bg-[#fafafa] dark:bg-[#050505] transition-colors duration-300 relative pb-12 sm:pb-24 overflow-x-hidden flex flex-col items-center justify-center">
        
        {/* Subtle top glow to blend with navbar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none -z-10" />

        <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-10 md:gap-16 pt-8 md:pt-12 tracking-tight px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-4 sm:mb-8 space-y-3">
            <h1 className="font-google-sans text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Select your workspace
            </h1>
            <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 font-outfit px-2">
              Choose the environment that best aligns with your current objectives and workflow requirements.
            </p>
          </div>

          {/* --- HIGHLIGHT SHOWCASE GRID --- */}
          <section className="relative w-full flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 w-full pb-8">
              {AVATARS.map((avatar, i) => {
                return (
                  <div key={i} className="w-full h-full flex">
                    <Link 
                      href={avatar.href}
                      className="group relative block w-full outline-none h-full focus-visible:ring-4 focus-visible:ring-blue-500/50 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem]"
                    >
                      <div className="relative flex flex-col h-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] transition-all duration-500 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-[0_20px_60px_-15px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_20px_60px_-15px_rgba(37,99,235,0.25)] overflow-hidden min-h-[340px] sm:min-h-[380px] hover:-translate-y-1.5">
                        
                        {/* CONTENT BLOCK */}
                        <div className="p-6 sm:p-8 md:p-10 flex flex-col flex-1 relative z-10 min-w-0">
                          
                          {/* Top Title Row */}
                          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                            <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl flex items-center justify-center p-2.5 sm:p-3 shadow-sm group-hover:border-blue-200 dark:group-hover:border-blue-900/50 transition-colors duration-300 overflow-hidden">
                              <Image 
                                src="/logo.png" 
                                fill 
                                alt="Brand Logo" 
                                className="dark:invert object-contain p-2 sm:p-2.5 opacity-80 group-hover:opacity-100 transition-opacity relative z-10" 
                              />
                            </div>
                            
                            <div className="h-8 sm:h-10 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                            
                            <h3 className="font-google-sans text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-extrabold text-zinc-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-tight min-w-0 break-words">
                              {avatar.title}
                            </h3>
                          </div>

                          {/* Detailed Explanation Area */}
                          <div className="mb-8 sm:mb-12 flex-1">
                            <div className="font-medium leading-relaxed max-w-xl transition-colors duration-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-300">
                              {avatar.description}
                            </div>
                          </div>

                          {/* Action Row - Solid Blue Effects */}
                          <div className="mt-auto pt-6 sm:pt-8 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between relative">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-google-sans text-[11px] sm:text-sm md:text-base font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 tracking-widest uppercase transition-colors duration-300 truncate">
                                Initialize Agent
                              </span>
                            </div>
                            
                            {/* The Button */}
                            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 rounded-full bg-zinc-100 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center transition-all duration-300 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white group-hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)]">
                              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-rotate-45 transition-transform duration-300 group-hover:text-white group-hover:scale-110" />
                            </div>
                          </div>

                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>

        </div>
      </div>
    </>
  )
}