import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { LEGACY_SESSION_COOKIE, SESSION_COOKIE } from '@/lib/auth-constants'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Routes that require being logged in
const PROTECTED_ROUTES = ['/checkout', '/order', '/my-orders']

// Routes that require admin role
const ADMIN_ROUTES = ['/admin']

// Routes only for guests (logged-in users get redirected away)
const GUEST_ONLY_ROUTES = ['/auth/login', '/auth/signup']

function redirectNoStore(url: URL) {
  const response = NextResponse.redirect(url)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token =
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.cookies.get(LEGACY_SESSION_COOKIE)?.value ??
    null

  // ── Resolve user identity ─────────────────────────────────────────────────
  let userId: string | null = null
  let isAdmin = false

  if (token) {
    try {
      // Use service role client for role checking to bypass RLS in middleware
      const supabase = createClient(supabaseUrl, supabaseRoleKey, {
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
      return redirectNoStore(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  // ── Admin routes — require admin role ────────────────────────────────────
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      return redirectNoStore(new URL('/auth/login', request.url))
    }
    if (!isAdmin) {
      return redirectNoStore(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // ── Protected customer routes — require login ────────────────────────────
  if (PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      return redirectNoStore(loginUrl)
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
