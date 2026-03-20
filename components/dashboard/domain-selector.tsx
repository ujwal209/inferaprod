'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronsUpDown, Search, Briefcase } from 'lucide-react'

const ENGINEERING_DOMAINS = [
  "Software Engineering",
  "Computer Science",
  "Artificial Intelligence",
  "Data Science",
  "Machine Learning",
  "Electronics and Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Aerospace Engineering",
  "Information Technology",
  "Cyber Security",
  "Robotics and Automation",
  "Biotechnology",
  "Chemical Engineering"
]

export function DomainSelector({ currentDomain }: { currentDomain: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const filteredDomains = ENGINEERING_DOMAINS.filter(domain =>
    domain.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (domain: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('domain', domain)
    router.push(`/dashboard?${params.toString()}`)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="relative w-full">
      {/* TRIGGER BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-[#111113] border border-zinc-200/80 dark:border-zinc-800/80 rounded-[1.25rem] hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500/10"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Briefcase size={16} strokeWidth={2} />
          </div>
          <div className="flex flex-col items-start truncate">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-0.5 tracking-wide">
              Engineering Branch
            </span>
            <span className="text-[14px] sm:text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {currentDomain}
            </span>
          </div>
        </div>
        <ChevronsUpDown size={16} className="text-zinc-400 shrink-0 ml-2" />
      </button>

      {/* DROPDOWN MENU */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 w-full sm:min-w-[320px] bg-white dark:bg-[#111113] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* SEARCH INPUT */}
          <div className="flex items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30">
            <Search size={16} className="text-zinc-400 mr-3 shrink-0" />
            <input 
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find your domain..."
              className="w-full bg-transparent outline-none text-[14px] font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* LIST */}
          <div className="max-h-[280px] overflow-y-auto p-1.5 custom-scrollbar">
            {filteredDomains.length === 0 ? (
              <p className="p-6 text-center text-[13px] font-medium text-zinc-500">No domains found.</p>
            ) : (
              filteredDomains.map((domain) => (
                <button
                  key={domain}
                  onClick={() => handleSelect(domain)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-[14px] font-medium rounded-xl transition-all duration-200 ${
                    currentDomain === domain 
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' 
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <span className="truncate">{domain}</span>
                  {currentDomain === domain && <Check size={16} strokeWidth={2.5} className="shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* BACKDROP TO CLOSE */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  )
}