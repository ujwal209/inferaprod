'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export async function logoutAction() {
  const supabase = await createClient()
  
  // Destroys the secure cookie session
  await supabase.auth.signOut()
  
  redirect('/auth/login')
}