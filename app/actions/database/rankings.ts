'use server'

import { createClient } from '@/utils/supabase/server'

export async function getNirfRankings({
  type = 'engineering',
  page = 1,
  pageSize = 10,
  search = '',
  state = ''
}: {
  type?: 'engineering' | 'university'
  page?: number
  pageSize?: number
  search?: string
  state?: string
}) {
  const supabase = await createClient()
  const table = type === 'engineering' ? 'nirf_rankings_engineering' : 'nirf_rankings_university'
  const rankColumn = type === 'engineering' ? 'rank' : 'ranking'
  
  let query = supabase
    .from(table)
    .select('*', { count: 'exact' })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  if (state && state !== 'all') {
    query = query.eq('state', state)
  }

  // To handle numerical sorting on text columns like '1', '2', '10', '20'
  // we fetch a larger batch and sort in-memory for the current UX.
  // This is a common workaround when DB schema uses TEXT for rankings.
  const { data: allData, error } = await query
    .order(rankColumn, { ascending: true })
    .limit(1000)

  if (error) {
    console.error(`Error fetching NIRF ${type} rankings:`, error)
    return { data: [], count: 0, error: error.message }
  }

  // Numerical natural sort
  const sortedData = [...(allData || [])].sort((a, b) => {
    const valA = parseInt(a[rankColumn]) || 9999
    const valB = parseInt(b[rankColumn]) || 9999
    return valA - valB
  })

  // Manual pagination on the sorted set
  const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize)

  return { 
    data: paginatedData, 
    count: sortedData.length, 
    error: null 
  }
}

export async function getRankingStates(type: 'engineering' | 'university') {
  const supabase = await createClient()
  const table = type === 'engineering' ? 'nirf_rankings_engineering' : 'nirf_rankings_university'
  
  const { data, error } = await supabase
    .from(table)
    .select('state')
    .not('state', 'is', null)

  if (error) {
    console.error(`Error fetching NIRF ${type} states:`, error)
    return { data: [], error: error.message }
  }

  const uniqueStates = Array.from(new Set(data.map((u: any) => u.state))).sort() as string[]
  return { data: uniqueStates, error: null }
}
