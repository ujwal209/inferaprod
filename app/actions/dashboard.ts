'use server'

import { supabaseAdmin } from '@/utils/supabase/admin'

export async function getDashboardData(userId: string, targetDomain: string) {
  // 1. Safely fetch the Roadmaps count using the Admin client
  let roadmapsCount = 0
  
  try {
    const { count, error } = await supabaseAdmin
      .from('roadmaps')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (!error && count !== null) {
      roadmapsCount = count
    }
  } catch (err) {
    console.error("Failed to fetch roadmap count:", err)
    // Fails silently and defaults to 0
  }

  // 2. Fetch the Student-Targeted Intel Feed
  let newsResults: any[] = []
  let newsError = false
  
  try {
    const domainQuery = targetDomain || 'software'
    const query = `latest engineering student opportunities internships beginner breakthroughs ${domainQuery} 2026`
    
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.NEXT_PUBLIC_TAVILY_API_KEY || process.env.TAVILY_API_KEY,
        query: query,
        search_depth: "basic",
        topic: "news",
        max_results: 4, 
        days: 30
      }),
      // Cache results for 1 hour to save API credits and load instantly
      next: { revalidate: 3600 } 
    })
    
    if (res.ok) {
      const data = await res.json()
      newsResults = data.results || []
    } else {
      newsError = true
    }
  } catch (error) {
    console.error("News Fetch Failed:", error)
    newsError = true
  }

  return {
    roadmapsCount,
    newsResults,
    newsError
  }
}