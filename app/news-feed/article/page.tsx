'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { getEducationNews } from '@/app/actions/news-feed'
import { DashboardNavbar } from '@/components/dashboard/dashboard-navbar'
import { ArrowLeft, ExternalLink, Calendar, User, ImageOff, Zap } from 'lucide-react'

// --- UTILS ---
function formatDate(dateString: string) {
  try {
    if (!dateString) return 'Unknown Date';
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(dateString));
  } catch {
    return 'Recent';
  }
}

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

function ArticleReader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dataParam = searchParams.get('data');

  const [article, setArticle] = React.useState<any>(null);
  const [error, setError] = React.useState(false);
  const [suggestedNews, setSuggestedNews] = React.useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(true);

  // Parse the main article from the URL
  React.useEffect(() => {
    if (dataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        setArticle(parsed);
      } catch (e) {
        console.error("Failed to parse article data:", e);
        setError(true);
      }
    } else {
      setError(true);
    }
  }, [dataParam]);

  // Fetch suggested news for the sidebar
  React.useEffect(() => {
    async function fetchSuggestions() {
      setLoadingSuggestions(true);
      try {
        // Fetching general EdTech news for recommendations
        const response = await getEducationNews('EdTech OR University OR "Education Technology"');
        if (response.success && response.articles) {
          // Filter out the current article if it happens to be in the suggestions
          const filtered = response.articles.filter((a: any) => a.title !== article?.title);
          setSuggestedNews(filtered.slice(0, 5)); // Keep top 5
        }
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }
    
    if (article) {
      fetchSuggestions();
    }
  }, [article]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <h2 className="font-google-sans text-2xl font-bold text-zinc-900 dark:text-white">Article Not Found</h2>
        <p className="text-zinc-500">The data for this article could not be loaded.</p>
        <button onClick={() => router.push('/news')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full font-bold text-sm">
          Return to Feed
        </button>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-[3px] border-zinc-200 dark:border-zinc-800 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-20">
      
      {/* Back Button */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-google-sans font-bold text-[13px] uppercase tracking-wider mb-8 transition-colors group outline-none w-fit"
      >
        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={16} />
        </div>
        Return to Feed
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        
        {/* LEFT COLUMN: MAIN ARTICLE */}
        <div className="lg:col-span-8">
          {/* Hero Image */}
          {article.urlToImage ? (
            <div className="w-full h-[300px] sm:h-[450px] rounded-[2rem] overflow-hidden mb-10 shadow-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#0c0c0e]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.urlToImage} alt={article.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-[200px] rounded-[2rem] mb-10 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0c0c0e] flex flex-col items-center justify-center text-zinc-400">
               <ImageOff size={48} strokeWidth={1} />
            </div>
          )}

          {/* Meta Data */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-google-sans text-[12px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-6">
            <span className="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-500/20">
              {article.source?.name || 'Publisher'}
            </span>
            <span className="flex items-center gap-2">
              <Calendar size={16} /> {formatDate(article.publishedAt)}
            </span>
            {article.author && (
              <span className="flex items-center gap-2">
                <User size={16} /> {article.author}
              </span>
            )}
          </div>

          {/* Title & Description */}
          <h1 className="font-google-sans text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-[1.15] mb-8">
            {article.title}
          </h1>

          <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-8" />

          {/* Content */}
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <p className="text-xl sm:text-2xl font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed mb-8">
              {article.description}
            </p>
            
            <p className="text-lg text-zinc-800 dark:text-zinc-400 leading-loose whitespace-pre-wrap">
              {article.content}
            </p>
          </div>

          {/* Footer CTA */}
          <div className="mt-16 p-8 sm:p-10 rounded-[2rem] bg-zinc-50 dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center">
            <h3 className="font-google-sans text-2xl font-bold text-zinc-900 dark:text-white mb-3">Continue Reading</h3>
            <p className="text-zinc-500 mb-8 max-w-md">
              This is a preview snippet provided by the publisher. To read the full, uninterrupted article, please visit the original source.
            </p>
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-google-sans font-bold text-[14px] uppercase text-white tracking-widest bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-full transition-colors shadow-lg shadow-blue-500/25"
            >
              Open Original Source <ExternalLink size={18} />
            </a>
          </div>
        </div>

        {/* RIGHT COLUMN: SUGGESTED NEWS SIDEBAR */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-8 flex flex-col gap-6">
            
            <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                <Zap size={16} className="text-blue-600 dark:text-blue-500" />
              </div>
              <h3 className="font-google-sans text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                Related Intelligence
              </h3>
            </div>

            {loadingSuggestions ? (
              <div className="flex flex-col gap-4 mt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-full h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : suggestedNews.length === 0 ? (
              <p className="text-zinc-500 text-sm mt-2">No related news found at this time.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {suggestedNews.map((item: any, index: number) => (
                  <Link
                    key={item.url || index}
                    href={`/news-feed/article?data=${safeStringify(item)}`}
                    className="group flex flex-col gap-3 p-4 rounded-[1.5rem] bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-900/50 hover:shadow-md dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 font-google-sans text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      <span className="text-blue-600 dark:text-blue-400 truncate max-w-[120px]">
                        {item.source?.name || 'External'}
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span>{formatDate(item.publishedAt)}</span>
                    </div>
                    
                    <h4 className="font-google-sans text-[15px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h4>

                    {/* Show a tiny thumbnail if the suggested article has an image */}
                    {item.urlToImage && (
                      <div className="w-full h-24 mt-2 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.urlToImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  )
}

export default function ArticlePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .font-google-sans { font-family: 'Google Sans', sans-serif !important; }
      `}} />

      <div className="flex flex-col min-h-screen bg-[#fafafa] dark:bg-[#050505] font-outfit antialiased selection:bg-blue-500/20">
        <DashboardNavbar userEmail="Operator" />
        
        <main className="flex-1 w-full px-5 sm:px-8 lg:px-12 py-8 lg:py-12">
          <React.Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="w-12 h-12 border-[3px] border-zinc-200 dark:border-zinc-800 border-t-blue-600 rounded-full animate-spin" />
            </div>
          }>
            <ArticleReader />
          </React.Suspense>
        </main>
      </div>
    </>
  )
}