import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isDashboard = pathname.startsWith('/dashboard')
  const isOnboarding = pathname.startsWith('/onboarding')
  const isPractice = pathname.startsWith('/practice')

  // Unauthenticated: protect dashboard + onboarding + practice
  if (!user && (isDashboard || isOnboarding || isPractice)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated: redirect away from auth pages
  if (user && isAuthPage) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // Authenticated on dashboard: check if onboarding is needed
  if (user && isDashboard) {
    const onboardingCookie = request.cookies.get('onboarding_complete')
    if (!onboardingCookie) {
      // Check enrollment count via Supabase
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll() },
            setAll() {},
          },
        }
      )
      const { count } = await supabase
        .from('course_enrollment')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true)

      if ((count ?? 0) === 0) {
        const onboardingUrl = request.nextUrl.clone()
        onboardingUrl.pathname = '/onboarding/basics'
        return NextResponse.redirect(onboardingUrl)
      }

      // Set cookie to skip DB check on future requests
      const response = supabaseResponse
      response.cookies.set('onboarding_complete', '1', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
      return response
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
