import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabase, supabaseResponse } = await createMiddlewareClient(request)

  // Validate session (server round-trip — required for SSR auth)
  const { data: { user } } = await supabase.auth.getUser()

  // No session → redirect to login (except when already on login page)
  if (!user && pathname !== '/portal/login') {
    return NextResponse.redirect(new URL('/portal/login', request.url))
  }

  // Session present on login page → redirect to dashboard
  if (user && pathname === '/portal/login') {
    return NextResponse.redirect(new URL('/portal/dashboard', request.url))
  }

  // Admin-only routes: check role
  if (user && pathname.startsWith('/portal/admin')) {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: employee } = await supabaseAdmin
      .from('employees')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!employee || employee.role !== 'admin') {
      return NextResponse.redirect(new URL('/portal/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/portal/:path*'],
}
