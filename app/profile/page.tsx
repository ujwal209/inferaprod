'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { DashboardNavbar } from '@/components/dashboard/dashboard-navbar'
import { getStudentProfile, updateStudentProfile } from '@/app/actions/profile'
import { 
  User, School, Target, Cpu, Save, 
  Loader2, Camera, Sparkles, CheckCircle2, Search, X
} from 'lucide-react'

// ============================================================================
// MOCK DATABASES FOR ASYNC FETCHING (Simulating real-world backend APIs)
// ============================================================================
const DB_DEGREES = ["B.Tech in Computer Science", "B.Tech in Information Technology", "B.Sc in Computer Science", "M.Tech in Computer Science", "B.E. in Artificial Intelligence", "B.E. in Data Science", "BCA", "MCA", "B.Tech in Electronics", "Self-Taught / Bootcamp"];
const DB_SKILLS = ["React", "Next.js", "Node.js", "Python", "TypeScript", "JavaScript", "Go", "Rust", "Java", "C++", "C", "Docker", "Kubernetes", "AWS", "GCP", "PostgreSQL", "MongoDB", "Redis", "GraphQL", "Tailwind CSS", "TensorFlow", "PyTorch"];
const DB_INTERESTS = ["Open Source", "Distributed Systems", "Machine Learning", "Web Architecture", "UI/UX Design", "System Design", "Cloud Native", "Fintech", "Game Development", "Compilers", "Networking", "Database Internals"];

// ============================================================================
// AUTOCOMPLETE COMPONENTS
// ============================================================================

// Custom hook to debounce API calls
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Single Select Autocomplete (For College, Domain, Degree)
const AutocompleteSingle = ({ name, initialValue, placeholder, fetcher, icon: Icon }: any) => {
  const [query, setQuery] = useState(initialValue || '');
  const [results, setResults] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const fetchResults = async () => {
      setLoading(true);
      const res = await fetcher(debouncedQuery);
      setResults(res);
      setLoading(false);
    };
    fetchResults();
  }, [debouncedQuery, isOpen, fetcher]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        {Icon && <Icon className="absolute left-4 text-zinc-400" size={16} />}
        <input 
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${Icon ? 'pl-11' : 'px-4'} pr-10 py-3 rounded-xl text-[15px] font-medium outline-none transition-all placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 shadow-sm`}
        />
        <input type="hidden" name={name} value={query} />
        {loading && <Loader2 className="absolute right-4 animate-spin text-zinc-400" size={16} />}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
          {results.map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => { setQuery(item); setIsOpen(false); }}
              className="px-4 py-3 text-[14px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 transition-colors"
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Multi Select Autocomplete (For Skills, Interests)
const AutocompleteMulti = ({ name, initialValues = [], placeholder, fetcher }: any) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>(Array.isArray(initialValues) ? initialValues : []);
  const [results, setResults] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!isOpen && query === '') return;
    const fetchResults = async () => {
      setLoading(true);
      const res = await fetcher(debouncedQuery);
      // Filter out already selected items
      setResults(res.filter((item: string) => !selected.includes(item)));
      setLoading(false);
    };
    fetchResults();
  }, [debouncedQuery, isOpen, fetcher, selected, query]);

  const addTag = (tag: string) => {
    if (!selected.includes(tag)) setSelected([...selected, tag]);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    setSelected(selected.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim() !== '') {
      e.preventDefault();
      addTag(query.trim());
    } else if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      removeTag(selected[selected.length - 1]);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Hidden input to pass the array as a comma separated string to the backend */}
      <input type="hidden" name={name} value={selected.join(', ')} />
      
      <div 
        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 p-2.5 rounded-xl transition-all shadow-sm flex flex-wrap gap-2 items-center min-h-[52px]"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((tag, idx) => (
          <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[13px] font-semibold rounded-md">
            {tag}
            <X size={12} className="cursor-pointer hover:text-red-500 transition-colors" onClick={(e) => { e.stopPropagation(); removeTag(tag); }} />
          </span>
        ))}
        <div className="flex-1 min-w-[120px] relative flex items-center">
          <input 
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? placeholder : ''}
            className="w-full bg-transparent text-[15px] font-medium outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 py-1"
          />
          {loading && <Loader2 className="absolute right-2 animate-spin text-zinc-400" size={14} />}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
          {results.map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => addTag(item)}
              className="px-4 py-3 text-[14px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 transition-colors"
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function StudentProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const data = await getStudentProfile();
      if (data) setProfile(data);
      setLoading(false);
    }
    init();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateStudentProfile(new FormData(e.currentTarget));
    } catch (err) {
      alert("Error updating profile.");
    } finally { 
      setSaving(false); 
    }
  };

  // --- API FETCHER FUNCTIONS ---
  
  // REAL API 1: Hipolabs Public University API
  const fetchUniversities = async (q: string) => {
    if (!q || q.length < 2) return [];
    try {
      const res = await fetch(`https://universities.hipolabs.com/search?name=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      return Array.from(new Set(data.map((u: any) => u.name))).slice(0, 8) as string[];
    } catch (e) {
      return [];
    }
  };

  // REAL API 2: LMI For All (Occupational Domains / Job Titles)
  const fetchDomains = async (q: string) => {
    if (!q || q.length < 2) return [];
    try {
      const res = await fetch(`https://api.lmiforall.org.uk/api/v1/soc/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      
      // Capitalize titles for a premium UI look and remove duplicates
      const titles = data.map((job: any) => {
        return job.title.charAt(0).toUpperCase() + job.title.slice(1);
      });
      return Array.from(new Set(titles)).slice(0, 8) as string[];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  // SIMULATED APIs (for highly specific dev skills and degrees where free APIs are restricted)
  const simulateApi = async (q: string, db: string[]) => {
    return new Promise<string[]>((resolve) => {
      setTimeout(() => {
        if (!q) resolve(db.slice(0, 8));
        const filtered = db.filter(item => item.toLowerCase().includes(q.toLowerCase()));
        resolve(filtered.slice(0, 8));
      }, 300);
    });
  };
  
  const fetchDegrees = (q: string) => simulateApi(q, DB_DEGREES);
  const fetchSkills = (q: string) => simulateApi(q, DB_SKILLS);
  const fetchInterests = (q: string) => simulateApi(q, DB_INTERESTS);


  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#fafafa] dark:bg-[#050505] font-sans antialiased">
        <DashboardNavbar userEmail="Loading..." />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-500" size={32} />
          <p className="text-[14px] font-medium text-zinc-500 dark:text-zinc-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa] dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 font-sans antialiased selection:bg-blue-500/20">
      
      {/* GLOBAL NAVBAR */}
      <DashboardNavbar userEmail={profile?.email || 'student@infracore.edu'} />

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col w-full relative">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col w-full">
          
          <div className="flex-1 w-full max-w-[1200px] mx-auto px-5 sm:px-8 py-10 lg:py-12 space-y-10">
            
            {/* HEADER */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                Profile Settings
              </h1>
              <p className="text-[16px] text-zinc-500 dark:text-zinc-400 font-medium">
                Manage your personal details, academic status, and career goals.
              </p>
            </div>

            {/* HERO CARD - Premium Dark Theme */}
            <div className="bg-zinc-900 dark:bg-[#111113] rounded-3xl p-8 sm:p-10 text-white shadow-md relative overflow-hidden border border-zinc-800/80">
              <div className="absolute -top-10 -right-10 p-8 opacity-[0.02] rotate-12 pointer-events-none text-blue-400"><Cpu size={250}/></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent pointer-events-none" />

              <div className="relative flex flex-col sm:flex-row items-center sm:items-center gap-8 sm:gap-10 z-10">
                
                {/* Avatar Upload */}
                <div className="relative group shrink-0">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-zinc-800 border-4 border-zinc-800 overflow-hidden shadow-xl transition-all group-hover:border-zinc-700">
                    {avatarPreview || profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview || profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 bg-zinc-800"><User size={40} /></div>
                    )}
                  </div>
                  <input type="file" name="avatar" id="avatar-input" className="hidden" onChange={handleAvatarChange} accept="image/*" />
                  <label htmlFor="avatar-input" className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-500 hover:scale-105 transition-all shadow-lg shadow-blue-900/20 z-10 border-[3px] border-zinc-900 dark:border-[#111113]">
                    <Camera size={16} />
                  </label>
                  <input type="hidden" name="current_avatar_url" value={profile?.avatar_url || ''} />
                </div>
                
                {/* Hero Text */}
                <div className="text-center sm:text-left space-y-3 flex-1">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{profile?.full_name || 'New Operator'}</h2>
                    <Sparkles className="text-blue-400 shrink-0 hidden sm:block" size={20} />
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <span className="px-3 py-1 bg-zinc-800 rounded-md text-[13px] font-bold text-zinc-300">
                      {profile?.degree || 'Degree Not Set'}
                    </span>
                    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-[13px] font-bold text-blue-400">
                      Semester {profile?.current_semester || '?'}
                    </span>
                  </div>
                  <p className="text-[14px] text-zinc-400 font-medium flex items-center justify-center sm:justify-start gap-1.5">
                     <School size={14} className="text-blue-400" />
                     {profile?.college_name || 'Institution Pending'}
                  </p>
                </div>
              </div>
            </div>

            {/* DYNAMIC GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 pb-12">
              
              {/* LEFT COLUMN: Personal & Academic Data */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Personal Meta */}
                <section className="bg-white dark:bg-[#111113] p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-6">
                  <div className="border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                    <h3 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <User size={18} className="text-blue-600 dark:text-blue-500" /> Personal Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[13px] font-bold text-zinc-600 dark:text-zinc-400 mb-2 pl-1">Full Name</label>
                      <input 
                        name="full_name" 
                        defaultValue={profile?.full_name} 
                        placeholder="e.g. Jane Doe" 
                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 px-4 py-3 rounded-xl text-[15px] font-medium outline-none transition-all placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-zinc-600 dark:text-zinc-400 mb-2 pl-1">Account Email</label>
                      <input 
                        disabled 
                        value={profile?.email} 
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-xl text-[15px] font-medium text-zinc-500 dark:text-zinc-500 cursor-not-allowed select-none shadow-sm" 
                      />
                    </div>
                  </div>
                </section>

                {/* Institution Data */}
                <section className="bg-white dark:bg-[#111113] p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-6">
                  <div className="border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                    <h3 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <School size={18} className="text-blue-600 dark:text-blue-500" /> Academic Profile
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-[13px] font-bold text-zinc-600 dark:text-zinc-400 mb-2 pl-1">University / College</label>
                      <AutocompleteSingle 
                        name="college_name" 
                        initialValue={profile?.college_name} 
                        placeholder="Search for your university..." 
                        fetcher={fetchUniversities}
                        icon={Search}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[13px] font-bold text-zinc-600 dark:text-zinc-400 mb-2 pl-1">Degree Title</label>
                      <AutocompleteSingle 
                        name="degree" 
                        initialValue={profile?.degree} 
                        placeholder="Search or type degree..." 
                        fetcher={fetchDegrees}
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-zinc-600 dark:text-zinc-400 mb-2 pl-1">Graduation Year</label>
                      <input 
                        name="graduation_year" 
                        type="number" 
                        defaultValue={profile?.graduation_year} 
                        placeholder="e.g. 2026" 
                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 px-4 py-3 rounded-xl text-[15px] font-medium outline-none transition-all placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-zinc-600 dark:text-zinc-400 mb-2 pl-1">Current Semester</label>
                      <input 
                        name="current_semester" 
                        type="number" 
                        defaultValue={profile?.current_semester} 
                        placeholder="e.g. 6" 
                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 px-4 py-3 rounded-xl text-[15px] font-medium outline-none transition-all placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 shadow-sm" 
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* RIGHT COLUMN: Career Vector */}
              <div className="space-y-8">
                <section className="bg-white dark:bg-[#111113] p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-6">
                  <div className="border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                    <h3 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Target size={18} className="text-blue-600 dark:text-blue-500" /> Career Goals
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[13px] font-bold text-zinc-600 dark:text-zinc-400 mb-2 pl-1">Target Domain</label>
                      <AutocompleteSingle 
                        name="target_domain" 
                        initialValue={profile?.target_domain} 
                        placeholder="Search target domain..." 
                        fetcher={fetchDomains}
                        icon={Search}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[13px] font-bold text-zinc-600 dark:text-zinc-400 mb-2 pl-1">Technical Skills</label>
                      <AutocompleteMulti 
                        name="skills" 
                        initialValues={profile?.skills} 
                        placeholder="Search & add skills..." 
                        fetcher={fetchSkills}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[13px] font-bold text-zinc-600 dark:text-zinc-400 mb-2 pl-1">Core Interests</label>
                      <AutocompleteMulti 
                        name="core_interests" 
                        initialValues={profile?.core_interests} 
                        placeholder="Search & add interests..." 
                        fetcher={fetchInterests}
                      />
                    </div>
                  </div>
                </section>

                {/* System Status Box */}
                <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-3xl p-6 flex items-start gap-4 shadow-sm">
                   <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                     <CheckCircle2 size={20} />
                   </div>
                   <div>
                     <h4 className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100 mb-1">Profile Synced</h4>
                     <p className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                       Your dashboard is personalizing content based on these settings.
                     </p>
                   </div>
                </div>
              </div>

            </div>
          </div>

          {/* STICKY SAVE DOCK */}
          <div className="sticky bottom-0 left-0 right-0 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-t border-zinc-200/80 dark:border-zinc-800/80 p-4 sm:px-8 sm:py-5 z-20">
            <div className="max-w-[1200px] mx-auto flex items-center justify-between">
              <p className="hidden sm:block text-[13px] font-bold text-zinc-500">Don't forget to save your changes.</p>
              <button 
                type="submit"
                disabled={saving} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-[14px] font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

        </form>
      </main>
    </div>
  )
}