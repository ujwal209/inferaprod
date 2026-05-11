'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getLaunchDate() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'launch_date')
    .single()

  if (error || !data) {
    // Safe fallback to 7 days from right now if the DB fails
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  
  return data.value;
}

export async function updateLaunchDate(newDateIso: string) {
  const supabase = await createClient()
  
  // NOTE: You should add an admin auth check here in production!
  
  const { error } = await supabase
    .from('app_settings')
    .upsert({ 
      key: 'launch_date', 
      value: newDateIso, 
      updated_at: new Date().toISOString() 
    })

  if (error) {
    return { error: error.message }
  }

  // Revalidate the launch page cache so the timer updates immediately for all users
  revalidatePath('/launch') 
  return { success: true }
}