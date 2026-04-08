'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, X, Cpu } from 'lucide-react'

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false)

  const navLinks = [
    { label: 'Platform', to: '#platform' },
    { label: 'News Feed', to: '/news-feed' },
    { label: 'Domains', to: '#domains' },
  ]

  // Automatically close mobile menu if window is resized to desktop width
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent scrolling when mobile menu is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  return (
    <nav className="fixed top-0 inset-x-0 z-[100] bg-white/80 dark:bg-[#050505]/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800 font-inter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* LOGO */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
              <div className="bg-zinc-900 dark:bg-white p-1.5 rounded-lg flex items-center justify-center shadow-sm">
                <Cpu size={18} className="text-white dark:text-zinc-900" />
              </div>
              <span className="font-semibold text-lg text-zinc-900 dark:text-white tracking-tight">
                Inferacore
              </span>
            </Link>
          </div>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.to}
                  className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md px-1"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            {/* AUTH ACTIONS */}
            <div className="flex items-center gap-3 pl-6 border-l border-zinc-200 dark:border-zinc-800">
              <Link 
                href="/auth/login" 
                className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
              >
                Log in
              </Link>
              <Link 
                href="/auth/signup"
                className="text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 px-4 py-2 rounded-lg transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Sign up
              </Link>
            </div>
          </div>

          {/* MOBILE TOGGLE BUTTON */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 -mr-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Toggle mobile menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full h-[calc(100vh-64px)] bg-white dark:bg-[#050505] overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="px-4 py-6 flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.to}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3.5 text-base font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-colors"
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile Auth Actions */}
            <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-3 px-2">
              <Link 
                href="/auth/login" 
                onClick={() => setIsOpen(false)}
                className="flex justify-center w-full text-base font-medium text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-4 py-3 rounded-xl transition-colors"
              >
                Log in
              </Link>
              <Link 
                href="/auth/signup" 
                onClick={() => setIsOpen(false)}
                className="flex justify-center w-full text-base font-medium text-white dark:text-zinc-900 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 px-4 py-3 rounded-xl transition-colors shadow-sm"
              >
                Sign up free
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}