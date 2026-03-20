import * as React from 'react'
import Link from 'next/link'
import { DashboardNavbar } from '@/components/dashboard/dashboard-navbar'
import { ArrowLeft, Clock, ExternalLink, TrendingUp, ArrowRight } from 'lucide-react'
import { getEducationNews } from '@/app/actions/news-feed'

// --- UTILS ---
function formatDate(dateString: string) {
  try {
    if (!dateString) return 'Just now';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString));
  } catch {
    return 'Recent';
  }
}

function extractTopicFromTitle(title: string) {
  if (!title) return 'Engineering';
  const stopWords = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'how', 'why', 'what', 'are', 'is', 'in', 'on', 'at', 'to'];
  const words = title.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stopWords.includes(w));
  return words.slice(0, 2).join(' ') || 'Technology';
}

function safeStringify(article: any) {
  const safeArticle = { ...article };
  if (safeArticle.content && safeArticle.content.length > 5000) {
    safeArticle.content = safeArticle.content.substring(0, 5000) + '... [Content truncated for preview]';
  }
  return encodeURIComponent(JSON.stringify(safeArticle));
}

// ============================================================================
// AGGRESSIVE TEXT CLEANER: Strips out website boilerplate, nav menus, 
// cookie policies, and subscription prompts from raw scraped content.
// ============================================================================
function cleanArticleText(text: string) {
  if (!text) return 'Detailed content preview is currently restricted by the publisher. Please continue to the official source to read the complete technical breakdown.';
  
  // 1. Remove API truncation markers
  let cleaned = text.split('[+')[0];
  
  // 2. Split into lines/paragraphs
  const paragraphs = cleaned.split(/\n+/);
  
  // 3. Filter out the "slop"
  const filtered = paragraphs.filter(p => {
    const trimmed = p.trim();
    const lower = trimmed.toLowerCase();
    
    // Skip empty lines or stray characters
    if (trimmed.length < 5) return false;
    
    // Skip obvious boilerplate and garbage keywords
    const boilerplate = [
      'cookie', 'privacy policy', 'terms of service', 'all rights reserved',
      'subscribe', 'sign in', 'log in', 'create an account', 'forgot password',
      'sponsored by', 'advertisement', 'newsletter', 'read more', 'click here',
      'javascript:void', 'set default', 'latest news', 'loadshedding', 'multimedia'
    ];
    if (boilerplate.some(bp => lower.includes(bp))) return false;
    
    // Skip lines that look like exchange rates, tickers, or short nav menu items
    // (e.g., "R/€ = 19.2936" or "Au 5075.35 $/oz")
    if (trimmed.length < 50 && !/[.!?”"]$/.test(trimmed)) {
      return false;
    }
    
    return true;
  });

  const finalContent = filtered.join('\n\n').trim();
  
  return finalContent.length > 100 
    ? finalContent 
    : 'Detailed content preview is currently restricted by the publisher. Please continue to the official source to read the complete technical breakdown.';
}


export default async function ArticleDetailPage(props: { searchParams: Promise<{ data?: string }> }) {
  const searchParams = await props.searchParams;
  const encodedData = searchParams?.data;

  // --- FONT INJECTION ---
  const FontStyles = (
    <style dangerouslySetInnerHTML={{ __html: `
      @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap');
      
      .font-outfit { font-family: 'Outfit', sans-serif !important; }
      .font-google-sans { font-family: 'Google Sans', sans-serif !important; }
    `}} />
  );

  if (!encodedData) {
    return (
      <>
        {FontStyles}
        <div className="flex flex-col min-h-screen bg-[#fafafa] dark:bg-[#050505] items-center justify-center gap-5 font-outfit antialiased selection:bg-blue-500/20">
          <h1 className="font-google-sans text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Intelligence Payload Missing</h1>
          <Link href="/news" className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-full text-zinc-900 dark:text-white font-google-sans font-bold hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm">
            <ArrowLeft size={16} /> Return to Desk
          </Link>
        </div>
      </>
    );
  }

  const article = JSON.parse(decodeURIComponent(encodedData));
  
  // Apply our aggressive cleaner to the raw scraped text
  const cleanContent = cleanArticleText(article.content);
  
  // Fetch related news
  const topicQuery = extractTopicFromTitle(article.title);
  const { articles: fetchedRelated } = await getEducationNews(`${topicQuery} news`);
  
  const relatedArticles = fetchedRelated
    ?.filter((a: any) => a.title !== article.title)
    .slice(0, 4) || [];

  return (
    <>
      {FontStyles}
      <div className="flex flex-col min-h-screen bg-[#fafafa] dark:bg-[#050505] font-outfit antialiased selection:bg-blue-500/20 text-zinc-900 dark:text-zinc-100">
        <DashboardNavbar userEmail="Operator" />

        <main className="flex-1 w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 py-10 lg:py-16">

          {/* BACK NAVIGATION */}
          <Link
            href="/news"
            className="inline-flex items-center gap-2.5 font-google-sans text-[12px] font-bold uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors mb-12 group outline-none w-fit"
          >
            <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 group-hover:border-zinc-300 dark:group-hover:border-zinc-600 flex items-center justify-center transition-all shadow-sm">
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            Back to Headlines
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

            {/* MAIN ARTICLE (Left Column) */}
            <div className="lg:col-span-8 flex flex-col">

              {/* Editorial Header */}
              <header className="space-y-6 mb-12">
                <div className="flex flex-wrap items-center gap-3 font-google-sans text-[12px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <span className="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3.5 py-1.5 rounded-lg border border-blue-200/50 dark:border-blue-500/20">
                    {article.source?.name || 'Global News'}
                  </span>
                  <span className="flex items-center gap-1.5 ml-1">
                    <Clock size={14} /> {formatDate(article.publishedAt)}
                  </span>
                  {article.author && (
                    <>
                      <span className="text-zinc-300 dark:text-zinc-700 mx-1">•</span>
                      <span className="truncate max-w-[250px]">By {article.author}</span>
                    </>
                  )}
                </div>

                <h1 className="font-google-sans text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold text-zinc-900 dark:text-white tracking-tight leading-[1.1] text-balance">
                  {article.title}
                </h1>

                <p className="text-[18px] sm:text-[21px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed max-w-[75ch]">
                  {article.description}
                </p>
              </header>

              {/* Hero Image */}
              {article.urlToImage && (
                <div className="w-full aspect-[16/9] sm:aspect-[2/1] bg-zinc-100 dark:bg-[#111113] mb-12 rounded-[2rem] overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={article.urlToImage} 
                    alt={article.title} 
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                </div>
              )}

              {/* Article Body */}
              <article className="relative max-w-[75ch]">
                {/* Clean, perfectly spaced body typography */}
                <div className="font-outfit text-[17px] sm:text-[19px] font-medium text-zinc-800 dark:text-zinc-300 leading-[1.8] whitespace-pre-wrap">
                  {cleanContent}
                </div>

                {/* Prominent CTA to Read Full Article */}
                <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white dark:bg-[#0c0c0e] p-6 sm:p-8 rounded-[2rem] shadow-sm border border-zinc-100 dark:border-zinc-800/50">
                  <div className="space-y-1.5 text-center sm:text-left">
                    <h3 className="font-google-sans font-bold text-zinc-900 dark:text-white text-lg tracking-tight">Access Full Report</h3>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Continue reading the complete technical breakdown on the publisher's site.</p>
                  </div>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-google-sans font-bold text-[15px] transition-all shadow-[0_8px_30px_rgba(37,99,235,0.25)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.35)] active:scale-95 hover:-translate-y-0.5 outline-none shrink-0 w-full sm:w-auto justify-center"
                  >
                    Open Source
                    <ExternalLink size={18} />
                  </a>
                </div>
              </article>
            </div>

            {/* SIDEBAR: Related Articles (Right Column) */}
            <aside className="lg:col-span-4">
              <div className="sticky top-28 flex flex-col gap-8">
                
                {/* Sidebar Header */}
                <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm">
                    <TrendingUp size={18} className="text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <h3 className="font-google-sans text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                    Related Context
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  {relatedArticles.length > 0 ? relatedArticles.map((relArticle: any, idx: number) => (
                    <Link
                      key={idx}
                      href={`/news/article?data=${safeStringify(relArticle)}`}
                      className="group flex flex-col items-start gap-4 p-6 sm:p-7 rounded-[2rem] bg-white dark:bg-[#0c0c0e] transition-all duration-300 border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-zinc-700 hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.2)] hover:-translate-y-1"
                    >
                      {relArticle.urlToImage && (
                        <div className="w-full aspect-[16/9] bg-zinc-100 dark:bg-[#111113] rounded-2xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={relArticle.urlToImage}
                            alt={relArticle.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-col flex-1 space-y-3 min-w-0 w-full px-1">
                        <div className="flex items-center gap-2 font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                          <span className="text-blue-600 dark:text-blue-400 truncate max-w-[140px]">{relArticle.source?.name || 'News'}</span>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <span>{formatDate(relArticle.publishedAt)}</span>
                        </div>
                        
                        <h4 className="font-google-sans text-[18px] font-bold text-zinc-900 dark:text-zinc-100 leading-[1.3] tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-3">
                          {relArticle.title}
                        </h4>
                        
                        <p className="text-[14.5px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed line-clamp-2">
                          {relArticle.description}
                        </p>
                      </div>
                      
                      <div className="w-full pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between opacity-70 group-hover:opacity-100 transition-opacity">
                        <span className="font-google-sans text-[11px] font-bold text-zinc-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 uppercase tracking-[0.2em] transition-colors">
                          Analyze
                        </span>
                        <div className="w-7 h-7 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-300">
                          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  )) : (
                    <div className="py-12 text-center bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 rounded-[2rem] shadow-sm">
                      <p className="font-google-sans text-[14px] font-bold text-zinc-500 dark:text-zinc-400">No related context available.</p>
                    </div>
                  )}
                </div>
                
              </div>
            </aside>

          </div>
        </main>
      </div>
    </>
  )
}