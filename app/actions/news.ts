'use server'

export async function getIntelligenceFeed(domain: string = 'Software') {
  const apiKey = process.env.NEXT_PUBLIC_TAVILY_API_KEY;
  
  if (!apiKey) {
    console.error("TAVILY_API_KEY is missing");
    return { news: [], error: "System Configuration Error" };
  }

  // Smarter query that works for ALL domains (AI, Backend, Civil, etc.)
  const query = `latest ${domain} technology trends and news 2026`;

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "advanced",
        max_results: 6, // Keep it lean for faster loads
        include_answer: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.detail || "Failed to fetch news");

    const formattedNews = data.results.map((item: any) => ({
      title: item.title,
      url: item.url,
      content: item.content,
      source: new URL(item.url).hostname.replace('www.', '')
    }));

    return { news: formattedNews, error: null };
  } catch (error: any) {
    console.error("News Fetch Error:", error);
    return { news: [], error: error.message };
  }
}