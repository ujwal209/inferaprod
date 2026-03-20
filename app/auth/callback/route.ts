import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // The 'next' param is used to redirect the user to their intended destination 
  // after logging in. If it's not present, we default to the dashboard.
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    
    // This securely exchanges the temporary code for a long-lasting session cookie
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Success! Send them to the dashboard (or their intended destination)
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    } else {
      // If the exchange fails, log it and send them back to login with an error
      console.error("Auth callback error:", error.message)
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin))
    }
  }

  // If no code was found in the URL, someone probably just navigated here manually.
  // Send them back to the login page.
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}