import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { DashboardNavbar } from '@/components/dashboard/dashboard-navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Standard Client: Reads cookies to securely verify WHO the user is
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // 2. Admin Client: Bypasses RLS to read the profile data
  // Added 'avatar_url' to the select query to fetch the profile picture
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('onboarding_completed, avatar_url')
    .eq('id', user.id)
    .single()

  // Deflect to onboarding if not completed (or if profile row doesn't exist yet)
  if (!profile?.onboarding_completed) {
    redirect('/onboarding')
  }

  // Grab the avatar from the profile table, or fallback to the auth metadata (e.g. Google login)
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null

  // Render Dashboard
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#09090b]">
      <DashboardNavbar userEmail={user.email} avatarUrl={avatarUrl} />
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  )
}