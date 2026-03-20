'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-white dark:bg-[#050505] py-12 sm:py-16 border-t border-zinc-200/50 dark:border-zinc-800/50 font-outfit">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-col md:flex-row justify-between gap-10">
        <div className="flex flex-col gap-4">
          <Image src="/logo.png" alt="InfraCore" width={120} height={30} className="dark:invert opacity-90" />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-xs">
            Intelligent systems engineered for clarity, execution, and deep understanding.
          </p>
          <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-600 mt-2">
            © {new Date().getFullYear()} Infera Core. All rights reserved.
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-10 sm:gap-16">
          <div className="flex flex-col gap-3">
            <h4 className="font-google-sans text-[13px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-1">Company</h4>
            <Link href="/about" className="text-sm font-medium text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Us</Link>
            <Link href="/features" className="text-sm font-medium text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Platform Features</Link>
            <Link href="/how-it-works" className="text-sm font-medium text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Architecture</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-google-sans text-[13px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-1">Contact</h4>
            <a href="mailto:infercore.tech@gmail.com" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Mail size={16} /> infercore.tech@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}