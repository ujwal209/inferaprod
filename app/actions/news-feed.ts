'use server'

import { env } from 'process'

/**
 * Normalizes Tavily's search results to match the existing NewsAPI frontend structure
 */
function normalizeTavilyResults(tavilyResults: any[]) {
  if (!tavilyResults || !Array.isArray(tavilyResults)) return [];
  
  return tavilyResults.map(result => ({
    title: result.title || 'Untitled Article',
    description: result.content?.substring(0, 200) + '...' || 'No description available.',
    content: result.raw_content || result.content || 'Content restricted by publisher.',
    url: result.url,
    urlToImage: result.image_url || null, // Tavily returns image_url (if available via specific flags or luck)
    publishedAt: result.published_date || new Date().toISOString(),
    source: { name: new URL(result.url).hostname.replace('www.', '') },
    author: null,
  }));
}

export async function getEducationNews(searchQuery?: string) {
  // Extract and split comma-separated Tavily keys
  const rawKeys = process.env.NEXT_PUBLIC_TAVILY_API_KEYS || process.env.NEXT_PUBLIC_TAVILY_API_KEY || '';
  const TAVILY_KEYS = rawKeys.split(',').map(k => k.trim()).filter(k => k);
  
  if (TAVILY_KEYS.length === 0) {
    console.error("TAVILY_API_KEYS is missing in your .env file.");
    return { success: false, error: "API Key Configuration Error", articles: [] };
  }

  const activeQuery = (searchQuery && searchQuery.trim() !== '') 
    ? `${searchQuery} engineering technology news` 
    : 'software engineering technology news';

  // Randomly select a key for load balancing (similar to your python setup)
  const selectedKey = TAVILY_KEYS[Math.floor(Math.random() * TAVILY_KEYS.length)];

  try {
    const payload = {
      api_key: selectedKey,
      query: activeQuery,
      search_depth: "advanced",
      topic: "news", // Tells Tavily to prioritize recent news articles
      include_images: true, // Attempt to pull hero images
      include_raw_content: true, // Pull deep content for the detail page
      days: 7, // Restrict to news from the last 7 days
      max_results: 20
    };

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: 'no-store' // News changes constantly, avoid hard caching
    });

    if (!res.ok) {
      throw new Error(`Tavily API failed with status: ${res.status}`);
    }

    const data = await res.json();
    
    // Convert Tavily shape to Frontend shape
    let validArticles = normalizeTavilyResults(data.results || []);

    // Filter out articles that completely lack imagery (to keep the UI looking premium)
    // Note: Tavily 'include_images' doesn't guarantee every result has an image attached directly to the object.
    // If you find the UI is empty, you can remove this filter and let the fallback gray box render.
    // validArticles = validArticles.filter(a => a.urlToImage !== null);

    return { success: true, articles: validArticles };

  } catch (error: any) {
    console.error("News Fetch Error:", error);
    return { success: false, error: error.message, articles: [] };
  }
}