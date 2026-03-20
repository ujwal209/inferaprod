'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin' // Using the Admin client
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function completeOnboardingAction(formData: FormData) {
  // 1. Standard Client: Used strictly to verify WHO is making the request securely
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized access. Authentication required.' }
  }

  // Extract and format array fields
  const rawSkills = formData.get('skills') as string
  const rawInterests = formData.get('core_interests') as string
  
  const skills = rawSkills ? rawSkills.split(',').map(s => s.trim()).filter(Boolean) : []
  const coreInterests = rawInterests ? rawInterests.split(',').map(s => s.trim()).filter(Boolean) : []

  // 2. Admin Client: Bypasses RLS to force the database write
  const { error } = await supabaseAdmin.from('profiles').upsert({
    id: user.id,
    email: user.email!, // Keep email synced with auth
    full_name: formData.get('full_name') as string,
    avatar_url: formData.get('avatar_url') as string,
    college_name: formData.get('college_name') as string,
    degree: formData.get('degree') as string,
    graduation_year: parseInt(formData.get('graduation_year') as string) || null,
    current_semester: parseInt(formData.get('current_semester') as string) || null,
    target_domain: formData.get('target_domain') as string,
    skills: skills,
    core_interests: coreInterests,
    onboarding_completed: true,
    updated_at: new Date().toISOString()
  })

  if (error) {
    console.error("Supabase Admin Upsert Error:", error)
    return { error: error.message }
  }

  // 3. Revalidate the dashboard layout to trigger the updated state and redirect
  revalidatePath('/dashboard')
  redirect('/dashboard')
}