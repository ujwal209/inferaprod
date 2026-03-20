'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { sendOtpEmail } from '@/utils/email'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 1. GENERATE RECOVERY OTP
export async function initiateRecovery(formData: FormData) {
  const email = formData.get('email') as string

  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email
    })
    if (error) return { error: error.message }

    const otp = data.properties?.email_otp
    if (!otp) return { error: "Failed to generate security token." }

    await sendOtpEmail(email, otp, 'recovery')
    return { success: true, email }
  } catch (err: any) {
    return { error: err.message }
  }
}

// 2. VERIFY RECOVERY OTP (Logs the user in)
export async function verifyRecoveryOtp(email: string, otp: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'recovery'
  })
  if (error) return { error: "Invalid or expired code." }
  return { success: true }
}

// 3. UPDATE PASSWORD
export async function updatePassword(password: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { success: true }
}