'use server'

import { createClient } from '@/utils/supabase/server'

// 1. Branch Courses
export async function getBranchCourses({
  page = 1,
  pageSize = 10,
  search = '',
  branch = ''
}: {
  page?: number
  pageSize?: number
  search?: string
  branch?: string
}) {
  const supabase = await createClient()
  let query = supabase.from('branch_courses').select('*', { count: 'exact' })

  if (search) {
    query = query.or(`course_name.ilike.%${search}%,job_role.ilike.%${search}%`)
  }
  if (branch && branch !== 'all') {
    query = query.eq('branch_name', branch)
  }

  const { data, count, error } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('course_name', { ascending: true })

  return { data, count: count || 0, error }
}

// 2. Branch Job Roles
export async function getBranchJobRoles({
  page = 1,
  pageSize = 10,
  search = '',
  branch = ''
}: {
  page?: number
  pageSize?: number
  search?: string
  branch?: string
}) {
  const supabase = await createClient()
  let query = supabase.from('branch_job_roles').select('*', { count: 'exact' })

  if (search) {
    query = query.ilike('job_role', `%${search}%`)
  }
  if (branch && branch !== 'all') {
    query = query.eq('branch_name', branch)
  }

  const { data, count, error } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('job_role', { ascending: true })

  return { data, count: count || 0, error }
}

// 3. Branch Salaries
export async function getBranchSalaries({
  page = 1,
  pageSize = 10,
  search = '',
  branchValue = ''
}: {
  page?: number
  pageSize?: number
  search?: string
  branchValue?: string
}) {
  const supabase = await createClient()
  let query = supabase.from('branch_salaries').select('*', { count: 'exact' })

  if (search || branchValue) {
    query = query.ilike('branch_name', `%${search || branchValue}%`)
  }

  const { data, count, error } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('branch_name', { ascending: true })

  return { data, count: count || 0, error }
}

// 4. Branch Roadmaps
export async function getBranchRoadmaps({
  page = 1,
  pageSize = 10,
  branch = ''
}: {
  page?: number
  pageSize?: number
  branch?: string
}) {
  const supabase = await createClient()
  let query = supabase.from('branch_roadmaps').select('*', { count: 'exact' })

  if (branch && branch !== 'all') {
    query = query.eq('branch_name', branch)
  }

  const { data, count, error } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('branch_name', { ascending: true })

  return { data, count: count || 0, error }
}

// 5. Branch Technical Domains
export async function getBranchTechnicalDomains({
  page = 1,
  pageSize = 10,
  branch = ''
}: {
  page?: number
  pageSize?: number
  branch?: string
}) {
  const supabase = await createClient()
  let query = supabase.from('branch_technical_domains').select('*', { count: 'exact' })

  if (branch && branch !== 'all') {
    query = query.eq('branch_name', branch)
  }

  const { data, count, error } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('branch_name', { ascending: true })

  return { data, count: count || 0, error }
}

// Utility to get all unique branches for filtering
export async function getAvailableBranches() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('branch_categories') // Or aicte_branches
    .select('category_name')
    .order('category_name', { ascending: true })

  if (error) return { data: [], error }
  return { data: data.map((d: any) => d.category_name), error: null }
}
