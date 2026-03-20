'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// ------------------------------------------------------------------
// 1. STANDARD EMAIL/PASSWORD LOGIN
// ------------------------------------------------------------------
export async function loginAction(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Purge router cache and securely redirect to the workspace
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

// ------------------------------------------------------------------
// 2. GOOGLE OAUTH LOGIN
// ------------------------------------------------------------------
export async function loginWithGoogleAction() {
  const supabase = await createClient()
  
  // HARDCODED PRODUCTION URL
  // This physically forces Supabase to use the prod URL.
  const origin = 'https://inferacore.vercel.app'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`, 
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}