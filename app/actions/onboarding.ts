'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin' // Using the Admin client
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function completeOnboardingAction(formData: FormData, isSkip: boolean = false) {
  // 1. Standard Client: Used strictly to verify WHO is making the request securely
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized access. Authentication required.' }
  }

  let updatePayload: any = {
    id: user.id,
    email: user.email!, // Keep email synced with auth
    onboarding_completed: true,
    updated_at: new Date().toISOString()
  };

  // If the user skipped, we only save minimal info to get them past the gate.
  if (isSkip) {
    updatePayload.full_name = formData.get('full_name') || 'Explorer';
    updatePayload.role = 'student'; // Default role
  } else {
    // Extract and format array fields if they didn't skip
    const rawSkills = formData.get('skills') as string
    const rawInterests = formData.get('core_interests') as string
    
    const skills = rawSkills ? rawSkills.split(',').map(s => s.trim()).filter(Boolean) : []
    const coreInterests = rawInterests ? rawInterests.split(',').map(s => s.trim()).filter(Boolean) : []

    const role = formData.get('role') as string || 'student'

    updatePayload = {
        ...updatePayload,
        full_name: formData.get('full_name') as string,
        avatar_url: formData.get('avatar_url') as string,
        role: role,
        college_name: role === 'student' ? (formData.get('college_name') as string) : null,
        degree: role === 'student' ? (formData.get('degree') as string) : null,
        graduation_year: role === 'student' ? (parseInt(formData.get('graduation_year') as string) || null) : null,
        current_semester: role === 'student' ? (parseInt(formData.get('current_semester') as string) || null) : null,
        target_domain: formData.get('target_domain') as string,
        skills: skills,
        core_interests: coreInterests,
    }
  }

  // 2. Admin Client: Bypasses RLS to force the database write
  const { error } = await supabaseAdmin.from('profiles').upsert(updatePayload)

  if (error) {
    console.error("Supabase Admin Upsert Error:", error)
    return { error: error.message }
  }

  // 3. Revalidate the dashboard layout to trigger the updated state and redirect
  revalidatePath('/dashboard')
  redirect('/dashboard')
}