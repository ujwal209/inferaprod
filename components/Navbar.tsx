'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, X, Cpu, LogIn, UserPlus } from 'lucide-react'
import { Button } from './ui/button'

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false)

  const navLinks = [
    { label: 'Platform', to: '#platform' },
    { label: 'News Feed', to: '#news' },
    { label: 'Domains', to: '#domains' },
  ]

  return (
    <nav className="fixed top-0 w-full z-[100] border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* LOGO: InfraCore Identity */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-yellow-400 p-1 group-hover:rotate-90 transition-transform duration-300 rounded-sm">
            <Cpu size={20} className="text-black" />
          </div>
          <span className="font-black tracking-tighter uppercase text-xl italic text-slate-900">
            INFRA<span className="text-yellow-500">CORE</span>
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.to}
              className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 hover:text-yellow-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          
          {/* AUTH ACTIONS */}
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200 ml-4">
            <Link 
              href="auth/login" 
              className="text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-black flex items-center gap-1 transition-colors"
            >
              <LogIn size={14} /> Login
            </Link>
            <Link href="auth/signup">
              <Button size="sm" className="bg-black text-white hover:bg-yellow-400 hover:text-black font-bold rounded-none text-[10px] h-8 flex items-center gap-1 transition-all">
                <UserPlus size={14} /> SIGN_UP
              </Button>
            </Link>
          </div>
        </div>

        {/* MOBILE TOGGLE */}
        <button className="md:hidden text-slate-900 p-2 rounded-lg hover:bg-slate-50" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE MENU: Drawer logic */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-8 flex flex-col gap-6 animate-in slide-in-from-top duration-300 shadow-xl">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.to}
              onClick={() => setIsOpen(false)}
              className="text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-yellow-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 pt-6 border-t border-slate-100">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full rounded-none border-slate-300 font-bold uppercase text-xs">Login</Button>
            </Link>
            <Link href="/signup" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-yellow-400 text-black hover:bg-yellow-500 rounded-none font-bold uppercase text-xs">Sign Up Free</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}