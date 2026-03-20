'use client'

import * as React from 'react'
import { useState } from 'react'
import { DashboardNavbar } from '@/components/dashboard/dashboard-navbar'
import { submitReview } from '@/app/actions/review'
import { Star, Loader2, CheckCircle2, ArrowRight, ChevronDown, Sparkles, HelpCircle } from 'lucide-react'
import Link from 'next/link'

// ============================================================================
// COMPREHENSIVE PLATFORM FAQS
// ============================================================================
const FAQS = [
  {
    q: "What exactly is INFERA CORE?",
    a: "INFERA CORE is an elite, AI-driven engineering mentor designed to accelerate learning, simplify complex decisions, and map out your career. It replaces fragmented tools with a single, highly structured intelligence workspace."
  },
  {
    q: "How does the Live Intelligence Search work?",
    a: "Unlike standard AI models that rely on outdated training data, our system features a Deep Search engine that scrapes the live internet in real-time. This ensures every roadmap, statistic, and study guide is grounded in today's reality."
  },
  {
    q: "Who is this platform built for?",
    a: "It is engineered primarily for computer science students, software engineers, and technical professionals who want to optimize their career trajectories, master new concepts quickly, and stay ahead of industry trends."
  },
  {
    q: "How does the Roadmap Architect build my path?",
    a: "By analyzing your initial onboarding profile (your current stack, major, and goals), the Architect synthesizes live industry data to generate a highly specific, week-by-week execution plan tailored to your exact target role."
  },
  {
    q: "Are the AI responses just generic text?",
    a: "No. INFERA CORE is strictly engineered to provide structured, actionable outputs. You will receive precise Markdown tables, LaTeX-formatted mathematics, and step-by-step execution lists—never walls of confusing text."
  },
  {
    q: "Is my personal data and telemetry secure?",
    a: "Absolutely. Your academic matrix, skill fingerprint, and career goals are strictly encrypted. We only use this telemetry internally to personalize your intelligence feeds and roadmaps."
  },
  {
    q: "How is my review feedback used?",
    a: "Your insights go directly to our core engineering and product teams. We actively use community telemetry to prioritize new modules, fix bugs, and refine our AI accuracy."
  }
]

export default function ReviewPage() {
  const [rating, setRating] = useState<number>(0)
  const [hoveredRating, setHoveredRating] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  // State for the Collapsible FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0) // First one open by default

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (rating === 0) {
      setErrorMsg('Please select a star rating.')
      return
    }
    
    setLoading(true)
    setErrorMsg('')
    
    try {
      const formData = new FormData(e.currentTarget)
      formData.append('rating', rating.toString())
      await submitReview(formData)
      setSuccess(true)
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while submitting your review.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* --- FONT INJECTION --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap');
        
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .font-google-sans { font-family: 'Google Sans', sans-serif !important; }
      `}} />

      {/* Locked height to prevent mobile browser bounce, scrolling handled internally */}
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-[#fafafa] dark:bg-[#050505] font-outfit antialiased selection:bg-blue-500/20">
        
        {/* GLOBAL NAVBAR (Fixed height) */}
        <div className="shrink-0 z-50">
          <DashboardNavbar userEmail="Operator" />
        </div>

        {/* SPLIT SCREEN LAYOUT - Flex Col on Mobile, Flex Row on Desktop */}
        <main className="flex-1 flex flex-col lg:flex-row w-full overflow-y-auto lg:overflow-hidden relative custom-scrollbar">
          
          {/* =========================================================================
              LEFT PANEL: Comprehensive FAQ (Top on Mobile, Left on Desktop)
          ========================================================================= */}
          <div className="lg:h-full lg:w-5/12 xl:w-[45%] bg-[#0c0c0e] text-white p-8 sm:p-12 xl:p-16 flex flex-col relative lg:overflow-y-auto custom-scrollbar lg:border-r border-zinc-800/80 shadow-2xl z-10 shrink-0">
            
            {/* Subtle Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.08),transparent_50%)]" />
              <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-lg mx-auto py-4 lg:py-6 space-y-10 lg:space-y-12">
              
              {/* FAQ Header Block */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold font-google-sans uppercase tracking-[0.2em] mb-6 shadow-sm">
                  <HelpCircle size={14} /> Platform Intelligence
                </div>
                <h1 className="font-google-sans text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-white mb-5">
                  Frequently Asked <br/>
                  <span className="text-blue-400">Questions.</span>
                </h1>
                <p className="text-[15px] sm:text-[16px] xl:text-[17px] text-zinc-400 font-medium leading-relaxed">
                  Everything you need to know about the core architecture, data security, and how your feedback shapes the future of the workspace.
                </p>
              </div>

              {/* Collapsible FAQ Section */}
              <div className="space-y-3 pb-8 lg:pb-10">
                {FAQS.map((faq, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <div 
                      key={i} 
                      className={`border rounded-2xl overflow-hidden transition-colors duration-300 ${
                        isOpen ? 'bg-zinc-900/50 border-zinc-700 shadow-sm' : 'bg-transparent border-zinc-800/60 hover:border-zinc-700'
                      }`}
                    >
                      <button 
                        onClick={() => setOpenFaq(isOpen ? null : i)} 
                        className="w-full flex items-center justify-between p-5 text-left outline-none"
                      >
                        <span className={`font-google-sans text-[14.5px] sm:text-[15px] font-bold transition-colors ${isOpen ? 'text-white' : 'text-zinc-300'} pr-4 leading-snug`}>
                          {faq.q}
                        </span>
                        <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-zinc-800 text-zinc-300' : 'text-zinc-500'}`}>
                          <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      
                      <div 
                        className={`grid transition-all duration-300 ease-in-out ${
                          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="p-5 pt-0 text-[14px] sm:text-[14.5px] text-zinc-400 font-medium leading-[1.7]">
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>
          </div>

          {/* =========================================================================
              RIGHT PANEL: The Form (Bottom on Mobile, Right on Desktop)
          ========================================================================= */}
          <div className="lg:h-full flex-1 p-4 sm:p-8 lg:p-12 xl:p-16 flex items-center justify-center lg:overflow-y-auto custom-scrollbar bg-[#fafafa] dark:bg-[#050505] shrink-0 min-h-max lg:min-h-0">
            <div className="w-full max-w-2xl my-auto py-8 lg:py-0">

              {success ? (
                <div className="bg-white dark:bg-[#0c0c0e] p-8 sm:p-12 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800/80 shadow-sm text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-500 flex items-center justify-center rounded-[1.5rem] mb-6 shadow-sm">
                    <CheckCircle2 size={36} />
                  </div>
                  <h2 className="font-google-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Review Submitted
                  </h2>
                  <p className="text-[15px] sm:text-[16px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-md mx-auto">
                    Thank you for your valuable feedback. It has been successfully added to our system and will be reviewed by our engineering team.
                  </p>
                  <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link 
                      href="/dashboard"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-google-sans font-bold rounded-xl transition-all shadow-[0_8px_20px_rgba(37,99,235,0.2)] active:scale-95 outline-none"
                    >
                      Return to Dashboard <ArrowRight size={18} />
                    </Link>
                    <button 
                      onClick={() => { setSuccess(false); setRating(0); }}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 font-google-sans font-bold rounded-xl transition-colors active:scale-95 outline-none"
                    >
                      Submit Another
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0c0c0e] p-6 sm:p-10 lg:p-12 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800/80 shadow-[0_20px_40px_rgba(0,0,0,0.02)] dark:shadow-none space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Form Header (Visible across all screens now to balance the layout) */}
                  <div className="space-y-2 mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold font-google-sans uppercase tracking-[0.2em] mb-2 shadow-sm">
                      <Sparkles size={12} /> Leave Feedback
                    </div>
                    <h2 className="font-google-sans text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                      Share your experience
                    </h2>
                  </div>

                  {errorMsg && (
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-[14px] font-medium flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  {/* STAR RATING */}
                  <div className="flex flex-col space-y-3 pb-6 border-b border-zinc-100 dark:border-zinc-800/60">
                    <label className="font-google-sans text-[13px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest pl-1">
                      Overall Rating *
                    </label>
                    <div className="flex items-center gap-1 sm:gap-2" onMouseLeave={() => setHoveredRating(0)}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          className="p-1 sm:p-2 transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star 
                            size={32} 
                            className={`transition-colors duration-200 ${
                              star <= (hoveredRating || rating) 
                                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]' 
                                : 'fill-transparent text-zinc-200 dark:text-zinc-800'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FORM FIELDS */}
                  <div className="space-y-6">
                    
                    <div>
                      <label className="font-google-sans block text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 pl-1">
                        Review Headline *
                      </label>
                      <input 
                        name="headline" 
                        required
                        placeholder="e.g. A game-changer for my engineering career" 
                        className="font-outfit w-full h-14 bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-[#111113] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 px-5 rounded-2xl text-[15px] font-medium outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                      />
                    </div>

                    <div>
                      <label className="font-google-sans block text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 pl-1">
                        How has INFERA CORE impacted your path? (Optional)
                      </label>
                      <textarea 
                        name="experience_description" 
                        placeholder="Briefly describe how you use the platform..." 
                        className="font-outfit w-full bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-[#111113] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 px-5 py-4 rounded-2xl text-[15px] font-medium outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100 min-h-[80px] resize-none shadow-sm custom-scrollbar" 
                      />
                    </div>

                    <div>
                      <label className="font-google-sans block text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 pl-1">
                        Detailed Professional Review *
                      </label>
                      <textarea 
                        name="professional_review" 
                        required
                        placeholder="Provide your in-depth feedback, what works well, and what features you'd like to see next..." 
                        className="font-outfit w-full bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-[#111113] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 px-5 py-4 rounded-2xl text-[15px] font-medium outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100 min-h-[120px] resize-none shadow-sm custom-scrollbar leading-relaxed" 
                      />
                    </div>

                  </div>

                  {/* SUBMIT ACTION */}
                  <div className="pt-4 flex justify-end">
                    <button 
                      type="submit"
                      disabled={loading} 
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 h-14 bg-blue-600 text-white rounded-xl font-google-sans font-bold text-[15px] shadow-[0_8px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_10px_25px_rgba(37,99,235,0.3)] hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none group outline-none"
                    >
                      {loading && <Loader2 className="animate-spin" size={18} />}
                      {loading ? 'Submitting...' : 'Submit Intelligence'}
                      {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>

        </main>
      </div>
    </>
  )
}