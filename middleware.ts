import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SESSION_COOKIE = 'bc_session'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Routes that require being logged in
const PROTECTED_ROUTES = ['/checkout', '/order', '/my-orders']

// Routes that require admin role
const ADMIN_ROUTES = ['/admin']

// Routes only for guests (logged-in users get redirected away)
const GUEST_ONLY_ROUTES = ['/auth/login', '/auth/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? null

  // ── Resolve user identity ─────────────────────────────────────────────────
  let userId: string | null = null
  let isAdmin = false

  if (token) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })

      const { data: { user } } = await supabase.auth.getUser(token)

      if (user) {
        userId = user.id

        // Check admin status
        const { data: adminRow } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        isAdmin = !!adminRow
      }
    } catch {
      // Invalid token — treat as logged out
    }
  }

  const isLoggedIn = !!userId

  // ── Guest-only routes — redirect logged-in users ──────────────────────────
  if (GUEST_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
    if (isLoggedIn) {
      const dest = isAdmin ? '/admin/dashboard' : '/'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  // ── Admin routes — require admin role ────────────────────────────────────
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    if (!isAdmin) {
      // Logged in but not admin — send to homepage
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // ── Protected customer routes — require login ────────────────────────────
  if (PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Public image/font files
     */
    '/((?!_next/static|_next/image|favicon|robots|sitemap|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf)$).*)',
  ],
}
