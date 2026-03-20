'use server'

import { createClient } from '@/utils/supabase/server'

export async function getAllUniversities({
  page = 1,
  pageSize = 10,
  search = '',
  state = ''
}: {
  page?: number
  pageSize?: number
  search?: string
  state?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('all_universities')
    .select('*', { count: 'exact' })

  if (search) {
    query = query.or(`name.ilike.%${search}%,aishe_code.ilike.%${search}%`)
  }

  if (state && state !== 'all') {
    query = query.eq('state', state)
  }

  const { data, count, error } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching universities:', error)
    return { data: [], count: 0, error: error.message }
  }

  return { data, count: count || 0, error: null }
}

export async function getUniversityStates() {
  const supabase = await createClient()
  
  // Use a simpler query for states
  const { data, error } = await supabase
    .from('all_universities')
    .select('state')
    .not('state', 'is', null)
    .limit(5000) // Safety limit

  if (error) {
    console.error('Error fetching university states:', error)
    return { data: [], error: error.message }
  }

  const uniqueStates = Array.from(new Set(data.map((u: any) => u.state))).sort() as string[]
  return { data: uniqueStates, error: null }
}
