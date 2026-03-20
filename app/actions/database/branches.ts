'use server'

import { createClient } from '@/utils/supabase/server'

export async function getAicteBranches({
  page = 1,
  pageSize = 10,
  search = '',
  category = ''
}: {
  page?: number
  pageSize?: number
  search?: string
  category?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('aicte_branches')
    .select('*', { count: 'exact' })

  if (search) {
    query = query.ilike('branch_name', `%${search}%`)
  }

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data, count, error } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('branch_name', { ascending: true })

  if (error) {
    console.error('Error fetching AICTE branches:', error)
    return { data: [], count: 0, error: error.message }
  }

  return { data, count: count || 0, error: null }
}

export async function getBranchCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('branch_categories')
    .select('category_name')
    .order('category_name', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return { data: [], error: error.message }
  }

  return { data: data.map((c: any) => c.category_name), error: null }
}
