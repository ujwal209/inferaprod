'use client'

import * as React from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { Brain, Map, BookOpen, Rss, MessageSquareHeart, Zap, ArrowRight } from "lucide-react"

export default function FeaturesPage() {
  // Enhanced features array with Bento-box span rules and dynamic, color-coded themes
  const features = [
    { 
      title: 'General Assistant', 
      desc: 'Your all-purpose mentor for thinking, writing, and problem-solving. Ask anything and receive thoughtful, highly-structured answers instantly.',
      icon: <Brain size={28} />,
      watermark: <Brain size={240} />,
      colSpan: 'md:col-span-2',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20',
      glow: 'hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-[0_20px_50px_rgba(37,99,235,0.15)]'
    },
    { 
      title: 'Roadmap Architect', 
      desc: 'Turn vague goals into clear, actionable execution paths. Define where you want to go—the system maps out exactly how to get there week by week.',
      icon: <Map size={28} />,
      watermark: <Map size={240} />,
      colSpan: 'md:col-span-1',
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20',
      glow: 'hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)]'
    },
    { 
      title: 'Neural Study Buddy', 
      desc: 'Understand deeply. Master faster. Ask difficult academic questions and get step-by-step explanations that actually stick in your memory.',
      icon: <BookOpen size={28} />,
      watermark: <BookOpen size={240} />,
      colSpan: 'md:col-span-1',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20',
      glow: 'hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)]'
    },
    { 
      title: 'Live Intelligence Feed', 
      desc: 'Real-time insights across education, technology, and industry. Stay current—the platform searches the web and surfaces what is relevant to you automatically.',
      icon: <Rss size={28} />,
      watermark: <Rss size={240} />,
      colSpan: 'md:col-span-2',
      color: 'text-cyan-500',
      bg: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-500/20',
      glow: 'hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:shadow-[0_20px_50px_rgba(6,182,212,0.15)]'
    },
    { 
      title: 'Community Feedback', 
      desc: 'Built with you, for you. Your feedback directly shapes how each module evolves—this platform is a living, breathing product that learns what you need.',
      icon: <MessageSquareHeart size={28} />,
      watermark: <MessageSquareHeart size={240} />,
      colSpan: 'md:col-span-2',
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20',
      glow: 'hover:border-purple-400 dark:hover:border-purple-500/50 hover:shadow-[0_20px_50px_rgba(168,85,247,0.15)]'
    },
    { 
      title: 'Seamless Execution', 
      desc: 'Swipe. Select. Execute. Everything you need is one interaction away—no friction, no clutter. Just absolute clarity and speed.',
      icon: <Zap size={28} />,
      watermark: <Zap size={240} />,
      colSpan: 'md:col-span-1',
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20',
      glow: 'hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)]'
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
        
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse duration-[4000ms]" />
        <div className="absolute top-[40%] left-0 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />

        <Navbar />
        
        <main className="flex-1 pt-32 pb-20 sm:pt-40 sm:pb-32 relative z-10">
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12">
            
            {/* Page Header */}
            <div className="text-center mb-16 sm:mb-24">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] sm:text-xs font-bold font-google-sans uppercase tracking-[0.2em] mb-8 shadow-sm">
                Core Modules
              </div>
              <h1 className="font-google-sans text-5xl sm:text-6xl md:text-7xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-6 leading-[1.05]">
                Everything you need. <br className="hidden sm:block" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-500 to-zinc-400 dark:from-zinc-400 dark:to-zinc-600">
                  Nothing you don't.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
                Infera Core is a collection of precision-built AI modules — each focused, fast, and deeply integrated into your daily workflow.
              </p>
            </div>

            {/* SaaS Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {features.map((f, i) => (
                <div 
                  key={i} 
                  className={`group relative flex flex-col bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/80 rounded-[2.5rem] p-8 sm:p-12 transition-all duration-500 hover:-translate-y-2 overflow-hidden shadow-sm ${f.colSpan} ${f.glow}`}
                >
                  
                  {/* Giant Abstract Watermark Icon */}
                  <div className={`absolute -right-12 -bottom-16 opacity-[0.03] dark:opacity-[0.02] group-hover:opacity-[0.08] dark:group-hover:opacity-[0.06] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none z-0 ${f.color}`}>
                    {f.watermark}
                  </div>

                  {/* Icon Block */}
                  <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border transition-all duration-500 shadow-sm group-hover:scale-110 ${f.bg} ${f.color}`}>
                    {f.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col h-full">
                    <h3 className="font-google-sans text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-4">
                      {f.title}
                    </h3>
                    <p className="text-[16px] sm:text-[17px] text-zinc-500 dark:text-zinc-400 font-medium leading-[1.8] mt-auto">
                      {f.desc}
                    </p>
                  </div>
                  
                </div>
              ))}
            </div>

            {/* Bottom Exuberant CTA */}
            <div className="mt-32 sm:mt-40 relative max-w-5xl mx-auto">
              <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-600/10 rounded-[3rem] blur-[80px] pointer-events-none -z-10" />
              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 rounded-[3rem] p-12 sm:p-20 text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
                <h2 className="font-google-sans text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-6">
                  Ready to start building?
                </h2>
                <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium max-w-xl mx-auto mb-10">
                  Join the platform and gain access to the complete suite of intelligence tools designed to accelerate your growth.
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