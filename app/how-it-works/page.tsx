'use client'

import * as React from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { Sparkles, Zap, Target, ArrowRight, Layers, MessageSquare, CheckCircle } from "lucide-react"

export default function HowItWorksPage() {
  const screens = [
    {
      number: '01',
      title: 'Tell us about yourself.',
      description: 'When you first sign in, we ask a few simple questions. Tell us what you are studying, what skills you already have, and what your dream job looks like. By understanding exactly where you are starting from, the platform perfectly personalizes every piece of advice and study guide just for you.',
      icon: <Sparkles size={36} className="text-blue-500" />,
      nodeIcon: <Layers size={20} className="text-blue-500" />,
      gradient: 'from-blue-600 to-cyan-500',
      glow: 'group-hover:shadow-[0_0_40px_rgba(37,99,235,0.2)]'
    },
    {
      number: '02',
      title: 'Pick the right assistant.',
      description: 'Choose the specific tool you need for your current task. Need to plan your next four years of college? Use the Career Planner. Struggling to understand a difficult math concept? Switch over to the Study Buddy. As you chat, our system silently searches the live internet to make sure your answers are always based on today’s facts.',
      icon: <Zap size={36} className="text-indigo-500" />,
      nodeIcon: <MessageSquare size={20} className="text-indigo-500" />,
      gradient: 'from-indigo-600 to-purple-500',
      glow: 'group-hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]'
    },
    {
      number: '03',
      title: 'Get clear, ready-to-use answers.',
      description: 'We do the heavy lifting so you do not have to. Instead of giving you a giant, confusing wall of text, we organize your answers into neat tables, step-by-step lists, and clear bullet points. Everything is built to help you stop reading and start taking action immediately.',
      icon: <Target size={36} className="text-emerald-500" />,
      nodeIcon: <CheckCircle size={20} className="text-emerald-500" />,
      gradient: 'from-emerald-500 to-teal-400',
      glow: 'group-hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]'
    }
  ]

  return (
    <>
      {/* --- FONT INJECTION --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap');
        
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .font-google-sans { font-family: 'Google Sans', sans-serif !important; }
      `}} />

      <div className="min-h-screen font-outfit bg-[#fafafa] dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 tracking-tight antialiased flex flex-col relative overflow-hidden">

        {/* Ambient Background Grid & Multi-Glows */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_100%_at_50%_0%,#000_70%,transparent_100%)] -z-10 opacity-60 dark:opacity-80" />
        
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse duration-[4000ms]" />
        <div className="absolute top-[40%] right-0 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />

        <Navbar />

        <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-32 relative z-10">
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12">

            {/* Page Header */}
            <div className="text-center mb-24 sm:mb-32">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] sm:text-xs font-bold font-google-sans uppercase tracking-[0.2em] mb-8 shadow-sm">
                The Process
              </div>
              <h1 className="font-google-sans text-5xl sm:text-6xl md:text-7xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-6 leading-[1.05]">
                Simple steps. <br className="md:hidden" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">
                  Powerful results.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
                We removed all the complicated settings. Experience a frictionless, step-by-step breakdown of how you will use the platform to learn and grow.
              </p>
            </div>

            {/* Alternating Glowing Timeline */}
            <div className="relative max-w-6xl mx-auto">
              
              {/* The Central Spine (Left-aligned on mobile, centered on desktop) */}
              <div className="absolute left-8 lg:left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-blue-500/0 via-blue-500/40 dark:via-blue-500/30 to-blue-500/0 -translate-x-1/2 z-0 hidden sm:block" />

              {screens.map((step, index) => {
                const isLeft = index % 2 === 0;
                
                return (
                  <div 
                    key={step.number} 
                    className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-0 mb-20 lg:mb-32 group ${isLeft ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}
                  >
                    
                    {/* Center Glowing Node */}
                    <div className="hidden sm:flex absolute left-8 lg:left-1/2 w-14 h-14 bg-[#fafafa] dark:bg-[#050505] border-[4px] border-white dark:border-[#0c0c0e] rounded-full -translate-x-1/2 items-center justify-center z-20 transition-transform duration-500 group-hover:scale-110">
                      <div className={`w-full h-full rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-[0_0_20px_rgba(59,130,246,0.1)] group-hover:border-blue-500/50 dark:group-hover:border-blue-500/50 transition-colors`}>
                        {step.nodeIcon}
                      </div>
                    </div>

                    {/* Card Container */}
                    <div className={`w-full sm:pl-28 lg:pl-0 lg:w-[45%] ${isLeft ? 'lg:pr-16' : 'lg:pl-16'}`}>
                      
                      <div className={`relative p-8 sm:p-12 rounded-[2.5rem] bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 transition-all duration-500 hover:-translate-y-2 ${step.glow} z-10 overflow-hidden`}>
                        
                        {/* Massive Abstract Number Watermark */}
                        <div className={`absolute -right-8 -top-12 font-google-sans text-[160px] font-black tracking-tighter select-none pointer-events-none opacity-[0.03] dark:opacity-[0.02] bg-clip-text text-transparent bg-gradient-to-b ${step.gradient} group-hover:opacity-[0.08] dark:group-hover:opacity-[0.05] transition-opacity duration-700`}>
                          {step.number}
                        </div>

                        {/* Top Header Row */}
                        <div className="flex items-center gap-6 mb-8 relative z-10">
                          <div className={`w-20 h-20 shrink-0 rounded-[1.5rem] bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-[#111113] dark:to-[#0a0a0a] border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                            {step.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-google-sans text-sm font-bold text-zinc-400 dark:text-zinc-500 tracking-[0.2em] uppercase mb-1">
                              Phase {step.number}
                            </span>
                            <h3 className="font-google-sans text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
                              {step.title}
                            </h3>
                          </div>
                        </div>

                        {/* Content */}
                        <p className="text-[16px] sm:text-[18px] text-zinc-600 dark:text-zinc-400 leading-[1.8] font-medium relative z-10">
                          {step.description}
                        </p>
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Exuberant CTA */}
            <div className="mt-32 sm:mt-40 relative">
              <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-600/10 rounded-[3rem] blur-[80px] pointer-events-none -z-10" />
              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 rounded-[3rem] p-12 sm:p-20 text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
                <h2 className="font-google-sans text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-6">
                  Ready to get started?
                </h2>
                <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium max-w-xl mx-auto mb-10">
                  Stop worrying about how to plan your career and let us help you take the first step. Create your account in under 60 seconds.
                </p>
                <Link 
                  href="/auth/signup" 
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-google-sans font-bold text-[17px] transition-all shadow-[0_8px_30px_rgba(37,99,235,0.3)] dark:shadow-[0_8px_30px_rgba(37,99,235,0.15)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] dark:hover:shadow-[0_15px_40px_rgba(37,99,235,0.25)] active:scale-95 hover:-translate-y-1 outline-none"
                >
                  Create Free Account <ArrowRight size={20} />
                </Link>
              </div>
            </div>

          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}