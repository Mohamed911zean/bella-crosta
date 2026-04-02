
/**
 * lib/auth.ts
 *
 * All exports are Server Actions (file-level 'use server').
 * Cookie reads/writes use Next.js `cookies()` — only valid inside
 * Server Actions and Route Handlers, never in middleware or layouts.
 *
 * KEY RULE enforced here:
 *   cookieStore.delete() / cookieStore.set() MUST be called BEFORE
 *   redirect() is thrown. redirect() throws a special NEXT_REDIRECT
 *   error internally — any cookie mutation attempted after that throw
 *   (e.g. inside a finally block) happens in a context where the
 *   response is already committed and Next.js 15+ will throw:
 *     "Cookies can only be modified in a Server Action or Route Handler"
 */
'use server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// ─── Constants ────────────────────────────────────────────────────────────────

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseRole = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!

/** The sole cookie name that holds our JWT access token. */

import { SESSION_COOKIE } from './auth-constants'
import type {UserRole , SessionUser , AuthResult} from './auth.types'
// Validate public env at module load
if (!supabaseUrl || !supabaseAnon) {
  throw new Error('[auth] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// ─── Internal Supabase client factory ────────────────────────────────────────

/** Stateless server-side client — no browser session, no auto-refresh. */
function serverClient() {
  return createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Admin client — uses service role key to bypass RLS for role checks. */
function adminClient() {
  const roleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!roleKey) {
    throw new Error('[auth] SUPABASE_SERVICE_ROLE_KEY is missing')
  }
  return createClient(supabaseUrl, roleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Authed client — passes the user's JWT so Supabase can invalidate it. */
function authedServerClient(token: string) {
  return createClient(supabaseUrl, supabaseAnon, {
    auth:   { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

// ─── Public types ─────────────────────────────────────────────────────────────

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export async function signUp(
  email:    string,
  password: string,
  fullName: string,
): Promise<AuthResult> {
  try {
    const sb = serverClient()

    const { data, error } = await sb.auth.signUp({ email, password })
    if (error)      return { success: false, error: error.message }
    if (!data.user) return { success: false, error: 'Account creation failed. Please try again.' }

    // Create customer profile — non-fatal if it fails (user can still log in)
    const { error: profileErr } = await sb
      .from('customers')
      .insert({ id: data.user.id, email, full_name: fullName })
    if (profileErr) {
      console.error('[auth] customers insert error:', profileErr.message)
    }

    // Persist session cookie before returning
    if (data.session) {
      await _setCookie(data.session.access_token)
    }

    return { success: true, redirectTo: '/' }
  } catch (e) {
    console.error('[auth] signUp unexpected error:', e)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

export async function signIn(
  email:    string,
  password: string,
): Promise<AuthResult> {
  try {
    const sb = serverClient()

    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error)         return { success: false, error: error.message }
    if (!data.session) return { success: false, error: 'Login failed. Please try again.' }

    // Persist the JWT cookie
    await _setCookie(data.session.access_token)

    // Determine where to send the user based on their role
    const role = await _getUserRole(data.user.id)
    return {
      success:    true,
      redirectTo: role === 'admin' ? '/admin/dashboard' : '/',
    }
  } catch (e) {
    console.error('[auth] signIn unexpected error:', e)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
//
// THE FIX — three rules strictly followed:
//
//   1. Cookie mutation (_deleteCookie) MUST happen BEFORE redirect() is called.
//      redirect() throws NEXT_REDIRECT internally; any code after that throw
//      cannot mutate response headers/cookies.
//
//   2. Cookie mutation MUST NOT be inside a finally block that also contains
//      redirect(). When redirect() throws, the finally block executes in a
//      context where the response is already being committed.
//
//   3. Supabase session invalidation is fire-and-forget: it must never block
//      or prevent the cookie from being cleared. A failed Supabase signOut
//      is logged but the local cookie is ALWAYS deleted.
//
import { redirect } from 'next/navigation'
import { clearSession } from './core'
export async function signOut(): Promise<void> {
  // Step 1 — Invalidate the JWT on Supabase's servers (non-blocking, non-fatal)
  try {
    const token = await getSessionToken()
    if (token) {
      await authedServerClient(token).auth.signOut()
    }
  } catch (e) {
    // Non-fatal: the local cookie will still be cleared below.
    console.error('[auth] signOut — Supabase invalidation failed (non-fatal):', e)
  }

  // Step 2 — Delete the cookie.
  // This MUST run BEFORE redirect() so it happens while the response
  // is still open and headers can still be written.
  try {
    await clearSession()
  } catch (e) {
    // This branch only triggers if called outside a valid Server Action /
    // Route Handler context (e.g. from middleware). Log and continue.
    console.error('[auth] signOut — cookie deletion failed:', e)
  }

  // Step 3 — Redirect AFTER the cookie has been deleted.
  // redirect() throws NEXT_REDIRECT here, which is intentional.
  // No further code in this function will run after this line.
  redirect('/')
}

// ─── Get session token ────────────────────────────────────────────────────────

export async function getSessionToken(): Promise<string | null> {
  try {
    const jar = await cookies()
    return jar.get(SESSION_COOKIE)?.value ?? null
  } catch {
    // Outside Server Action / Route Handler context — return null gracefully.
    return null
  }
}

// ─── Get current user ────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const token = await getSessionToken()
    if (!token) return null

    const sb = serverClient()
    const { data: { user }, error } = await sb.auth.getUser(token)
    if (error || !user) {
      // Token is expired or invalid — clean up silently
      return null
    }

    const role = await _getUserRole(user.id)
    return { id: user.id, email: user.email!, role }
  } catch (e) {
    console.error('[auth] getCurrentUser error:', e)
    return null
  }
}

// ─── Guards ───────────────────────────────────────────────────────────────────

/** Redirects to /auth/login if not authenticated. */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  return user
}

/** Redirects to / if authenticated but not an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== 'admin') redirect('/')
  return user
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Determines user role by checking admin_users table. */
async function _getUserRole(userId: string): Promise<UserRole> {
  try {
    const sb = adminClient()
    const { data } = await sb
      .from('admin_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    return data ? 'admin' : 'customer'
  } catch (e) {
    console.error('[auth] _getUserRole error:', e)
    return 'customer'
  }
}

/**
 * Writes the JWT into an httpOnly cookie.
 * Must only be called from within a Server Action or Route Handler.
 */
async function _setCookie(token: string): Promise<void> {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 7, // 7 days
  })
}

/**
 * Deletes the session cookie.
 * Must only be called from within a Server Action or Route Handler,
 * and ALWAYS before any redirect() call.
 */
async function _deleteCookie(): Promise<void> {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}