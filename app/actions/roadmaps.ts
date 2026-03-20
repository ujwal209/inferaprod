'use server'

import { supabaseAdmin } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// 1. Fetch all roadmaps for the Catalog
export async function getGlobalRoadmaps(userId: string) {
  try {
    const { data: roadmaps, error: rmError } = await supabaseAdmin
      .from('roadmaps')
      .select('*')
      .order('created_at', { ascending: false })

    if (rmError) throw rmError

    const { data: userProgress, error: upError } = await supabaseAdmin
      .from('user_roadmaps')
      .select('roadmap_id, progress, status')
      .eq('user_id', userId)

    if (upError) throw upError

    const progressMap = new Map(userProgress?.map(p => [p.roadmap_id, p]) || [])

    const processedRoadmaps = roadmaps?.map(rm => {
      const userState = progressMap.get(rm.id)
      return {
        ...rm,
        isEnrolled: !!userState,
        progress: userState?.progress || 0,
        status: userState?.status || 'unstarted'
      }
    })

    return { success: true, roadmaps: processedRoadmaps || [] }
  } catch (error: any) {
    console.error("Error fetching library:", error)
    return { success: false, error: error.message, roadmaps: [] }
  }
}

// 2. Fetch a single Roadmap's Details & Curriculum
export async function getRoadmapDetails(roadmapId: string, userId: string) {
  // Guard against undefined IDs
  if (!roadmapId || !userId) {
    return { success: false, error: 'Missing IDs', roadmap: null, enrollment: null }
  }

  try {
    const { data: roadmap, error: rmError } = await supabaseAdmin
      .from('roadmaps')
      .select('*')
      .eq('id', roadmapId)
      .single()

    if (rmError) throw rmError

    // 🚨 IMPORTANT: Use .maybeSingle() instead of .single()
    // This prevents a crash if the user hasn't enrolled yet
    const { data: userProgress, error: upError } = await supabaseAdmin
      .from('user_roadmaps')
      .select('progress, status')
      .eq('roadmap_id', roadmapId)
      .eq('user_id', userId)
      .maybeSingle()

    if (upError) throw upError

    return { 
      success: true, 
      roadmap, 
      enrollment: userProgress || null 
    }
  } catch (error: any) {
    // Force stringify so Next.js doesn't swallow the error into {}
    console.error("Detailed Fetch Error:", JSON.stringify(error, null, 2))
    return { success: false, error: error?.message || "Failed to fetch", roadmap: null, enrollment: null }
  }
}

// 3. Action to Enroll and Auto-Redirect
export async function enrollInRoadmap(formData: FormData) {
  const roadmapId = formData.get('roadmapId') as string
  const userId = formData.get('userId') as string

  if (!roadmapId || !userId) return { error: 'Missing parameters' }

  const { error } = await supabaseAdmin
    .from('user_roadmaps')
    .upsert({ user_id: userId, roadmap_id: roadmapId, progress: 0, status: 'active' })

  if (error) {
    console.error("Enrollment error:", error)
    return { error: error.message }
  }
  
  // Purge the cache and instantly redirect them into the course!
  revalidatePath('/dashboard/roadmaps')
  redirect(`/dashboard/roadmaps/${roadmapId}`)
}