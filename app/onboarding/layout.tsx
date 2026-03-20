import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // 1. Verify Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // 2. Check Onboarding Status (using Admin client to bypass RLS)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  // 3. 🚨 THE GUARD: If already completed, force them to the dashboard
  if (profile?.onboarding_completed) {
    redirect('/dashboard')
  }

  // Otherwise, render the Onboarding page
  return <>{children}</>
}