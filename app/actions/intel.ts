'use server'

export async function getEngineeringIntel(targetDomain: string, interests: string[]) {
  try {
    // Construct a highly targeted query based on the user's profile
    const domainQuery = targetDomain || 'engineering'
    const interestQuery = interests.length > 0 ? interests.join(' ') : 'technology breakthroughs'
    const finalQuery = `latest news breakthroughs 2026 ${domainQuery} ${interestQuery}`

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.NEXT_PUBLIC_TAVILY_API_KEY, // Or process.env.TAVILY_API_KEY
        query: finalQuery,
        search_depth: "advanced",
        topic: "news",
        max_results: 5,
        days: 14 // Get only recent high-value intel
      }),
      // Cache this fetch for 1 hour (3600 seconds) so we don't spam the API on every page reload
      next: { revalidate: 3600 } 
    })

    if (!response.ok) {
      throw new Error('Failed to fetch from Tavily')
    }

    const data = await response.json()
    return { success: true, results: data.results || [] }
    
  } catch (error: any) {
    console.error("Intel Fetch Error:", error)
    return { success: false, error: error.message }
  }
}