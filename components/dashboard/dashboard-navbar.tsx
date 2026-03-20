'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { logoutAction } from '@/app/actions/auth/logout'
import { 
  User, Bell, Menu, X, Home, 
  Newspaper, MessageSquare, LogOut,
  Sun, Moon, Star
} from 'lucide-react'

interface DashboardNavbarProps {
  userEmail?: string
  avatarUrl?: string | null
}

const NAV_LINKS = [
  { name: 'Home', path: '/dashboard', icon: Home },
  { name: 'News Feed', path: '/news', icon: Newspaper },
  { name: 'Vishwa AI', path: '/dashboard/chat', icon: MessageSquare },
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Reviews', path: '/review', icon: Star },
]

// --- THEME TOGGLE COMPONENT ---
function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => setMounted(true), [])
  
  if (!mounted) return <div className="w-9 h-9" />
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#111113] rounded-xl transition-all duration-200 flex items-center justify-center outline-none"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

export function DashboardNavbar({ userEmail, avatarUrl }: DashboardNavbarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  React.useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  React.useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileOpen])

  return (
    <>
      {/* --- FONT INJECTION --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .font-google-sans { font-family: 'Google Sans', sans-serif !important; }
      `}} />

      {/* --- TOP NAVBAR --- */}
      <header className="h-[64px] sm:h-[72px] flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-2xl border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0 z-40 transition-colors duration-300 sticky top-0 font-outfit">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#111113] rounded-xl transition-all outline-none"
          >
            <Menu size={22} />
          </button>

          <Link href="/" className="transition-transform hover:scale-[1.02] outline-none">
            <Image
              src="/logo.png"
              alt="InfraCore"
              width={140}
              height={36}
              className="h-6 sm:h-7 w-auto object-contain dark:invert opacity-95"
              priority
            />
          </Link>
        </div>

        {/* --- DESKTOP NAVIGATION --- */}
        <nav className="hidden md:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((item) => {
            const isActive = item.path === '/dashboard' 
              ? pathname === item.path 
              : pathname.startsWith(item.path)

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`group flex items-center gap-2 px-4 py-2 rounded-full font-google-sans text-[13px] font-bold transition-all duration-300 outline-none border ${
                  isActive 
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm' 
                    : 'bg-transparent border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#111113] hover:border-zinc-200 dark:hover:border-zinc-800'
                }`}
              >
                <item.icon 
                  size={15} 
                  className={isActive ? 'text-white dark:text-zinc-900' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors'} 
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* --- RIGHT SIDE ACTIONS --- */}
        <div className="flex items-center gap-1 sm:gap-3">
          <ThemeToggle />

          <button className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#111113] rounded-xl transition-all duration-200 outline-none">
            <Bell size={18} />
          </button>

          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1.5" />

          {/* User Profile Area */}
          <Link href="/profile" className="flex items-center gap-3 pl-1 group outline-none cursor-pointer">
            <div className="hidden sm:flex flex-col items-end min-w-0">
              <span className="font-google-sans text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {userEmail?.split('@')[0] || 'Operator'}
              </span>
              <span className="font-outfit text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-500">
                Active Session
              </span>
            </div>

            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700/80 shrink-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:ring-2 group-hover:ring-blue-500/30 transition-all duration-300 shadow-sm">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={16} className="text-zinc-400" />
              )}
            </div>
          </Link>
        </div>
      </header>

      {/* --- MOBILE SIDEBAR OVERLAY --- */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-zinc-900/20 dark:bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      {/* --- MOBILE SIDEBAR DRAWER --- */}
      <div className={`
        md:hidden fixed inset-y-0 left-0 z-50 w-[280px] sm:w-[320px] bg-[#fafafa] dark:bg-[#0c0c0e] flex flex-col border-r border-zinc-200 dark:border-zinc-800/80 shadow-[20px_0_40px_rgba(0,0,0,0.05)] dark:shadow-[20px_0_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-in-out font-outfit
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Drawer Header */}
        <div className="h-[64px] sm:h-[72px] flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800/80 shrink-0 bg-white dark:bg-[#050505]">
          <Image
            src="/logo.png"
            alt="InfraCore"
            width={110}
            height={28}
            className="h-6 w-auto object-contain dark:invert opacity-95"
          />
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="p-2 -mr-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#111113] rounded-xl transition-all outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Navigation */}
        <nav className="flex-1 px-4 py-8 overflow-y-auto space-y-2 custom-scrollbar">
          <p className="font-google-sans px-4 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 mb-4 uppercase tracking-[0.15em]">
            Platform Menu
          </p>
          
          {NAV_LINKS.map((item) => {
            const isActive = item.path === '/dashboard' 
              ? pathname === item.path 
              : pathname.startsWith(item.path)

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-google-sans text-[15px] font-bold transition-all duration-200 outline-none ${
                  isActive 
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#111113] hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-white dark:text-zinc-900' : 'text-zinc-400'} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Drawer Footer (Sign Out) */}
        <div className="p-5 mt-auto border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#050505]">
          <form action={logoutAction}>
            <button 
              type="submit" 
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-google-sans text-[14px] font-bold text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all duration-200 outline-none group"
            >
              <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Secure Sign Out
            </button>
          </form>
        </div>
      </div>
    </>
  )
}