'use server'

import { createClient } from '@/utils/supabase/server'

export async function getSessionUser() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Returns basic user info. Adjust 'avatar_url' based on how you store it 
  // (either in user_metadata or a separate profiles table).
  return {
    id: user.id,
    email: user.email,
    avatar_url: user.user_metadata?.avatar_url || null,
    full_name: user.user_metadata?.full_name || 'User',
  }
}