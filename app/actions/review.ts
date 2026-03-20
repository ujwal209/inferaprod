'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReview(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('You must be logged in to submit a review.')
  }

  const rating = Number(formData.get('rating'))
  const headline = formData.get('headline') as string
  const experience_description = formData.get('experience_description') as string
  const professional_review = formData.get('professional_review') as string

  // current_role removed from validation
  if (!rating || !headline || !professional_review) {
    throw new Error('Please fill in all required fields.')
  }

  const { error } = await supabase
    .from('reviews')
    .insert({
      user_id: user.id,
      rating,
      headline,
      experience_description,
      professional_review
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/review')
  return { success: true }
}