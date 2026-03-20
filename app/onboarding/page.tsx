'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { CldUploadWidget } from 'next-cloudinary'
import { completeOnboardingAction } from '@/app/actions/onboarding'
import { 
  Cpu, ArrowRight, Loader2, UploadCloud, 
  User, GraduationCap, Code2, AlertCircle, Target, Network,
  Menu, X, Fingerprint, Layers, Lock, Sun, Moon, Search
} from "lucide-react"

// ============================================================================
// 1. THEME TOGGLE
// ============================================================================
function AuthThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-10 h-10" />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all border border-transparent outline-none flex items-center justify-center"
      aria-label="Toggle Dark Mode"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

// ============================================================================
// 2. REAL-WORLD API ENGINE
// ============================================================================
const fetchApiSuggestions = async (query: string, type: 'university' | 'general') => {
  if (!query.trim() || query.length < 2) return [];
  try {
    if (type === 'university') {
      const res = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(query)}`);
      const data = await res.json();
      // Remove duplicates and limit to top 5
      return Array.from(new Set(data.map((d: any) => d.name))).slice(0, 5) as string[];
    } else {
      // Use Datamuse for generic tech/skill/degree suggestions
      const res = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(query)}`);
      const data = await res.json();
      return data.map((d: any) => d.word).slice(0, 5) as string[];
    }
  } catch (error) {
    console.error("API Fetch Error:", error);
    return [];
  }
};

// ============================================================================
// 3. SMART SINGLE SELECT (For Domain, College, Degree)
// ============================================================================
function LiveApiSingleSelect({ name, placeholder, apiType }: { name: string, placeholder: string, apiType: 'university' | 'general' }) {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  React.useEffect(() => {
    const fetchTimer = setTimeout(async () => {
      if (query.trim().length >= 2 && document.activeElement === wrapperRef.current?.querySelector('input')) {
        setLoading(true);
        const data = await fetchApiSuggestions(query, apiType);
        setResults(data);
        setIsOpen(data.length > 0);
        setLoading(false);
      } else {
        setIsOpen(false);
      }
    }, 300);
    return () => clearTimeout(fetchTimer);
  }, [query, apiType]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center">
        <input 
          name={name}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required 
          autoComplete="off"
          className="font-outfit w-full h-14 pl-12 pr-5 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-[#111113] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-[15px] font-medium shadow-sm transition-all outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
          placeholder={placeholder} 
        />
        <Search size={18} className="absolute left-4 text-zinc-400" />
        {loading && <Loader2 size={16} className="absolute right-4 text-blue-500 animate-spin" />}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {results.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { setQuery(item); setIsOpen(false); }}
              className="w-full text-left px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-[#111113] border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 transition-colors font-google-sans text-[14px] font-bold text-zinc-900 dark:text-zinc-100 capitalize outline-none"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 4. SMART MULTI-SELECT (For Skills, Interests)
// ============================================================================
function LiveApiMultiSelect({ name, placeholder }: { name: string, placeholder: string }) {
  const [query, setQuery] = React.useState('')
  const [selected, setSelected] = React.useState<string[]>([])
  const [results, setResults] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  React.useEffect(() => {
    const fetchTimer = setTimeout(async () => {
      if (query.trim().length >= 2 && document.activeElement === inputRef.current) {
        setLoading(true);
        const data = await fetchApiSuggestions(query, 'general');
        // Filter out already selected items
        setResults(data.filter(d => !selected.includes(d)));
        setIsOpen(data.length > 0);
        setLoading(false);
      } else {
        setIsOpen(false);
      }
    }, 300);
    return () => clearTimeout(fetchTimer);
  }, [query, selected]);

  const addTag = (item: string) => {
    if (!selected.includes(item)) setSelected([...selected, item]);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (itemToRemove: string) => {
    setSelected(selected.filter(item => item !== itemToRemove));
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selected.join(', ')} />
      
      <div 
        onClick={() => inputRef.current?.focus()}
        className="min-h-14 px-3 py-2 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 focus-within:bg-white dark:focus-within:bg-[#111113] focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 shadow-sm transition-all flex flex-wrap items-center gap-2 cursor-text relative"
      >
        {selected.length === 0 && query === '' && !isOpen && (
           <Search size={18} className="absolute left-4 text-zinc-400 pointer-events-none" />
        )}
        
        {selected.map((item, idx) => (
          <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[13px] font-bold font-google-sans text-zinc-800 dark:text-zinc-200 capitalize">
            {item}
            <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(item); }} className="text-zinc-400 hover:text-red-500 transition-colors outline-none">
              <X size={14} />
            </button>
          </span>
        ))}
        
        <input 
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              e.preventDefault();
              addTag(query.trim());
            } else if (e.key === 'Backspace' && query === '' && selected.length > 0) {
              removeTag(selected[selected.length - 1]);
            }
          }}
          autoComplete="off"
          className={`font-outfit flex-1 min-w-[120px] bg-transparent outline-none text-[15px] font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 py-1.5 ${selected.length === 0 ? 'pl-9' : 'pl-1'}`}
          placeholder={selected.length === 0 ? placeholder : "Add more..."} 
        />
        {loading && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {results.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => addTag(item)}
              className="w-full text-left px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-[#111113] border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 transition-colors font-google-sans text-[14px] font-bold text-zinc-900 dark:text-zinc-100 capitalize outline-none"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 5. MAIN PAGE COMPONENT
// ============================================================================
export default function OnboardingPage() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = React.useState<string>('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    formData.append('avatar_url', avatarUrl)

    // Safety check for multi-selects
    if (!formData.get('skills') || !formData.get('core_interests')) {
       setError("Please select at least one skill and interest.");
       setLoading(false);
       return;
    }

    const result = await completeOnboardingAction(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .font-google-sans { font-family: 'Google Sans', sans-serif !important; }
      `}} />

      <div className="h-[100dvh] w-full bg-[#fafafa] dark:bg-[#050505] font-outfit selection:bg-blue-500/20 flex flex-col lg:flex-row overflow-hidden antialiased">
        
        {/* ================= MOBILE DRAWER MENU ================= */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        <div className={`fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-[#0c0c0e] border-r border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-[72px] px-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
            <Link href="/" className="inline-flex items-center gap-3 outline-none">
              <Image src="/logo.png" alt="InfraCore" width={110} height={28} className="h-6 w-auto object-contain dark:invert" />
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors outline-none">
              <X size={20} />
            </button>
          </div>
          <div className="flex flex-col p-6 space-y-4">
            <Link href="/" className="font-google-sans text-[13px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-3 transition-colors outline-none">
              <Layers size={16}/> Return to Home
            </Link>
            <Link href="/auth/login" className="font-google-sans text-[13px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-3 transition-colors outline-none">
              <Lock size={16}/> Node Login
            </Link>
          </div>
        </div>


        {/* ================= LEFT PANEL (DESKTOP FIXED) ================= */}
        <div className="hidden lg:flex w-[45%] max-w-[600px] bg-[#0c0c0e] flex-col justify-between p-12 xl:p-16 relative overflow-hidden h-full border-r border-zinc-800 shadow-2xl">
          
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -mt-20 -ml-20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-20">
            <Link href="/" className="inline-flex items-center gap-3 group hover:opacity-80 transition-opacity outline-none">
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 shadow-sm backdrop-blur-md group-hover:bg-white/10 transition-colors">
                <Cpu size={20} className="text-blue-400" />
              </div>
              <Image src="/logo.png" alt="InfraCore" width={130} height={32} className="invert opacity-95" />
            </Link>
          </div>

          <div className="relative z-10 max-w-md mt-10">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 backdrop-blur-md">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              <span className="font-google-sans text-[10px] font-bold text-blue-300 uppercase tracking-widest">Setup Protocol</span>
            </div>
            
            <h1 className="font-google-sans text-4xl md:text-5xl xl:text-[3.5rem] font-bold text-white tracking-tight leading-[1.1] mb-6">
              Initialize your <br/>
              <span className="text-blue-400">workspace.</span>
            </h1>
            
            <p className="font-outfit text-zinc-400 text-[16px] font-medium leading-relaxed mb-10 max-w-sm">
              Infera Core requires baseline parameters to generate precise, actionable roadmaps and intelligence feeds tailored to your trajectory.
            </p>
            
            <div className="space-y-4">
               <div className="flex items-start gap-4 bg-white/5 p-5 rounded-[1.5rem] border border-white/10 backdrop-blur-sm">
                 <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-700 shadow-sm">
                   <Target className="text-blue-400" size={18} />
                 </div>
                 <div>
                     <h4 className="font-google-sans text-[13px] font-bold tracking-wide text-zinc-100 mb-1">Precision Routing</h4>
                     <p className="font-outfit text-[14px] text-zinc-400 leading-relaxed">Maps your current stack directly against industry demands.</p>
                 </div>
               </div>
               
               <div className="flex items-start gap-4 bg-white/5 p-5 rounded-[1.5rem] border border-white/10 backdrop-blur-sm">
                 <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-700 shadow-sm">
                   <Network className="text-blue-400" size={18} />
                 </div>
                 <div>
                     <h4 className="font-google-sans text-[13px] font-bold tracking-wide text-zinc-100 mb-1">Trajectory Mapping</h4>
                     <p className="font-outfit text-[14px] text-zinc-400 leading-relaxed">Aligns academic metrics with high-premium roles.</p>
                 </div>
               </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between font-google-sans text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-t border-zinc-800/80 pt-6 mt-12">
             <div className="flex items-center gap-2">
                 <Fingerprint size={14} className="text-blue-400" />
                 End-to-End Encryption
             </div>
             <span>v2.1.0</span>
          </div>
        </div>

        {/* ================= RIGHT PANEL (SCROLLABLE FORM) ================= */}
        <div className="w-full lg:flex-1 h-full overflow-y-auto bg-[#fafafa] dark:bg-[#050505] relative custom-scrollbar">
          
          {/* Desktop Absolute Theme Toggle */}
          <div className="hidden lg:block absolute top-8 right-8 z-50 bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-md rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800">
            <AuthThemeToggle />
          </div>

          {/* MOBILE HEADER */}
          <div className="lg:hidden h-[72px] flex-shrink-0 flex items-center justify-between px-6 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 z-30 sticky top-0 shadow-sm">
            <Link href="/" className="inline-flex items-center gap-3 outline-none">
              <Image src="/logo.png" alt="InfraCore" width={120} height={30} className="h-6 w-auto object-contain dark:invert" />
            </Link>
            <div className="flex items-center gap-2">
              <AuthThemeToggle />
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -mr-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors outline-none">
                <Menu size={22} />
              </button>
            </div>
          </div>

          <div className="w-full max-w-3xl mx-auto flex flex-col justify-center min-h-full p-6 md:p-12 py-12 lg:py-20">
              
              <div className="mb-10 text-center lg:text-left">
                <h2 className="font-google-sans text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">Identity Profile</h2>
                <p className="font-outfit text-zinc-500 dark:text-zinc-400 text-[16px] font-medium">Finalize your parameters to initialize the dashboard.</p>
              </div>

              {/* The SaaS Form Card */}
              <div className="w-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 p-6 sm:p-10 rounded-[2rem] shadow-sm">
                
                {error && (
                  <div className="mb-8 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 animate-in fade-in zoom-in-95">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p className="font-outfit text-[14px] font-medium leading-relaxed">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-12">
                  
                  {/* Section 1: Basic Details */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                          <User className="text-blue-600 dark:text-blue-400" size={16} />
                      </div>
                      <h3 className="font-google-sans text-[13px] font-bold uppercase tracking-wider text-zinc-900 dark:text-white">1. Core Identity</h3>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-8 items-start">
                      
                      {/* Cloudinary Avatar Upload */}
                      <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
                        <label className="font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 pl-1">Avatar</label>
                        <CldUploadWidget 
                          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "infracore_avatars"}
                          onSuccess={(result: any) => setAvatarUrl(result.info.secure_url)}
                        >
                          {({ open }) => (
                            <div 
                              onClick={() => open()}
                              className="w-full sm:w-28 h-28 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#111113] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all overflow-hidden relative group shadow-sm"
                            >
                              {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <>
                                  <UploadCloud size={24} className="text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                  <span className="font-google-sans text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Upload</span>
                                </>
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                                 <span className="font-google-sans text-white text-[10px] font-bold uppercase tracking-widest">Change</span>
                              </div>
                            </div>
                          )}
                        </CldUploadWidget>
                      </div>

                      <div className="flex-1 space-y-5 w-full">
                        <div>
                          <label className="font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 block pl-1">Full Legal Name</label>
                          <input 
                            name="full_name" 
                            required 
                            className="font-outfit w-full h-14 px-5 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-[#111113] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-[15px] font-medium shadow-sm transition-all outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400" 
                            placeholder="e.g. Alan Turing" 
                          />
                        </div>
                        <div>
                          <label className="font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 block pl-1">Target Engineering Domain</label>
                          <LiveApiSingleSelect 
                            name="target_domain" 
                            apiType="general" 
                            placeholder="Search domains (e.g. Backend Architecture)..." 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Academic Intel */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                          <GraduationCap className="text-blue-600 dark:text-blue-400" size={16} />
                      </div>
                      <h3 className="font-google-sans text-[13px] font-bold uppercase tracking-wider text-zinc-900 dark:text-white">2. Academic Matrix</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                      <div className="md:col-span-2">
                        <label className="font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 block pl-1">Institution</label>
                        <LiveApiSingleSelect 
                          name="college_name" 
                          apiType="university" 
                          placeholder="Search global institutions..." 
                        />
                      </div>
                      <div>
                        <label className="font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 block pl-1">Degree / Major</label>
                        <LiveApiSingleSelect 
                          name="degree" 
                          apiType="general" 
                          placeholder="Search degrees (e.g. Computer Science)..." 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 block pl-1 text-center sm:text-left">Grad Year</label>
                          <input 
                            name="graduation_year" 
                            type="number" 
                            required 
                            className="font-outfit w-full h-14 px-4 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-[#111113] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-[15px] font-medium shadow-sm transition-all outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 text-center sm:text-left" 
                            placeholder="2026" 
                          />
                        </div>
                        <div>
                          <label className="font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 block pl-1 text-center sm:text-left">Semester</label>
                          <input 
                            name="current_semester" 
                            type="number" 
                            required 
                            className="font-outfit w-full h-14 px-4 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-[#111113] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-[15px] font-medium shadow-sm transition-all outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 text-center sm:text-left" 
                            placeholder="e.g. 5" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Technical Arsenal */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                          <Code2 className="text-blue-600 dark:text-blue-400" size={16} />
                      </div>
                      <h3 className="font-google-sans text-[13px] font-bold uppercase tracking-wider text-zinc-900 dark:text-white">3. Technical Arsenal</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 block pl-1">Current Skills</label>
                        <LiveApiMultiSelect 
                          name="skills" 
                          placeholder="Search and add skills (e.g. Python, React)..." 
                        />
                      </div>
                      <div>
                        <label className="font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 block pl-1">Core Interests</label>
                        <LiveApiMultiSelect 
                          name="core_interests" 
                          placeholder="Search and add interests (e.g. Distributed Systems)..." 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Area */}
                  <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800/60">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-google-sans font-bold h-16 rounded-2xl transition-all shadow-[0_8px_30px_rgba(37,99,235,0.25)] active:scale-[0.98] flex items-center justify-center gap-3 text-[14px] uppercase tracking-widest outline-none disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Processing...
                        </>
                      ) : (
                        <>
                          Synchronize & Deploy <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
          </div>
        </div>
      </div>
    </>
  )
}