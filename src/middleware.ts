import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

// Páginas públicas del área de estudiantes/profesores.
const STUDENT_PUBLIC = ['/mi-cuenta/entrar', '/mi-cuenta/registro']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabase, supabaseResponse } = await createMiddlewareClient(request)

  // Validate session (server round-trip — required for SSR auth)
  const { data: { user } } = await supabase.auth.getUser()

  // ── Área de estudiantes / profesores (/mi-cuenta) ──────────────────────────
  if (pathname.startsWith('/mi-cuenta')) {
    const isPublic = STUDENT_PUBLIC.includes(pathname)
    if (!user && !isPublic) {
      return NextResponse.redirect(new URL('/mi-cuenta/entrar', request.url))
    }
    if (user && isPublic) {
      return NextResponse.redirect(new URL('/mi-cuenta', request.url))
    }
    return supabaseResponse
  }

  // ── Portal de empleados (/portal) ──────────────────────────────────────────
  // No session → redirect to login (except when already on login page)
  if (!user && pathname !== '/portal/login') {
    return NextResponse.redirect(new URL('/portal/login', request.url))
  }

  // Session present on login page → redirect to dashboard
  if (user && pathname === '/portal/login') {
    return NextResponse.redirect(new URL('/portal/dashboard', request.url))
  }

  // Authenticated on a portal page: must be an employee; admins gate on /portal/admin.
  if (user && pathname.startsWith('/portal') && pathname !== '/portal/login') {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: employee } = await supabaseAdmin
      .from('employees')
      .select('role')
      .eq('id', user.id)
      .single()

    // A non-employee (e.g. a student/teacher) doesn't belong in the staff portal.
    if (!employee) {
      return NextResponse.redirect(new URL('/mi-cuenta', request.url))
    }
    if (pathname.startsWith('/portal/admin') && employee.role !== 'admin') {
      return NextResponse.redirect(new URL('/portal/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/portal/:path*', '/mi-cuenta/:path*'],
}
