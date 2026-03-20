'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Cpu, AlertCircle, Loader2, ShieldCheck, KeyRound, Eye, EyeOff, Lock, ArrowLeft, Sun, Moon } from "lucide-react"
import { initiateRecovery, verifyRecoveryOtp, updatePassword } from '@/app/actions/auth/forgot-password'

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

export default function ForgotPasswordPage() {
  const router = useRouter()
  
  // State: 'email' -> 'otp' -> 'password'
  const [step, setStep] = React.useState<'email' | 'otp' | 'password'>('email')
  const [emailCache, setEmailCache] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // Input states
  const [otp, setOtp] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  // STEP 1: Request Email
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const email = new FormData(e.currentTarget).get('email') as string
    
    const result = await initiateRecovery(new FormData(e.currentTarget))
    if (result.error) setError(result.error)
    else { setEmailCache(email); setStep('otp') }
    setLoading(false)
  }

  // STEP 2: Verify OTP
  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true); setError(null)
    
    const result = await verifyRecoveryOtp(emailCache, otp)
    if (result.error) setError(result.error)
    else setStep('password')
    setLoading(false)
  }

  // STEP 3: Update Password
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true); setError(null)
    
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError("Security breach: Keys do not match."); setLoading(false); return
    }

    const result = await updatePassword(password)
    if (result.error) setError(result.error)
    else router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-blue-500/30 selection:text-blue-900 dark:selection:text-blue-100 flex flex-col lg:flex-row transition-colors duration-300">
      
      {/* ================= LEFT PANEL (DESKTOP FIXED) ================= */}
      <div className="hidden lg:flex w-[45%] fixed inset-y-0 left-0 bg-zinc-950 flex-col justify-center p-12 xl:p-16 overflow-hidden z-10 border-r border-zinc-800">
        
        {/* Background Visuals */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -mt-20 -ml-20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Pinned Top Logo */}
        <div className="absolute top-10 left-10 xl:left-12 z-20">
          <Link href="/" className="inline-flex items-center gap-3 group hover:opacity-80 transition-opacity">
            <div className="bg-blue-500/10 p-2.5 rounded-xl group-hover:rotate-12 transition-transform duration-500 shadow-sm border border-blue-500/20">
              <Cpu size={20} className="text-blue-400" />
            </div>
            <span className="font-bold tracking-tight uppercase text-2xl italic text-white">
              INFRA<span className="text-blue-500">CORE</span>
            </span>
          </Link>
        </div>

        {/* Centered Pitch */}
        <div className="relative z-10 w-full max-w-md mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md shadow-sm">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Security Override</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight uppercase leading-[1.1] mb-6">
            System <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">Recovery</span>
          </h1>
          
          <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-10">
            Initiate a secure protocol to recover your neural link. Verify your designation to recalibrate your cryptographic keys.
          </p>
          
          <div className="space-y-4">
             <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-700 group-hover:border-blue-500/50 transition-colors">
                  <KeyRound className="text-blue-400" size={16} />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">Identity Verification</h4>
                  <p className="text-xs text-zinc-400 font-medium">Confirm email designation.</p>
                </div>
             </div>

             <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-700 group-hover:border-blue-500/50 transition-colors">
                  <ShieldCheck className="text-blue-400" size={16} />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">Secure Token Exchange</h4>
                  <p className="text-xs text-zinc-400 font-medium">8-digit cryptographic verification.</p>
                </div>
             </div>

             <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-700 group-hover:border-blue-500/50 transition-colors">
                  <Lock className="text-blue-400" size={16} />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-1">AES-256 Recalibration</h4>
                  <p className="text-xs text-zinc-400 font-medium">Establish a new secure access key.</p>
                </div>
             </div>
          </div>
        </div>

        {/* Pinned Bottom Footer */}
        <div className="absolute bottom-10 left-10 xl:left-12 right-10 xl:right-12 z-10 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-t border-zinc-800 pt-6">
           <span>© 2026 Infracore System</span>
           <span>v1.0.4 Live</span>
        </div>
      </div>

      {/* ================= RIGHT PANEL (SCROLLABLE CANVAS) ================= */}
      <div className="w-full lg:w-[55%] lg:ml-[45%] flex flex-col min-h-screen relative bg-zinc-50 dark:bg-zinc-950">
        
        {/* Desktop Absolute Back Button & Theme Toggle */}
        <div className="hidden lg:flex items-center gap-4 absolute top-10 right-10 z-50">
          <Link href="/auth/login" className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
             <ArrowLeft size={14} /> Abort Request
          </Link>
          <AuthThemeToggle />
        </div>

        {/* MOBILE HEADER (Only visible on small screens) */}
        <div className="lg:hidden h-20 flex-shrink-0 flex items-center justify-between px-6 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 z-30 sticky top-0 shadow-sm">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="bg-blue-50 dark:bg-blue-500/10 p-2 rounded-xl shadow-sm border border-blue-100 dark:border-blue-500/20">
              <Cpu size={18} className="text-blue-600 dark:text-blue-500" />
            </div>
            <span className="font-bold tracking-tight uppercase text-xl italic text-zinc-900 dark:text-white">
              INFRA<span className="text-blue-600 dark:text-blue-500">CORE</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
             <Link href="/auth/login" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <ArrowLeft size={20} />
             </Link>
             <AuthThemeToggle />
          </div>
        </div>

        {/* FORM CONTAINER */}
        <main className="flex-1 flex flex-col px-4 py-12 sm:px-8 lg:px-12">
          <div className="w-full max-w-[460px] mx-auto my-auto relative animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* The SaaS Form Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 sm:p-12 relative z-10 w-full">
              
              <div className="mb-10 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3 uppercase">
                  {step === 'email' ? 'Identify Node' : step === 'otp' ? 'Verify Code' : 'New Key Entry'}
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">
                  {step === 'email' && 'Enter your email to receive recovery instructions.'}
                  {step === 'otp' && `Enter the 8-digit code sent to ${emailCache}`}
                  {step === 'password' && 'Input your new access code below.'}
                </p>
              </div>

              {/* Inline Error Block */}
              {error && (
                <div className="mb-8 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 animate-in fade-in zoom-in-95">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="text-xs font-semibold leading-relaxed">{error}</p>
                </div>
              )}

              {step === 'email' && (
                <form className="space-y-6 animate-in slide-in-from-right-4 duration-500" onSubmit={handleEmailSubmit}>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">Email Address</label>
                    <Input 
                      name="email" 
                      type="email" 
                      required 
                      className="h-14 px-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 font-medium text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-500 focus-visible:border-transparent transition-all shadow-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 placeholder:font-normal" 
                      placeholder="engineer@infracore.io" 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-blue-600 text-white hover:bg-blue-500 font-semibold h-14 rounded-2xl uppercase mt-8 transition-all active:scale-[0.98] shadow-sm tracking-wider text-xs border border-transparent"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Request Override"}
                  </Button>
                </form>
              )}

              {step === 'otp' && (
                <form className="space-y-6 animate-in slide-in-from-right-4 duration-500" onSubmit={handleOtpSubmit}>
                  <div className="space-y-4 text-center">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Authorization Code</label>
                    <Input 
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value)} 
                      maxLength={8} 
                      required 
                      className="h-24 text-center text-3xl sm:text-4xl font-mono font-bold tracking-[0.4em] pl-[0.4em] rounded-3xl bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 focus-visible:ring-0 focus-visible:border-blue-600 dark:focus-visible:border-blue-500 transition-all uppercase shadow-inner text-zinc-900 dark:text-white" 
                      placeholder="--------" 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading || otp.length < 8} 
                    className="w-full bg-blue-600 text-white hover:bg-blue-500 font-semibold h-14 rounded-2xl uppercase mt-8 transition-all active:scale-[0.98] shadow-sm tracking-wider text-xs border border-transparent"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Verify Code"}
                  </Button>
                </form>
              )}

              {step === 'password' && (
                <form className="space-y-6 animate-in slide-in-from-right-4 duration-500" onSubmit={handlePasswordSubmit}>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">New Password</label>
                    <div className="relative">
                      <Input 
                        name="password" 
                        type={showPassword ? "text" : "password"} 
                        required 
                        className="h-14 pl-5 pr-14 rounded-2xl font-medium bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-500 focus-visible:border-transparent transition-all shadow-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 placeholder:font-normal" 
                        placeholder="••••••••" 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors p-1">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ml-1">Confirm New Password</label>
                    <div className="relative">
                      <Input 
                        name="confirmPassword" 
                        type={showConfirmPassword ? "text" : "password"} 
                        required 
                        className="h-14 pl-5 pr-14 rounded-2xl font-medium bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-500 focus-visible:border-transparent transition-all shadow-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 placeholder:font-normal" 
                        placeholder="••••••••" 
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors p-1">
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-blue-600 text-white hover:bg-blue-500 font-semibold h-14 rounded-2xl uppercase mt-8 transition-all active:scale-[0.98] shadow-sm tracking-wider text-xs border border-transparent"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Recalibrate Keys"}
                  </Button>
                </form>
              )}
            </div>

            {/* Global Security Badge perfectly spaced below card */}
            <div className="mt-8 flex items-center justify-center gap-2 text-zinc-400 dark:text-zinc-500 shrink-0">
               <ShieldCheck size={16} className="text-blue-500" />
               <span className="text-[10px] font-semibold uppercase tracking-wider">End-to-End Encryption Active</span>
            </div>
            
          </div>
        </main>
      </div>

    </div>
  )
}