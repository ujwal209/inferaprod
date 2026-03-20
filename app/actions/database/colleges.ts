'use server'

import { createClient } from '@/utils/supabase/server'

export async function getEngineeringColleges({
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
    .from('engineering_colleges')
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
    console.error('Error fetching colleges:', error)
    return { data: [], count: 0, error: error.message }
  }

  return { data, count: count || 0, error: null }
}

export async function getCollegeStates() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('engineering_colleges')
    .select('state')
    .not('state', 'is', null)
    .limit(5000)

  if (error) {
    console.error('Error fetching college states:', error)
    return { data: [], error: error.message }
  }

  const uniqueStates = Array.from(new Set(data.map((u: any) => u.state))).sort() as string[]
  return { data: uniqueStates, error: null }
}
