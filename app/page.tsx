'use client'

import * as React from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { 
  ArrowRight, Sparkles, CheckSquare, Square, Target, 
  Brain, Map, BookOpen, Rss, MessageSquareHeart, ChevronRight,
  Zap
} from "lucide-react"

export default function LandingPage() {
  const [agreed, setAgreed] = React.useState(false)
  const [error, setError] = React.useState(false)

  const handleSignupClick = (e: React.MouseEvent) => {
    if (!agreed) {
      e.preventDefault()
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap');
        
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .font-google-sans { font-family: 'Google Sans', sans-serif !important; }
      `}} />

      {/* Root Container: Strictly hides horizontal overflow for mobile stability */}
      <div className="min-h-screen font-outfit bg-[#fafafa] dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 tracking-tight antialiased selection:bg-blue-500/20 overflow-x-hidden flex flex-col">
        
        <Navbar />
        
        {/* =========================================================
            INSANE HERO SECTION (Strict Blue Theme)
        ========================================================= */}
        <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 md:pt-48 md:pb-40 overflow-hidden border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-col items-center justify-center min-h-[90vh]">
          
          {/* Ambient Volumetric Background */}
          <div className="absolute inset-0 bg-[#fafafa] dark:bg-[#050505] -z-30" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_80%,transparent_100%)] sm:[mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_80%,transparent_100%)] -z-20 opacity-60 dark:opacity-80" />
          
          {/* Unified Blue Glows */}
          <div className="absolute top-[-5%] sm:top-[-10%] left-1/2 -translate-x-1/2 w-[120%] sm:w-[100%] max-w-[1000px] h-[300px] sm:h-[400px] bg-blue-500/15 dark:bg-blue-600/20 rounded-[100%] blur-[80px] sm:blur-[160px] pointer-events-none -z-10 animate-pulse duration-[4000ms]" />
          <div className="absolute top-[10%] sm:top-[20%] left-[-20%] sm:left-[-10%] w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-blue-400/10 dark:bg-blue-500/10 rounded-[100%] blur-[100px] sm:blur-[120px] pointer-events-none -z-10" />
          <div className="absolute top-[10%] sm:top-[20%] right-[-20%] sm:right-[-10%] w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-blue-500/10 dark:bg-blue-400/10 rounded-[100%] blur-[100px] sm:blur-[120px] pointer-events-none -z-10" />

          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 relative flex flex-col items-center text-center z-10 w-full">
        

            {/* Fluid Responsive Headline - Unified Blue Gradient */}
            <h1 className="font-google-sans text-[3rem] leading-[1.1] sm:text-[4rem] md:text-6xl lg:text-[7.5rem] lg:leading-[1.05] font-extrabold tracking-tighter mb-6 sm:mb-8 max-w-5xl text-zinc-900 dark:text-white drop-shadow-sm px-2">
              Stop guessing.<br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300"> 
                Start executing.
              </span>
            </h1>

            {/* Fluid Subtitle */}
            <p className="text-[16px] sm:text-[18px] lg:text-[22px] text-zinc-500 dark:text-zinc-400 font-medium leading-[1.6] sm:leading-relaxed max-w-2xl mb-10 sm:mb-12 px-4 sm:px-2">
              An intelligent, noise-free system designed to simplify your decisions, accelerate your learning, and map out your career path.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16 sm:mb-24">
              <button 
                onClick={() => { const el = document.getElementById('cta'); if (el) el.scrollIntoView({ behavior: 'smooth' }) }} 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-google-sans font-bold px-8 sm:px-10 h-14 sm:h-16 rounded-full transition-all text-[16px] sm:text-[17px] shadow-[0_0_30px_rgba(37,99,235,0.3)] dark:shadow-[0_0_40px_rgba(37,99,235,0.2)] hover:shadow-[0_0_50px_rgba(37,99,235,0.4)] active:scale-95 hover:-translate-y-1 outline-none group"
              >
                Access Workspace <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <Link 
                href="/how-it-works" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/80 dark:bg-[#111113]/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-[#18181b] text-zinc-900 dark:text-zinc-100 font-google-sans font-bold px-8 sm:px-10 h-14 sm:h-16 rounded-full transition-all text-[16px] sm:text-[17px] shadow-sm hover:shadow-md active:scale-95 hover:-translate-y-1 outline-none"
              >
                See Architecture
              </Link>
            </div>

            {/* Glassmorphic Feature Badges - Strict Blue Theme */}
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-4 max-w-4xl px-2">
              {[
                { icon: <Brain size={14} className="sm:w-4 sm:h-4" />, label: 'General Assistant' },
                { icon: <Map size={14} className="sm:w-4 sm:h-4" />, label: 'Roadmap Architect' },
                { icon: <BookOpen size={14} className="sm:w-4 sm:h-4" />, label: 'Neural Study Buddy' },
                { icon: <Rss size={14} className="sm:w-4 sm:h-4" />, label: 'Live Intelligence' },
                { icon: <MessageSquareHeart size={14} className="sm:w-4 sm:h-4" />, label: 'Community Feedback' },
              ].map((badge) => (
                <div 
                  key={badge.label} 
                  className="inline-flex items-center gap-2 bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-[12px] sm:text-[14px] font-bold font-google-sans tracking-wide px-4 sm:px-5 py-2.5 sm:py-3 rounded-full shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-all hover:-translate-y-1 cursor-default group"
                >
                  <span className="text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                    {badge.icon}
                  </span>
                  {badge.label}
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* =========================================================
            HOW IT WORKS PREVIEW (Strict Blue Theme)
        ========================================================= */}
        <section className="py-24 sm:py-32 bg-[#fafafa] dark:bg-[#050505] relative border-b border-zinc-200/50 dark:border-zinc-800/50">
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 sm:mb-24">
              <div className="max-w-2xl">
                <p className="text-[12px] sm:text-[13px] font-bold font-google-sans text-blue-600 dark:text-blue-500 tracking-[0.2em] uppercase mb-4">The Workflow</p>
                <h2 className="font-google-sans text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-4">
                  Built for speed.
                </h2>
                <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
                  No steep learning curves. Jump in and start getting answers immediately.
                </p>
              </div>
              <Link href="/how-it-works" className="hidden md:inline-flex items-center gap-2 font-google-sans font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-[16px] transition-colors group">
                Read Full Process <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Exuberant Cards - Unified Blue Accents */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                { title: 'Personalize', desc: 'Tell the system what you are studying and where you want to go. We handle the rest.', icon: <Sparkles size={28} /> },
                { title: 'Select Tool', desc: 'Switch instantly between career planning, math solving, or live industry news.', icon: <Zap size={28} /> },
                { title: 'Execute', desc: 'Receive perfectly formatted lists, code blocks, and tables ready to be used.', icon: <Target size={28} /> }
              ].map((step, i) => (
                <div key={i} className="flex flex-col p-8 sm:p-10 rounded-[2.5rem] bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-500 hover:-translate-y-2 group hover:shadow-[0_0_40px_rgba(37,99,235,0.1)] dark:hover:shadow-[0_0_40px_rgba(37,99,235,0.15)] hover:border-blue-500/30 dark:hover:border-blue-500/30">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-[#111113] border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500 shadow-sm text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:border-blue-200 dark:group-hover:border-blue-500/30">
                    {step.icon}
                  </div>
                  <h3 className="font-google-sans text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mb-3">{step.title}</h3>
                  <p className="text-[16px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 md:hidden text-center">
              <Link href="/how-it-works" className="inline-flex items-center justify-center w-full py-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 font-google-sans font-bold text-zinc-900 dark:text-white text-[16px]">
                Read Full Process <ArrowRight size={18} className="ml-2 text-blue-500" />
              </Link>
            </div>

          </div>
        </section>

        {/* =========================================================
            EXUBERANT CTA SECTION 
        ========================================================= */}
        <section id="cta" className="py-20 sm:py-32 lg:py-40 bg-white dark:bg-[#050505] overflow-hidden relative flex-1">
          <div className="max-w-[800px] mx-auto px-5 sm:px-8 text-center relative z-10">
            
            {/* Responsive Huge Center Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] sm:w-[600px] h-[250px] sm:h-[600px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[80px] sm:blur-[140px] pointer-events-none -z-10" />

            <h2 className="font-google-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-zinc-900 dark:text-white mb-4 sm:mb-6 leading-[1.05]">
              Ready to deploy?
            </h2>
            
            <p className="text-[16px] sm:text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 font-medium mb-10 sm:mb-16 max-w-2xl mx-auto leading-relaxed px-2">
              Join the platform and transform the way you learn, plan, and execute.
            </p>

            <div className="flex flex-col items-center max-w-lg mx-auto w-full">
              
              {/* Premium Checkbox Terminal */}
              <button 
                onClick={() => setAgreed(!agreed)} 
                className={`flex items-start gap-3 sm:gap-4 w-full text-left p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] border-2 transition-all duration-300 outline-none mb-6 sm:mb-10 bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-xl ${
                  error 
                    ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
                    : agreed 
                      ? 'border-blue-500 dark:border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.1)]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-zinc-700 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]'
                }`}
              >
                <div className="mt-1 sm:mt-0.5 text-zinc-900 dark:text-white shrink-0 transition-transform duration-300 hover:scale-110">
                  {agreed ? <CheckSquare size={24} className="sm:w-7 sm:h-7 text-blue-600 dark:text-blue-500" /> : <Square size={24} className="sm:w-7 sm:h-7 text-zinc-300 dark:text-zinc-700" />}
                </div>
                <div>
                  <h4 className={`font-google-sans text-[15px] sm:text-[16px] font-bold mb-1 transition-colors ${agreed ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    Initialize Workspace
                  </h4>
                  <p className="text-[13px] sm:text-[14px] font-medium text-zinc-500 dark:text-zinc-500 leading-relaxed pr-2">
                    I understand how the platform operates and I am ready to accelerate my engineering workflow.
                  </p>
                </div>
              </button>

              <Link 
                href="/auth/signup" 
                onClick={handleSignupClick} 
                className={`w-full inline-flex items-center justify-center gap-3 font-google-sans font-bold h-14 sm:h-16 rounded-full text-[16px] sm:text-[17px] transition-all outline-none ${
                  agreed 
                    ? 'bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(255,255,255,0.15)] active:scale-95 hover:-translate-y-1' 
                    : 'bg-zinc-100 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
              >
                Create Account <ChevronRight size={20} className={agreed ? "text-white dark:text-zinc-900" : "text-zinc-400"} />
              </Link>
              
              <div className="h-6 mt-4 sm:mt-6">
                {error && (
                  <p className="text-red-500 text-[12px] sm:text-[14px] font-bold animate-in fade-in zoom-in-95 duration-300 flex items-center justify-center gap-2">
                    <AlertCircle size={16} className="w-4 h-4 sm:w-5 sm:h-5" /> Please acknowledge the agreement to proceed.
                  </p>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* Prevent Footer from squishing layout */}
        <div className="shrink-0">
          <Footer />
        </div>
        
      </div>
    </>
  )
}

// Quick fallback icon for the error state
function AlertCircle({ size, className }: { size?: number, className?: string }) {
  return (
    <svg width={size || 24} height={size || 24} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  )
}