'use client'

import * as React from 'react'
import { getEngineeringIntel } from '@/app/actions/intel'
import { Activity, ExternalLink, Loader2, ShieldAlert, Zap, Radio } from 'lucide-react'

interface IntelFeedProps {
  targetDomain: string
  coreInterests: string[]
}

export function IntelFeed({ targetDomain, coreInterests }: IntelFeedProps) {
  const [news, setNews] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchNews() {
      setLoading(true)
      const res = await getEngineeringIntel(targetDomain, coreInterests)
      if (res.success) {
        setNews(res.results)
      } else {
        setError(res.error || 'Connection to intelligence node failed.')
      }
      setLoading(false)
    }

    fetchNews()
  }, [targetDomain, coreInterests])

  return (
    <div className="bg-white dark:bg-[#09090b] border-2 border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col h-full min-h-[500px]">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 dark:bg-blue-500/5 rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/5 rounded-full blur-[60px] pointer-events-none -ml-10 -mb-10" />
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 relative z-10">
        <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 dark:bg-white rounded-lg mb-3 shadow-lg">
                <Radio size={14} className="text-blue-500 animate-pulse" strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white dark:text-zinc-900">Live Intel</span>
            </div>
            <h4 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tighter flex items-center gap-2">
                Market Signals
            </h4>
            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mt-1">
                Domain: <span className="text-blue-600 dark:text-blue-400">{targetDomain || 'Global Engineering'}</span>
            </p>
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 self-start sm:self-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-300">Sync Active</span>
        </div>
      </div>

      {/* Scrollable Intelligence Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5 relative z-10">
        {loading ? (
            <div className="h-64 flex flex-col items-center justify-center">
                <div className="relative">
                    <Loader2 className="animate-spin text-blue-600 dark:text-blue-500 mb-4" size={40} strokeWidth={2.5} />
                    <Zap size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-900 dark:text-white" />
                </div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-[0.3em] animate-pulse">Establishing Uplink</span>
            </div>
        ) : error ? (
            <div className="h-64 flex flex-col items-center justify-center text-red-500 bg-red-50 dark:bg-red-500/5 rounded-3xl border border-red-200 dark:border-red-500/10 p-8 text-center">
                <ShieldAlert size={40} strokeWidth={2} className="mb-4 opacity-80" />
                <span className="text-sm font-bold uppercase tracking-widest mb-2">Signal Interrupted</span>
                <p className="text-xs font-medium opacity-70 leading-relaxed max-w-[200px]">{error}</p>
            </div>
        ) : news.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
                <Activity size={40} strokeWidth={1.5} className="mb-4 opacity-20" />
                <span className="text-xs font-bold uppercase tracking-widest">No Signals Detected</span>
            </div>
        ) : (
            news.map((item, idx) => (
                <a 
                    key={idx} 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group block bg-white dark:bg-[#0f0f11] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 p-6 rounded-[1.75rem] transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-xl"
                >
                    {/* Hover side-bar indicator */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 dark:bg-blue-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                    
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                                    <ExternalLink size={12} className="text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                </div>
                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.15em]">
                                    {new URL(item.url).hostname.replace('www.', '')}
                                </span>
                            </div>
                            
                            <h5 className="text-[16px] font-bold text-zinc-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight line-clamp-2">
                                {item.title}
                            </h5>
                        </div>
                    </div>
                    
                    {/* Subtle bottom arrow that appears on hover */}
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                        View Report <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </a>
            ))
        )}
      </div>

      {/* Footer Branding */}
      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 relative z-10 flex items-center justify-between">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
            Neural Signal Processor v4.0
          </p>
          <div className="flex gap-1">
             {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-blue-500/40" />)}
          </div>
      </div>
    </div>
  )
}

// Helper icon
function ChevronRight({ size, className }: { size: number, className?: string }) {
    return (
        <svg 
            width={size} height={size} viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
            className={className}
        >
            <path d="m9 18 6-6-6-6"/>
        </svg>
    )
}