'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { sendOtpEmail } from '@/utils/email'
import { redirect } from 'next/navigation'
import twilio from 'twilio'

// Admin client for bypassing RLS to create profiles during signup
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize Twilio Client (With Safety Checks)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// Only initialize if keys exist so the server doesn't crash on build
const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

// Helper to format phone numbers (Defaults to India +91 if 10 digits)
function formatPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, '') // Strip non-digits
  if (cleaned.length === 10) return `+91${cleaned}`
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`
  return `+${cleaned}` // Fallback for other international formats
}

// ------------------------------------------------------------------
// 1. GENERATE OTP(S)
// ------------------------------------------------------------------
export async function initiateSignup(formData: FormData) {
  const email = formData.get('email') as string
  const phoneRaw = formData.get('phone') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  // Server-side validation
  if (!email && !phoneRaw) {
    return { error: "Please provide either an email or a phone number." }
  }

  const phone = phoneRaw ? formatPhone(phoneRaw) : undefined
  const response = { sentEmail: false, sentPhone: false, email, phone }

  try {
    // A. Handle Email OTP
    if (email) {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
        data: { full_name: name }
      })

      if (error) return { error: error.message }

      const otp = data.properties?.email_otp
      if (otp) {
        await sendOtpEmail(email, otp, 'signup')
        response.sentEmail = true
      } else {
        return { error: "Failed to generate email security token." }
      }
    }

    // B. Handle Phone OTP
    if (phone) {
      if (!twilioClient || !verifyServiceSid) {
        console.error("Missing Twilio Environment Variables in Next.js");
        return { error: "SMS service is currently unavailable. Please use email." };
      }

      const verification = await twilioClient.verify.v2
        .services(verifyServiceSid)
        .verifications
        .create({ to: phone, channel: 'sms' });

      if (verification.status === 'pending' || verification.status === 'approved') {
        response.sentPhone = true
      } else {
        return { error: "Failed to send SMS verification code." }
      }
    }

    return { success: true, ...response }
  } catch (err: any) {
    console.error("Signup Error:", err)
    
    // Catch specific Twilio Errors (Like 404 Not Found or 400 Bad Request)
    if (err.status === 404) {
      return { error: "Verification service not found. Check Twilio configuration." }
    }
    if (err.status === 400) {
      return { error: "Invalid phone number format." }
    }
    
    return { error: err.message || "An unexpected error occurred during signup." }
  }
}

// ------------------------------------------------------------------
// 2. VERIFY OTP & CREATE USER
// ------------------------------------------------------------------
export async function verifySignupOtp(userData: any, emailOtp?: string, phoneOtp?: string) {
  const { email, phone, password, name } = userData

  try {
    let userId = null

    // A. Verify Phone OTP (Twilio) if phone was provided
    if (phone && phoneOtp) {
      if (!twilioClient || !verifyServiceSid) {
        return { error: "SMS service configuration error." };
      }

      const verificationCheck = await twilioClient.verify.v2
        .services(verifyServiceSid)
        .verificationChecks
        .create({ to: phone, code: phoneOtp });

      if (verificationCheck.status !== 'approved') {
        return { error: "Invalid or expired SMS Verification Code." }
      }
    }

    // B. Verify Email OTP (Supabase) if email was provided
    const supabase = await createServerClient()
    if (email && emailOtp) {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: emailOtp,
        type: 'signup'
      })

      if (error) return { error: "Invalid or expired Email Verification Code." }
      userId = data.user?.id
    }

    // C. Create user from scratch if ONLY Phone was provided
    if (!email && phone) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        phone,
        password,
        phone_confirm: true,
        user_metadata: { full_name: name }
      })
      
      if (error) {
        // Handle case where phone number is already registered
        if (error.message.includes("already registered")) {
          return { error: "This phone number is already registered. Please sign in." }
        }
        return { error: error.message }
      }
      userId = data.user?.id
    }

    // D. If BOTH were provided, the user was created in Step B. Attach the verified phone now.
    if (email && phone && userId) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        phone,
        phone_confirm: true
      })
    }

    // E. Create profile entry in your custom table safely
    if (userId) {
      const profileData: any = { 
        id: userId, 
        full_name: name 
      }
      
      if (email) profileData.email = email
      if (phone) profileData.phone = phone

      const { error: profileError } = await supabaseAdmin.from('profiles').upsert(profileData)
      
      if (profileError) {
         console.error("Profile Upsert Error:", profileError)
         return { error: "Account created, but failed to setup profile. Please contact support." }
      }
    }

    // F. Log the user in if they only used Phone (Email verifyOtp auto-signs in)
    if (!email && phone) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ phone, password })
      if (signInError) return { error: signInError.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error("Verification Error:", err);
    if (err.status === 404) {
      return { error: "Invalid verification session. Please try signing up again." }
    }
    return { error: err.message || "Verification failed." }
  }
}

// ------------------------------------------------------------------
// 3. GOOGLE OAUTH SIGNUP
// ------------------------------------------------------------------
export async function signupWithGoogleAction() {
  const supabase = await createServerClient()
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

  if (error) return { error: error.message }
  if (data.url) redirect(data.url)
}