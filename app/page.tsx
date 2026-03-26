'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { 
  ArrowRight, Sparkles, CheckSquare, Square, Target, 
  Brain, Map, BookOpen, Rss, MessageSquareHeart, ChevronRight,
  Zap, AlertCircle, Terminal, Search, BrainCircuit, Loader2, Send
} from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../public/logo.png'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const DemoComponents: any = {
  p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-relaxed text-[15px]">{children}</p>,
  code: ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match && match[1] !== 'math') {
      return (
        <SyntaxHighlighter
          style={vscDarkPlus as any}
          language={match[1]}
          PreTag="div"
          className="rounded-xl overflow-hidden my-4 shadow-xl border border-zinc-800 !bg-[#0c0c0e] custom-scrollbar text-[13px]"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }
    if (className && className.includes('language-math')) return <span className={className}>{children}</span>;
    return inline
      ? <code className="font-mono text-[0.85em] bg-zinc-200 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded-md text-zinc-900 dark:text-zinc-100">{children}</code>
      : <pre className="font-mono text-[0.85em] bg-[#0c0c0e] border border-zinc-800 text-zinc-200 px-4 py-3 rounded-xl overflow-x-auto my-4 shadow-xl whitespace-pre-wrap custom-scrollbar">{children}</pre>;
  },
  ul: ({ children }: any) => <ul className="list-disc pl-5 space-y-1.5 my-3 text-[15px]">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-1.5 my-3 text-[15px]">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed pl-1">{children}</li>,
  table: ({ children }: any) => <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 my-4 shadow-sm"><table className="w-full text-left border-collapse text-[14px]">{children}</table></div>,
  th: ({ children }: any) => <th className="bg-zinc-100 dark:bg-zinc-900/50 px-4 py-3 font-bold border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">{children}</th>,
  td: ({ children }: any) => <td className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-300 pointer-events-none last:border-0">{children}</td>,
  blockquote: ({ children }: any) => <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50/50 dark:bg-blue-500/5 text-zinc-700 dark:text-zinc-300 italic rounded-r-xl">{children}</blockquote>,
  h1: ({ children }: any) => <h1 className="font-bold text-xl my-4 text-zinc-900 dark:text-white">{children}</h1>,
  h2: ({ children }: any) => <h2 className="font-bold text-lg my-3 text-zinc-900 dark:text-white">{children}</h2>,
  h3: ({ children }: any) => <h3 className="font-bold text-base my-2 text-zinc-900 dark:text-white">{children}</h3>,
}

export default function LandingPage() {
  const router = useRouter()
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true)
  const [agreed, setAgreed] = React.useState(false)
  const [error, setError] = React.useState(false)
  
  // Interactive Demo State
  const [demoInput, setDemoInput] = React.useState("")
  const [demoMessages, setDemoMessages] = React.useState<{role: string, content: string}[]>([])
  const [demoLoading, setDemoLoading] = React.useState(false)
  const [promptsUsed, setPromptsUsed] = React.useState(0)

  // Auth Check Effect
  React.useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        router.push('/dashboard')
      } else {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router])

  React.useEffect(() => {
    if (isCheckingAuth) return; // Don't run this until we know they are staying on the page
    const used = parseInt(localStorage.getItem('demo_prompts_used') || '0', 10);
    setPromptsUsed(used);
    const savedMsgs = localStorage.getItem('demo_messages');
    if (savedMsgs) setDemoMessages(JSON.parse(savedMsgs));
  }, [isCheckingAuth]);

  const handleSignupClick = (e: React.MouseEvent) => {
    if (!agreed) {
      e.preventDefault()
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim() || demoLoading || promptsUsed >= 3) return;

    const newUsed = promptsUsed + 1;
    setPromptsUsed(newUsed);
    localStorage.setItem('demo_prompts_used', newUsed.toString());

    const userMsg = { role: 'user', content: demoInput };
    const newMsgs = [...demoMessages, userMsg];
    setDemoMessages(newMsgs);
    setDemoInput("");
    setDemoLoading(true);

    try {
      // Use NextJS Server Action to bypass any CORS restrictions on the client side
      const { sendDemoMessage } = await import('@/app/actions/demo');
      let finalContent = await sendDemoMessage(userMsg.content, demoMessages);

      // Strip widget blocks purely for the textual demo
      finalContent = finalContent.replace(/```json\?chameleon[\s\S]*?```/g, "\n\n*✨ Interactive App Widget Generated (Login to view)*");

      const finalMsgs = [...newMsgs, { role: 'assistant', content: finalContent }];
      setDemoMessages(finalMsgs);
      localStorage.setItem('demo_messages', JSON.stringify(finalMsgs));

    } catch (err) {
      const errMsgs = [...newMsgs, { role: 'assistant', content: "Demo API connection failed. But our Neural Study engine is waiting inside!" }];
      setDemoMessages(errMsgs);
      localStorage.setItem('demo_messages', JSON.stringify(errMsgs));
    } finally {
      setDemoLoading(false);
    }
  };

  // Prevent flash of landing page while checking session
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle background ambient light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.16, 1, 0.3, 1] 
          }}
          className="relative z-10 flex flex-col items-center gap-8"
        >
          <div className="relative">
            <motion.div
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute -inset-4 bg-blue-500/10 blur-xl rounded-full"
            />
            <Image 
              src={logo} 
              alt="Inferacore" 
              className="h-16 w-auto dark:invert relative z-10" 
              priority
            />
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="relative w-12 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                className="absolute inset-0 bg-blue-600"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-400 dark:text-zinc-500"
            >
              Initializing Workspace
            </motion.p>
          </div>
        </motion.div>
      </div>
    );
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
          
          {/* Minimalist Background Setting */}
          <div className="absolute inset-0 bg-[#fafafa] dark:bg-[#050505] -z-30" />

          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 relative flex flex-col items-center text-center z-10 w-full">
        

            {/* Fluid Responsive Headline - Unified Blue Gradient */}
            <div className="animate-in fade-in zoom-in slide-in-from-bottom-8 duration-1000">
              <h1 className="font-google-sans text-[3rem] leading-[1.1] sm:text-[4rem] md:text-6xl lg:text-[7.5rem] lg:leading-[1.05] font-extrabold tracking-tighter mb-6 sm:mb-8 max-w-5xl text-zinc-900 dark:text-white px-2">
                Stop guessing.<br className="hidden sm:block" />
                <span className="text-blue-600 dark:text-blue-500"> 
                  Start executing for free.
                </span>
              </h1>
            </div>

            {/* Fluid Subtitle */}
            <p className="text-[16px] sm:text-[18px] lg:text-[22px] text-zinc-500 dark:text-zinc-400 font-medium leading-[1.6] sm:leading-relaxed max-w-2xl mb-10 sm:mb-12 px-4 sm:px-2">
              Transforming Learning, AI Guidance, Redefining Education.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16 sm:mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">
              <button 
                onClick={() => { const el = document.getElementById('demo'); if (el) el.scrollIntoView({ behavior: 'smooth' }) }} 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-google-sans font-bold px-8 sm:px-10 h-14 sm:h-16 rounded-full transition-all text-[16px] sm:text-[17px] active:scale-95 hover:-translate-y-1 outline-none border border-transparent group"
              >
                Access Workspace <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <Link 
                href="/how-it-works" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/80 dark:bg-[#111113]/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-[#18181b] text-zinc-900 dark:text-zinc-100 font-google-sans font-bold px-8 sm:px-10 h-14 sm:h-16 rounded-full transition-all text-[16px] sm:text-[17px] shadow-sm hover:shadow-md active:scale-95 hover:-translate-y-1 outline-none"
              >
                How It Works
              </Link>
            </div>

            {/* Glassmorphic Feature Badges - Strict Blue Theme */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl px-2 mt-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
              {[
                { href: '/features', label: 'Neural Study Buddy' },
                { href: '/features', label: 'General Assistant' }
              ].map((badge) => (
                <Link 
                  href={badge.href}
                  key={badge.label} 
                  className="inline-flex items-center justify-center bg-white dark:bg-[#0c0c0e] border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[12px] sm:text-[14px] font-bold font-google-sans tracking-wide px-5 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all hover:-translate-y-1 group"
                >
                  {badge.label}
                </Link>
              ))}
            </div>

          </div>
        </section>

        {/* =========================================================
            INTERACTIVE DEMO SECTION
        ========================================================= */}
        <section id="demo" className="py-20 sm:py-32 bg-white dark:bg-[#050505] overflow-hidden relative">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="font-google-sans text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-zinc-900 dark:text-white mb-4 sm:mb-6 leading-[1.05]">
                Experience Neural Study
              </h2>
              <p className="text-[16px] sm:text-xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed px-2">
                Test out our inference engine right now. You have {Math.max(0, 3 - promptsUsed)} free prompt{3 - promptsUsed !== 1 ? 's' : ''} remaining.
              </p>
            </div>

            <div className="w-full max-w-5xl mx-auto bg-white/60 dark:bg-[#0c0c0e]/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[600px] text-left">
              <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-[#111113]/80 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Image src="/logo.png" width={100} height={24} alt="Inferacore" className="h-[18px] sm:h-[22px] w-auto dark:invert opacity-95" />
                  <div className="h-5 w-[1px] bg-zinc-300 dark:bg-zinc-700 hidden sm:block"></div>
                  <span className="hidden sm:inline-block text-zinc-500 dark:text-zinc-400 font-google-sans text-xs sm:text-sm font-bold tracking-wide uppercase mt-0.5">Neural Engine Console</span>
                </div>
              </div>
              <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
                {demoMessages.length === 0 && (
                  <div className="m-auto text-center text-zinc-400 font-medium max-w-sm">
                    Ask me to map out a syllabus for Machine Learning or explain Quantum Entanglement!
                  </div>
                )}
                {demoMessages.map((m, i) => (
                  <div key={i} className={`w-fit max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-blue-600 text-white self-end rounded-tr-sm' : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 self-start rounded-tl-sm'}`}>
                    {m.role === 'user' ? (
                      <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={DemoComponents}>{m.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}
                {demoLoading && (
                  <div className="bg-zinc-100 dark:bg-zinc-800 w-fit p-4 rounded-2xl rounded-tl-sm self-start">
                    <Loader2 size={18} className="animate-spin text-zinc-500" />
                  </div>
                )}
              </div>
              <form onSubmit={handleDemoSubmit} className="p-4 bg-white dark:bg-[#0c0c0e] border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
                <input 
                  type="text" 
                  value={demoInput} 
                  onChange={e => setDemoInput(e.target.value)} 
                  placeholder={promptsUsed >= 3 ? "Demo expired. Initialize your Workspace below to continue." : "Enter a complex topic..."} 
                  className="flex-1 bg-zinc-100 dark:bg-zinc-900/50 border border-transparent focus:border-blue-500 rounded-xl px-4 text-[15px] outline-none transition-all placeholder:text-zinc-400 font-medium disabled:opacity-60" 
                  disabled={demoLoading || promptsUsed >= 3} 
                />
                <button 
                  type="submit" 
                  disabled={demoLoading || !demoInput.trim() || promptsUsed >= 3} 
                  className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors shrink-0"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* =========================================================
            SEPARATE CALL TO ACTION SECTION
        ========================================================= */}
        <section id="cta" className="py-16 sm:py-24 lg:py-32 bg-[#fafafa] dark:bg-[#050505] overflow-hidden relative border-t border-zinc-200/50 dark:border-zinc-800/50">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 relative z-10 text-center">
            
            <h2 className="font-google-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-zinc-900 dark:text-white mb-4 sm:mb-6 leading-[1.05]">
              Ready to start?
            </h2>
            <p className="text-[16px] sm:text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 font-medium mb-10 sm:mb-16 max-w-2xl mx-auto leading-relaxed px-2">
              Join the platform and transform the way you learn, plan, and execute.
            </p>
            
            <div className="flex flex-col items-center max-w-lg mx-auto w-full">
              <button onClick={() => setAgreed(!agreed)} className={`flex items-start gap-3 sm:gap-4 w-full text-left p-5 sm:p-8 rounded-3xl sm:rounded-[2rem] border-2 transition-all duration-300 outline-none mb-6 sm:mb-10 bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-xl ${error ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : agreed ? 'border-blue-500 dark:border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.1)]' : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-zinc-700 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]'}`}>
                <div className="mt-1 sm:mt-0.5 text-zinc-900 dark:text-white shrink-0 transition-transform duration-300 hover:scale-110">
                  {agreed ? <CheckSquare size={24} className="sm:w-7 sm:h-7 text-blue-600 dark:text-blue-500" /> : <Square size={24} className="sm:w-7 sm:h-7 text-zinc-300 dark:text-zinc-700" />}
                </div>
                <div>
                  <h4 className={`font-google-sans text-[15px] sm:text-[16px] font-bold mb-1 transition-colors ${agreed ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>Initialize Workspace</h4>
                  <p className="text-[13px] sm:text-[14px] font-medium text-zinc-500 dark:text-zinc-500 leading-relaxed pr-2">I understand how the platform operates and I am ready to accelerate my engineering workflow.</p>
                </div>
              </button>
              
              <Link href="/auth/signup" onClick={handleSignupClick} className={`w-full inline-flex items-center justify-center gap-3 font-google-sans font-bold h-14 sm:h-16 rounded-full text-[16px] sm:text-[17px] transition-all outline-none ${agreed ? 'bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(255,255,255,0.15)] active:scale-95 hover:-translate-y-1' : 'bg-zinc-100 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'}`}>
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