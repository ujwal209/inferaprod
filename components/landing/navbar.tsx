'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@/utils/supabase/client'
// Adjust this import path to wherever your getSessionUser function actually lives
import { getSessionUser } from '@/app/auth/get-user' 
import { Sun, Moon, Menu, X, LayoutDashboard, LogOut, Sparkles } from "lucide-react"

// STRICT ROUTING ORDER: Features -> About -> Launch
const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'About', href: '/about' },
  { label: 'Launch', href: '/launch' }
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all flex items-center justify-center outline-none"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const [user, setUser] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const pathname = usePathname()
  const router = useRouter()

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const sessionUser = await getSessionUser()
        setUser(sessionUser)
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  // Prevent scroll when mobile menu is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  return (
    <header 
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 font-outfit border-b ${
        scrolled 
          ? 'bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-zinc-200/80 dark:border-zinc-800/80 py-3 shadow-sm' 
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="relative z-50 flex items-center gap-2 outline-none group">
          <Image 
            src="/logo.png" 
            alt="InfraCore" 
            width={120} 
            height={28} 
            className="h-6 sm:h-7 w-auto dark:invert group-hover:opacity-80 transition-opacity" 
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => (
            <Link 
              key={link.label} 
              href={link.href}
              className={`text-[14px] font-bold font-google-sans tracking-wide transition-colors outline-none flex items-center gap-1.5 ${
                pathname === link.href 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : link.label === 'Launch' 
                    ? 'text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {link.label === 'Launch' && <Sparkles size={14} className="animate-pulse" />}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4 relative z-50">
          <ThemeToggle />
          
          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
          
          {!isLoading && (
            user ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2 text-[14px] font-bold font-google-sans text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                  aria-label="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/auth/login" 
                  className="text-[14px] font-bold font-google-sans text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors outline-none px-2"
                >
                  Log in
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold font-google-sans px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-sm outline-none"
                >
                  Sign Up
                </Link>
              </div>
            )
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden relative z-50">
          <ThemeToggle />
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 -mr-2 text-zinc-900 dark:text-white outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-[#050505] flex flex-col pt-24 pb-safe px-6 md:hidden overflow-y-auto">
          <div className="flex flex-col gap-6 mt-8">
            {NAV_LINKS.map((item, i) => (
              <Link 
                key={item.label} 
                href={item.href} 
                onClick={() => setIsOpen(false)} 
                className={`text-4xl font-google-sans font-extrabold tracking-tight animate-in slide-in-from-bottom-4 fade-in transition-colors flex items-center gap-3 ${
                  item.label === 'Launch' ? 'text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400' : 'text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
              >
                {item.label}
                {item.label === 'Launch' && <Sparkles size={28} className="animate-pulse" />}
              </Link>
            ))}
          </div>

          <div className="mt-auto pt-8 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-col gap-4 pb-8">
            {!isLoading && (
              user ? (
                <>
                  <Link 
                    href="/dashboard" 
                    onClick={() => setIsOpen(false)} 
                    className="w-full py-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-google-sans font-bold text-[16px] transition-all shadow-sm"
                  >
                    <LayoutDashboard size={18} />
                    Go to Dashboard
                  </Link>
                  <button 
                    onClick={() => { handleLogout(); setIsOpen(false); }}
                    className="w-full py-4 flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-full font-google-sans font-bold text-[16px] transition-all"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/auth/login" 
                    onClick={() => setIsOpen(false)} 
                    className="w-full py-4 text-center border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-full font-google-sans font-bold text-[16px] text-zinc-900 dark:text-white transition-all shadow-sm"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    onClick={() => setIsOpen(false)} 
                    className="w-full py-4 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-full font-google-sans font-bold text-[16px] transition-all shadow-sm shadow-blue-600/20"
                  >
                    Create Account
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      )}
    </header>
  )
}