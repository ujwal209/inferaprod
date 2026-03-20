'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { sendOtpEmail } from '@/utils/email'
import { redirect } from 'next/navigation'

// Admin client for bypassing RLS to create profiles during signup
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ------------------------------------------------------------------
// 1. GENERATE OTP (Email & Password Signup)
// ------------------------------------------------------------------
export async function initiateSignup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      data: { full_name: name }
    })

    if (error) return { error: error.message }

    const otp = data.properties?.email_otp
    if (!otp) return { error: "Failed to generate security token." }

    await sendOtpEmail(email, otp, 'signup')

    // Prepare profile early
    await supabaseAdmin.from('profiles').upsert({ id: data.user.id, email, full_name: name })

    return { success: true, email }
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred." }
  }
}

// ------------------------------------------------------------------
// 2. VERIFY OTP
// ------------------------------------------------------------------
export async function verifySignupOtp(email: string, otp: string) {
  const supabase = await createServerClient()
  
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'signup'
  })

  if (error) return { error: "Invalid or expired code." }
  return { success: true }
}

// ------------------------------------------------------------------
// 3. GOOGLE OAUTH SIGNUP
// ------------------------------------------------------------------
export async function signupWithGoogleAction() {
  const supabase = await createServerClient()
  
  // HARDCODED PRODUCTION URL
  // This physically forces Supabase to use the prod URL.
  const origin = 'https://inferacore.vercel.app'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Must exactly match the redirect URL configured in Google Cloud & Supabase
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

  // Redirect the user to the Google Authentication screen
  if (data.url) {
    redirect(data.url)
  }
}