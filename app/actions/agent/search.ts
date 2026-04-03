import { SERPER_KEYS, TAVILY_KEYS } from './providers';

// ==========================================
// DEEP URL SCRAPER (Mimicking Python's requests + regex)
// ==========================================
async function scrapePage(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (resp.ok) {
      let text = await resp.text();
      
      // 🚀 TRAFILATURA-STYLE AGGRESSIVE CLEANING
      // 1. Remove all JS, CSS, Hidden elements, Navs, Footers, and Ads
      text = text.replace(/<(script|style|aside|nav|footer|header|iframe|noscript|video|audio|form|button)[^>]*>[\s\S]*?<\/\1>/gi, '');
      text = text.replace(/<(object|embed|canvas|svg|blockquote|figcaption|summary|details)[^>]*>[\s\S]*?<\/\1>/gi, '');
      
      // 2. Remove common junk classes/ids (Ads, Sidebar, Menu, Related)
      text = text.replace(/<(div|section|span|p)[^>]*(id|class)=["'][^"']*(advert|side|menu|social|footer|related|share|widget|popup)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi, '');

      // 3. Strip all HTML tags
      text = text.replace(/<[^>]+>/g, ' ');
      
      // 4. Normalize whitespace and trim
      text = text.replace(/\s+/g, ' ').trim();
      
      // 5. Check if we actually have meaningful content
      if (text.length < 200) return "";
      
      // 6. Return high-depth context (4000 chars)
      return text.substring(0, 4000);
    }
  } catch (e) {
    return "";
  }
  return "";
}

// ==========================================
// DUAL-ENGINE SEARCH (Tavily + Serper)
// ==========================================
export async function runRobustSearch(query: string, maxResults: number = 5): Promise<string> {
  console.log(`\n🌐 [DUAL-ENGINE DEEP SEARCH INITIATED] Query: '${query}'`);
  
  let formattedReport = `# 🔍 COMPREHENSIVE SEARCH INTELLIGENCE REPORT FOR '${query}'\n\n`;
  let hasResults = false;

  // --- 1. FETCH TAVILY (ROUND ROBIN ON FAILURE) ---
  if (TAVILY_KEYS.length > 0) {
    for (const tavilyKey of TAVILY_KEYS) {
        try {
          const resp = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: tavilyKey,
              query: query,
              search_depth: "advanced",
              include_answer: true,
              include_raw_content: true,
              max_results: maxResults
            })
          });
    
          if (resp.ok) {
            const data = await resp.json();
            if (data.results?.length > 0 || data.answer) {
              hasResults = true;
              console.log(`✅ [TAVILY HIT] Retrieved deep results with key ending in ${tavilyKey.slice(-4)}.`);
              formattedReport += "## 🧠 ENGINE 1: TAVILY ADVANCED AI SEARCH\n\n";
    
              if (data.answer) {
                const shortAns = data.answer.length > 1500 ? data.answer.substring(0, 1500) + "..." : data.answer;
                formattedReport += `**🤖 AI Web Summary:**\n${shortAns}\n\n`;
              }
    
              data.results?.forEach((r: any, i: number) => {
                const cleanUrl = r.url.split("?utm_")[0].split("?ranMID=")[0];
                let content = r.raw_content || r.content || '';
                content = content.replace(/\s+/g, ' ');
                if (content.length > 3000) content = content.substring(0, 3000) + "...";
                formattedReport += `### [Citation ${i + 1}] ${r.title}\n**URL:** ${cleanUrl}\n**Content:** ${content}\n${'-'.repeat(50)}\n\n`;
              });
              break; // Success! Exit key loop
            }
          }
        } catch (e: any) {
          console.warn(`⚠️ Tavily key cycle failure: ${e.message?.substring(0, 40)}`);
          continue; // Try next key
        }
    }
  }

  // --- 2. FETCH SERPER (ROUND ROBIN ON FAILURE) ---
  if (SERPER_KEYS.length > 0) {
    for (const serperKey of SERPER_KEYS) {
        try {
          const resp = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: query, num: maxResults })
          });
    
          if (resp.ok) {
            const data = await resp.json();
            const organic = data.organic || [];
            
            if (organic.length > 0) {
              hasResults = true;
              console.log(`✅ [SERPER HIT] Retrieved ${organic.length} results with key ending in ${serperKey.slice(-4)}.`);
              formattedReport += "## 🌐 ENGINE 2: GOOGLE SEARCH (WITH DEEP SCRAPE)\n\n";
    
              if (data.answerBox && data.answerBox.snippet) {
                formattedReport += `**⚡ Quick Answer:** ${data.answerBox.snippet}\n\n`;
              }
    
              for (let i = 0; i < Math.min(organic.length, maxResults); i++) {
                const r = organic[i];
                const idx = i + maxResults + 1;
                const title = r.title || 'No Title';
                const link = r.link || 'No URL';
                const snippet = r.snippet || 'No Snippet';
                
                console.log(`    ↳ Scraping: ${link}`);
                const pageContent = await scrapePage(link);
                const finalContent = pageContent.length > 100 ? pageContent : snippet;
                
                formattedReport += `### [Citation ${idx}] ${title}\n**URL:** ${link}\n**Content:** ${finalContent}\n${'-'.repeat(50)}\n\n`;
              }
              break; // Success! Exit key loop
            }
          }
        } catch (e: any) {
          console.warn(`⚠️ Serper key cycle failure: ${e.message?.substring(0, 40)}`);
          continue; // Try next key
        }
    }
  }

  if (!hasResults) {
    return `⚠️ No live results found for '${query}'. Try using a different keyword combination.`;
  }
  
  return formattedReport;
}