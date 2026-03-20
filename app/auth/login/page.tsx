'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  ArrowRight, AlertCircle, Loader2, 
  Eye, EyeOff, ShieldCheck, Network, Zap, Fingerprint, Sun, Moon
} from "lucide-react"
import { loginAction, loginWithGoogleAction } from '@/app/actions/auth/login'

// --- THEME TOGGLE COMPONENT FOR AUTH PAGES ---
function AuthThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-10 h-10" />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 flex items-center justify-center"
      aria-label="Toggle Dark Mode"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Standard Email/Password Submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await loginAction(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  // Google OAuth Submission
  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    
    const result = await loginWithGoogleAction()
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-[#0a0a0a] font-sans selection:bg-blue-500/30 selection:text-blue-900 dark:selection:text-blue-100 flex flex-col lg:flex-row transition-colors duration-300">
      
      {/* ================= LEFT PANEL (DESKTOP FIXED) ================= */}
      <div className="hidden lg:flex w-[45%] fixed inset-y-0 left-0 bg-zinc-950 flex-col justify-center p-12 xl:p-16 overflow-hidden z-10 border-r border-zinc-800">
        
        {/* Background Visuals */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -mt-20 -ml-20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Pinned Top Logo */}
        <div className="absolute top-10 left-10 xl:left-12 z-20">
          <Link href="/" className="inline-flex items-center group hover:opacity-80 transition-opacity">
            <div className="relative w-40 h-12 origin-left">
              <Image 
                src="/logo.png" 
                alt="InferaCore Logo" 
                fill 
                className="object-contain object-left dark:invert invert" // Inverted twice on dark to ensure it stays white on the dark panel
                priority 
              />
            </div>
          </Link>
        </div>

        {/* Centered Pitch */}
        <div className="relative z-10 w-full max-w-md mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md shadow-sm">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Platform Active</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight uppercase leading-[1.1] mb-6">
            Access Your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">Workspace</span>
          </h1>
          
          <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-10">
            Access your personalized engineering roadmap, track live market trends, and build your skills across technical domains.
          </p>
          
          <div className="space-y-4">
             <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-700 group-hover:border-blue-500/50 transition-colors">
                  <Network className="text-blue-400" size={16} />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">Live Market Insights</h4>
                  <p className="text-xs text-zinc-400 font-medium">Real-time job market trends across engineering disciplines.</p>
                </div>
             </div>

             <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-700 group-hover:border-blue-500/50 transition-colors">
                  <Zap className="text-blue-400" size={16} />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">Smart Career Roadmaps</h4>
                  <p className="text-xs text-zinc-400 font-medium">Personalized paths to identify and learn missing skills.</p>
                </div>
             </div>
          </div>
        </div>

        {/* Pinned Bottom Footer */}
        <div className="absolute bottom-10 left-10 xl:left-12 right-10 xl:right-12 z-10 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-t border-zinc-800 pt-6">
           <span>© 2026 INFERACORE</span>
           <span className="flex items-center gap-2">
             <Fingerprint size={12} className="text-blue-500"/> Connection Secure
           </span>
        </div>
      </div>

      {/* ================= RIGHT PANEL (SCROLLABLE CANVAS) ================= */}
      <div className="w-full lg:w-[55%] lg:ml-[45%] flex flex-col min-h-screen relative bg-zinc-50 dark:bg-[#0a0a0a]">
        
        {/* Desktop Absolute Theme Toggle */}
        <div className="hidden lg:block absolute top-10 right-10 z-50">
          <AuthThemeToggle />
        </div>

        {/* MOBILE HEADER (Only visible on small screens) */}
        <div className="lg:hidden h-20 flex-shrink-0 flex items-center justify-between px-6 bg-white dark:bg-[#0a0a0a] border-b border-zinc-200 dark:border-zinc-800 z-30 sticky top-0 shadow-sm">
          <Link href="/" className="inline-flex items-center group">
            <div className="relative w-32 h-10 origin-left">
              <Image 
                src="/logo.png" 
                alt="InferaCore Logo" 
                fill 
                className="object-contain object-left dark:invert" 
                priority 
              />
            </div>
          </Link>
          <AuthThemeToggle />
        </div>

        {/* FORM CONTAINER */}
        <main className="flex-1 flex flex-col px-4 py-12 sm:px-8 lg:px-12">
          <div className="w-full max-w-[460px] mx-auto my-auto relative animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* The Form Card */}
            <div className="bg-white dark:bg-[#111113] rounded-[2rem] shadow-sm border-2 border-zinc-200 dark:border-zinc-800/80 p-8 sm:p-12 relative z-10 w-full">
              
              <div className="mb-8 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3 uppercase">
                  Welcome Back
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">
                  Enter your credentials to securely access your account.
                </p>
              </div>

              {/* Inline Error Block */}
              {error && (
                <div className="mb-8 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 animate-in fade-in zoom-in-95">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="text-xs font-semibold leading-relaxed">{error}</p>
                </div>
              )}

              {/* Google Social Login */}
              <div className="mb-6">
                <Button 
                  type="button" 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  variant="outline" 
                  className="w-full h-14 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm flex items-center justify-center bg-white dark:bg-zinc-900"
                >
                  {loading ? <Loader2 className="animate-spin text-zinc-400" size={20} /> : (
                    <>
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <span className="bg-white dark:bg-[#111113] px-4">Or sign in with email</span>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">Email Address</label>
                  <Input 
                    name="email" 
                    type="email" 
                    required 
                    className="h-14 px-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 font-bold text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-500 focus-visible:border-transparent transition-all shadow-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 placeholder:font-medium" 
                    placeholder="user@inferacore.com" 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1 pr-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Secure Password</label>
                    <Link href="/auth/forgot-password" className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors uppercase tracking-wider">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input 
                      name="password" 
                      type={showPassword ? "text" : "password"} 
                      required 
                      className="h-14 pl-5 pr-14 rounded-2xl font-bold bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-500 focus-visible:border-transparent transition-all shadow-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 placeholder:font-medium" 
                      placeholder="••••••••" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-blue-600 text-white hover:bg-blue-500 font-bold h-14 rounded-2xl uppercase mt-8 transition-all active:scale-[0.98] shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 tracking-widest text-[13px] border border-transparent"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>Sign In <ArrowRight size={18} strokeWidth={2.5} /></>
                  )}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-center flex-wrap gap-2">
                  Don't have an account? 
                  <Link href="/auth/signup" className="text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors border-b-2 border-transparent hover:border-blue-600 pb-0.5">
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>

            {/* Global Security Badge */}
            <div className="mt-8 flex items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500 shrink-0">
               <ShieldCheck size={16} className="text-blue-500" />
               <span className="text-[10px] font-bold uppercase tracking-wider">256-bit Encrypted Connection</span>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  )
}