'use server'

// Combine env variables (if any) with your hardcoded fallback keys
const TAVILY_KEYS = [
  process.env.TAVILY_API_KEY,
  "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",
  "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",
  "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",
  "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"
].filter(Boolean) as string[];

export async function getEducationNews(searchQuery?: string) {
  if (TAVILY_KEYS.length === 0) {
    console.error("Tavily API Keys are missing!");
    return { success: false, error: "Missing API Key", articles: [] };
  }

  // Default to education news if no specific query is passed
  const activeQuery = (searchQuery && searchQuery.trim() !== '') 
    ? searchQuery 
    : 'education technology OR edtech OR university breakthroughs';

  let lastError = "Unknown error occurred";

  // Round-robin through the keys in case one is out of credits
  for (const apiKey of TAVILY_KEYS) {
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: activeQuery,
          topic: "news",
          days: 14, // Fetch news from the last 14 days
          max_results: 20,
          include_images: true,
          search_depth: "advanced"
        }),
        cache: 'no-store' // Keep the feed fresh
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Tavily failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Map Tavily's response shape to match what your UI already expects
      const validArticles = (data.results || []).map((article: any, index: number) => {
        // Extract source name safely from URL
        let sourceName = 'News Source';
        try {
          if (article.url) sourceName = new URL(article.url).hostname.replace('www.', '');
        } catch (e) {}

        return {
          title: article.title || 'Untitled Report',
          description: article.content ? article.content.substring(0, 250) + '...' : 'No description available.',
          content: article.content || '',
          url: article.url || '#',
          // Tavily provides a flat images array that matches the result order
          urlToImage: article.image_url || (data.images && data.images[index]) || null,
          publishedAt: article.published_date || new Date().toISOString(),
          source: { name: sourceName },
          author: null, // Tavily doesn't explicitly extract author in news endpoint
        };
      });

      return { success: true, articles: validArticles };

    } catch (error: any) {
      console.error(`Tavily Fetch Error (Key starting with ${apiKey.substring(0, 8)}...):`, error.message);
      lastError = error.message;
      // Loop continues to the next key if this one fails
    }
  }

  // If we exhaust all keys and still fail
  return { success: false, error: lastError, articles: [] };
}