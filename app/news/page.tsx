'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getEducationNews } from '@/app/actions/news-feed'
import { DashboardNavbar } from '@/components/dashboard/dashboard-navbar'
import { Search, Clock, TrendingUp, Zap, ArrowRight } from 'lucide-react'

// --- UTILS ---
function formatDate(dateString: string) {
  try {
    if (!dateString) return 'Just now';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString));
  } catch {
    return 'Recent';
  }
}

// STRICT SAFE STRINGIFIER: Prevents HTTP 431 Header Too Large errors.
// Packages ONLY the necessary fields and strictly caps lengths.
function safeStringify(article: any) {
  const safeArticle = {
    title: article.title || 'Untitled',
    description: article.description ? article.description.substring(0, 250) : '',
    content: article.content ? article.content.substring(0, 800) + '... [Content truncated for preview]' : '',
    url: article.url || '#',
    urlToImage: article.urlToImage || null,
    publishedAt: article.publishedAt || new Date().toISOString(),
    source: article.source || { name: 'News' },
    author: article.author || null
  };
  return encodeURIComponent(JSON.stringify(safeArticle));
}

const ENGINEERING_CATEGORIES = [
  { label: 'Software', query: 'Software Engineering' },
  { label: 'AI & Machine Learning', query: 'Artificial Intelligence Engineering' },
  { label: 'Mechanical', query: 'Mechanical Engineering' },
  { label: 'Electrical', query: 'Electrical Engineering' },
  { label: 'Civil', query: 'Civil Engineering' },
  { label: 'Aerospace', query: 'Aerospace Engineering' },
  { label: 'Electronics', query: 'Electronics Engineering' },
  { label: 'Robotics', query: 'Robotics Engineering' },
];

export default function NewsPage(props: { searchParams: Promise<{ q?: string }> }) {
  const [articles, setArticles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [success, setSuccess] = React.useState(true);
  const [rawQuery, setRawQuery] = React.useState('');

  const loadNews = React.useCallback(async (queryToFetch: string) => {
    setLoading(true);
    setRawQuery(queryToFetch);
    try {
      const response = await getEducationNews(queryToFetch);
      setArticles(response.articles || []);
      setSuccess(response.success);
    } catch (error) {
      console.error("Failed to load news", error);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    async function init() {
      const params = await props.searchParams;
      const initialQuery = params?.q || 'Software Engineering';
      loadNews(initialQuery);
    }
    init();
  }, [props.searchParams, loadNews]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q') as string;
    if (q) loadNews(q);
  };

  const activeQuery = rawQuery || 'Software Engineering';
  
  // Distribute articles
  const featuredArticle = articles?.[0];
  const sidebarArticles = articles?.slice(1, 6) || [];
  const gridArticles = articles?.slice(6) || [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap');
        
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .font-google-sans { font-family: 'Google Sans', sans-serif !important; }
      `}} />

      <div className="flex flex-col min-h-screen bg-[#fafafa] dark:bg-[#050505] font-outfit text-zinc-900 dark:text-zinc-100 antialiased selection:bg-blue-500/20">
        <DashboardNavbar userEmail="Operator" />

        <main className="flex-1 w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 py-8 lg:py-12">
          
          {/* HEADER, SEARCH & CATEGORIES */}
          <div className="flex flex-col gap-6 lg:gap-8 mb-12 border-b border-zinc-200 dark:border-zinc-800/80 pb-8">
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 lg:gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <Image 
                    src="/logo.png" 
                    alt="InferaCore" 
                    width={140} 
                    height={35} 
                    className="object-contain dark:invert opacity-95" 
                    priority 
                  />
                  <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700" />
                  <p className="font-google-sans text-[12px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-[0.2em] mt-0.5">
                    Intelligence Feed
                  </p>
                </div>

                <h1 className="font-google-sans text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-zinc-900 dark:text-white tracking-tight leading-[1.1]">
                  Global Tech & Engineering
                </h1>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-[420px] shrink-0 group">
                <Search
                  size={18}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  name="q"
                  defaultValue={rawQuery !== 'Software Engineering' ? rawQuery : ''}
                  placeholder="Deep search technical breakthroughs..."
                  className="font-outfit w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-[1rem] transition-all text-[14px] font-medium text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none shadow-sm dark:shadow-none"
                />
              </form>
            </div>

            {/* Scrolling Categories */}
            <div className="flex items-center gap-2.5 overflow-x-auto custom-scrollbar pb-2 pt-2 scrollbar-hide -mx-5 px-5 sm:mx-0 sm:px-0">
              {ENGINEERING_CATEGORIES.map((cat) => {
                const isActive = activeQuery.toLowerCase() === cat.query.toLowerCase();
                return (
                  <button
                    key={cat.label}
                    onClick={() => loadNews(cat.query)}
                    className={`font-google-sans whitespace-nowrap px-5 py-2.5 rounded-full text-[12px] uppercase tracking-wider font-bold transition-all duration-300 outline-none ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105' 
                        : 'bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* CONTENT AREA */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-12 h-12 border-[3px] border-zinc-200 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin" />
              <p className="font-google-sans font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest text-[12px]">Fetching Intelligence...</p>
            </div>
          ) : !success || !featuredArticle ? (
            <div className="flex flex-col items-center justify-center text-center py-32 gap-5 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 rounded-[2rem] shadow-sm">
              <div className="w-16 h-16 bg-zinc-50 dark:bg-[#111113] border border-zinc-100 dark:border-zinc-800 rounded-full flex items-center justify-center shadow-inner">
                <Search size={28} className="text-zinc-400 dark:text-zinc-600" />
              </div>
              <div>
                <h3 className="font-google-sans text-2xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">No updates found</h3>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium text-[15px]">Try adjusting your search parameters to a different domain.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-12 lg:gap-16">
              
              {/* TOP SECTION: HERO (Left) & SIDEBAR (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                
                {/* LEFT: TEXT-FOCUSED HERO ARTICLE */}
                <div className="lg:col-span-8 group">
                  <Link
                    href={`/news/article?data=${safeStringify(featuredArticle)}`}
                    className="relative flex flex-col justify-center min-h-[420px] rounded-[2rem] p-8 sm:p-12 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e] hover:border-blue-300 dark:hover:border-blue-900/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)] dark:hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)] transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-3 font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-6">
                      <span className="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-md border border-blue-100 dark:border-blue-500/20">
                        {featuredArticle.source?.name || 'Top Story'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} /> {formatDate(featuredArticle.publishedAt)}
                      </span>
                    </div>
                    
                    <h2 className="font-google-sans text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-zinc-900 dark:text-white tracking-tight leading-[1.15] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-6">
                      {featuredArticle.title}
                    </h2>
                    
                    <p className="text-[17px] sm:text-[19px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed line-clamp-4">
                      {featuredArticle.description}
                    </p>

                    <div className="mt-10 flex items-center gap-2 font-google-sans font-bold text-[13px] uppercase text-blue-600 dark:text-blue-400 tracking-widest bg-blue-50 dark:bg-blue-500/10 w-fit px-5 py-2.5 rounded-full opacity-90 group-hover:opacity-100 transition-opacity">
                      Analyze Full Report <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </div>

                {/* RIGHT: SIDEBAR (Latest Updates) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                      <Zap size={16} className="text-blue-600 dark:text-blue-500" />
                    </div>
                    <h3 className="font-google-sans text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                      Live Intelligence
                    </h3>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {sidebarArticles.map((article: any, index: number) => (
                      <Link
                        key={article.url || index}
                        href={`/news/article?data=${safeStringify(article)}`}
                        className="group flex flex-col items-start gap-2 p-4 -mx-4 rounded-2xl hover:bg-white dark:hover:bg-[#0c0c0e] border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 hover:shadow-sm transition-all duration-300"
                      >
                        <div className="flex items-center gap-2 font-google-sans text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          <span className="text-blue-600 dark:text-blue-400 truncate max-w-[150px]">
                            {article.source?.name || 'External'}
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <span>{formatDate(article.publishedAt)}</span>
                        </div>
                        <h4 className="font-google-sans text-[16px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {article.title}
                        </h4>
                      </Link>
                    ))}
                  </div>
                </div>

              </div>

              {/* BOTTOM GRID SECTION */}
              {gridArticles.length > 0 && (
                <div className="pt-12 lg:pt-16 border-t border-zinc-200 dark:border-zinc-800/60">
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm">
                      <TrendingUp size={18} className="text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <h3 className="font-google-sans text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      Deep Dives & Reports
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                    {gridArticles.map((article: any, index: number) => (
                      <Link
                        key={article.url || index}
                        href={`/news/article?data=${safeStringify(article)}`}
                        className="group flex flex-col justify-between p-8 rounded-[2rem] bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-900/50 hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1.5 min-h-[300px]"
                      >
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-center gap-2 font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                            <span className="text-blue-600 dark:text-blue-400">{article.source?.name || 'Research'}</span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span>{formatDate(article.publishedAt)}</span>
                          </div>
                          
                          <h4 className="font-google-sans text-[20px] font-bold text-zinc-900 dark:text-white leading-[1.3] tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-4">
                            {article.title}
                          </h4>
                          
                          <p className="text-zinc-500 dark:text-zinc-400 text-[15px] font-medium leading-relaxed line-clamp-3">
                            {article.description}
                          </p>
                        </div>
                        
                        <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
                          <span className="font-google-sans text-[11px] font-bold text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 uppercase tracking-[0.2em] transition-colors">
                            Access Data
                          </span>
                          <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-300">
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </>
  )
}