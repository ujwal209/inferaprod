'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowRight, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Target, 
  Settings2, 
  Cpu
} from 'lucide-react'

const AVATARS = [
  {
    title: "General Assistant",
    shortName: "Assistant",
    label: "Core AI",
    description: "Your versatile companion for daily operational tasks. This agent is engineered to handle creative writing, complex inquiries, and extensive data summarization. It adapts seamlessly to your specific tone and provides grounded, high-fidelity responses to keep your workflow completely uninterrupted.",
    useCase: "General Intelligence",
    href: "/dashboard/chat",
  },
  {
    title: "Roadmap Architect",
    shortName: "Roadmap",
    label: "Planner",
    description: "A precision tool designed for strategic career mapping. It analyzes market trends and your current skill set to generate granular, step-by-step execution plans. Use this agent to outline clear milestones for career transitions and technical mastery.",
    useCase: "Strategic Planning",
    href: "/dashboard/chat/roadmap",
  },
  {
    title: "Neural Study Buddy",
    shortName: "Study",
    label: "Scholar",
    description: "Designed strictly for deep learning and technical synthesis. It deconstructs high-level academic concepts and tough engineering problems into digestible mental models, helping you master complex subjects efficiently from first principles.",
    useCase: "Technical Synthesis",
    href: "/dashboard/chat/study",
  }
]

export default function HeroHighlight() {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = React.useState(0)

  // Passive listener for mobile swiping to update the dots
  const handleScroll = () => {
    if (!scrollRef.current) return
    const scrollLeft = scrollRef.current.scrollLeft
    const width = scrollRef.current.clientWidth
    const newIndex = Math.round(scrollLeft / width)
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex)
    }
  }

  // Bulletproof manual scroll function for the buttons
  const scrollToSlide = (index: number) => {
    if (!scrollRef.current) return
    const width = scrollRef.current.clientWidth
    scrollRef.current.scrollTo({
      left: width * index,
      behavior: 'smooth'
    })
    setActiveIndex(index)
  }

  // Navigation Handlers
  const handleNext = () => {
    const nextIndex = (activeIndex + 1) % AVATARS.length
    scrollToSlide(nextIndex)
  }

  const handlePrev = () => {
    const prevIndex = (activeIndex - 1 + AVATARS.length) % AVATARS.length
    scrollToSlide(prevIndex)
  }

  const handleDotClick = (index: number) => {
    scrollToSlide(index)
  }

  return (
    <>
      {/* Injecting the requested Google Fonts directly. 
        Applying Outfit globally, and setting custom classes for Google Sans.
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap');
        
        .font-outfit {
          font-family: 'Outfit', sans-serif !important;
        }
        
        .font-google-sans {
          font-family: 'Google Sans', sans-serif !important;
        }
      `}} />

      <div className="font-outfit w-full min-h-screen bg-white dark:bg-[#050505] transition-colors duration-300 relative pb-24">
        
        {/* Subtle top glow to blend with navbar if needed */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] max-w-[800px] h-[300px] bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-[1400px] mx-auto flex flex-col gap-16 md:gap-24 pt-8 md:pt-12 tracking-tight px-4 sm:px-6 lg:px-8">
          
          {/* --- SECTION 1: HIGHLIGHT SHOWCASE --- */}
          <section className="relative w-full flex flex-col mt-4 md:mt-8">
            
            {/* Subtle Structural Header */}
            <div className="flex items-center gap-3 mb-8 md:mb-10">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm">
                <Cpu className="text-zinc-600 dark:text-zinc-400" size={18} />
              </div>
              <h2 className="font-google-sans text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Initialize Agent
              </h2>
            </div>

            {/* Carousel Container (Swipeable on mobile, scrollbars hidden) */}
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory gap-6 md:gap-8 pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {AVATARS.map((avatar, i) => (
                <div 
                  key={i} 
                  className="snap-center shrink-0 w-full"
                >
                  <Link 
                    href={avatar.href}
                    className="group relative block w-full outline-none"
                  >
                    <div className="relative flex flex-col md:flex-row md:items-stretch bg-white dark:bg-[#0c0c0e] border border-zinc-200/80 dark:border-zinc-800/80 rounded-[2rem] md:rounded-[2.5rem] transition-all duration-500 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden min-h-[380px] hover:-translate-y-1">
                      
                      {/* Subtle hover gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/5 dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      {/* CONTENT BLOCK */}
                      <div className="p-8 md:p-12 lg:p-16 flex flex-col flex-1 justify-between relative z-10">
                        
                        {/* Branding Identity Row */}
                        <div className="flex items-center justify-between mb-10">
                          <div className="flex items-center gap-5">
                            <div className="relative w-14 h-14 md:w-16 md:h-16 shrink-0 bg-zinc-50 dark:bg-[#111] border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-center p-3 shadow-sm group-hover:shadow-md transition-all duration-300">
                              <Image 
                                src="/logo.png" 
                                fill 
                                alt="Brand Logo" 
                                className="dark:invert object-contain p-2 opacity-80 group-hover:opacity-100 transition-opacity" 
                              />
                            </div>
                            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
                            <span className="font-google-sans text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white uppercase tracking-tighter">
                              {avatar.shortName}
                            </span>
                          </div>
                          <span className="hidden sm:inline-flex items-center px-4 py-1.5 bg-zinc-100 dark:bg-zinc-900 text-[11px] font-bold uppercase tracking-widest rounded-full border border-zinc-200/80 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                            {avatar.label}
                          </span>
                        </div>

                        {/* Detailed Explanation Area */}
                        <div className="space-y-4 mb-12">
                          <h3 className="font-google-sans text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                            {avatar.title}
                          </h3>
                          <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg font-medium leading-relaxed max-w-4xl">
                            {avatar.description}
                          </p>
                        </div>

                        {/* Action Row */}
                        <div className="mt-auto pt-8 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                          <div className="space-y-1.5">
                            <p className="font-google-sans text-[10px] font-bold text-zinc-400 uppercase tracking-[0.25em]">Primary Application</p>
                            <p className="text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">{avatar.useCase}</p>
                          </div>
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center transition-all duration-300 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(37,99,235,0.25)]">
                            <ArrowRight size={24} className="group-hover:-rotate-45 transition-transform duration-300" />
                          </div>
                        </div>

                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* --- MANUAL NAVIGATION CONTROLS --- */}
            <div className="flex items-center justify-between md:justify-start gap-8 mt-2 md:mt-4">
              
              <button 
                onClick={handlePrev}
                className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#111] hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm hover:shadow-md outline-none cursor-pointer"
                aria-label="Previous Agent"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Indicators */}
              <div className="flex items-center gap-3">
                {AVATARS.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleDotClick(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-500 outline-none cursor-pointer ${
                      activeIndex === i 
                        ? 'w-12 md:w-16 bg-blue-600' 
                        : 'w-3 md:w-4 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                    }`} 
                  />
                ))}
              </div>

              <button 
                onClick={handleNext}
                className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#111] hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm hover:shadow-md outline-none cursor-pointer"
                aria-label="Next Agent"
              >
                <ChevronRight size={24} />
              </button>

            </div>
          </section>

          {/* --- SECTION 2: SYSTEM MANUAL / QUICK START GUIDE --- */}
          <section className="mt-8 md:mt-16">
            <div className="flex items-center gap-3 mb-8 md:mb-12">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm">
                <BookOpen className="text-zinc-600 dark:text-zinc-400" size={18} />
              </div>
              <h2 className="font-google-sans text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Operational Manual
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              
              {/* Step 1 */}
              <div className="group p-8 md:p-10 rounded-[2rem] bg-[#fafafa] dark:bg-[#0a0a0a] border border-zinc-200/80 dark:border-zinc-800/60 hover:bg-white dark:hover:bg-[#0c0c0e] hover:border-blue-200 dark:hover:border-zinc-700 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-8 shadow-sm group-hover:border-blue-200 dark:group-hover:border-blue-900 transition-colors">
                  <Target size={20} className="text-blue-600 dark:text-blue-500" />
                </div>
                <h3 className="font-google-sans text-xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">1. Select a Domain</h3>
                <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                  Navigate the core models above to find the agent tailored to your task. Each model operates in isolation to provide highly specialized expertise rather than generic knowledge.
                </p>
              </div>

              {/* Step 2 */}
              <div className="group p-8 md:p-10 rounded-[2rem] bg-[#fafafa] dark:bg-[#0a0a0a] border border-zinc-200/80 dark:border-zinc-800/60 hover:bg-white dark:hover:bg-[#0c0c0e] hover:border-blue-200 dark:hover:border-zinc-700 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-8 shadow-sm group-hover:border-blue-200 dark:group-hover:border-blue-900 transition-colors">
                  <Settings2 size={20} className="text-blue-600 dark:text-blue-500" />
                </div>
                <h3 className="font-google-sans text-xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">2. Establish Context</h3>
                <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                  Once a session is initialized, provide background parameters. The systems perform optimally when given rigid constraints, precise goals, and formatting preferences upfront.
                </p>
              </div>

              {/* Step 3 */}
              <div className="group p-8 md:p-10 rounded-[2rem] bg-[#fafafa] dark:bg-[#0a0a0a] border border-zinc-200/80 dark:border-zinc-800/60 hover:bg-white dark:hover:bg-[#0c0c0e] hover:border-blue-200 dark:hover:border-zinc-700 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-8 shadow-sm group-hover:border-blue-200 dark:group-hover:border-blue-900 transition-colors">
                  <Sparkles size={20} className="text-blue-600 dark:text-blue-500" />
                </div>
                <h3 className="font-google-sans text-xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">3. Iterate and Refine</h3>
                <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                  Treat initial outputs as structural drafts. Utilize targeted follow-up prompts to calibrate the tone, expand upon core bullet points, or pivot the strategic direction entirely.
                </p>
              </div>

            </div>
          </section>

        </div>
      </div>
    </>
  )
}