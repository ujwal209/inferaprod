'use client'

import * as React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Activity, Search, Loader2 } from 'lucide-react'

export function NewsFilter({ currentDomain }: { currentDomain: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = React.useTransition()

  const updateFilter = (newDomain: string) => {
    const params = new URLSearchParams(searchParams)
    if (newDomain) {
      params.set('domain', newDomain)
    } else {
      params.delete('domain')
    }
    
    // Wrap in transition to keep UI responsive while server fetches new data
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('domain') as HTMLInputElement
    updateFilter(input.value)
  }

  const quickFilters = ['Software', 'AI/ML', 'DevOps', 'Data', 'Cybersecurity']

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="p-2.5 bg-yellow-400 rounded-xl shadow-inner shrink-0 relative">
          {/* Show spinner when fetching new data */}
          {isPending ? (
            <Loader2 size={20} className="text-slate-900 animate-spin" />
          ) : (
            <Activity size={20} className="text-slate-900" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-black uppercase text-slate-900 tracking-widest leading-none mb-1.5 truncate">
            Live Architecture Feed
          </h2>
          <p className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
            Monitoring: {currentDomain}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
           {quickFilters.map(filter => (
             <button
                key={filter}
                disabled={isPending}
                onClick={() => updateFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentDomain.toLowerCase() === filter.toLowerCase()
                  ? 'bg-slate-900 text-yellow-400 border-slate-900'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-white hover:text-slate-900'
                }`}
             >
               {filter}
             </button>
           ))}
        </div>
        <form onSubmit={handleSearch} className="relative w-full sm:w-48 group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          <input 
            name="domain"
            defaultValue={currentDomain}
            disabled={isPending}
            placeholder="Search domains..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-sm placeholder:text-slate-400 disabled:bg-slate-50"
          />
        </form>
      </div>
    </div>
  )
}