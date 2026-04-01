'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ─── Server-side client (uses cookies for session) ────────────────────────────
// Since this project uses the base supabase-js client (not @supabase/ssr),
// we read/write the session token manually via a cookie.
const SESSION_COOKIE = 'bc_session'

function getServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type AuthResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string }

export type UserRole = 'admin' | 'customer'

export interface SessionUser {
  id: string
  email: string
  role: UserRole
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────
export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  try {
    const supabase = getServerClient()

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Account creation failed. Please try again.' }
    }

    // Create customer profile in customers
    const { error: profileError } = await supabase
      .from('customers')
      .insert({
        id: data.user.id,
        email,
        full_name: fullName,
      })

    if (profileError) {
      // Don't block signup if profile insert fails — user can still log in
      console.error('Profile creation error:', profileError.message)
    }

    // Persist session token in a server-side cookie
    if (data.session) {
      const cookieStore = await cookies()
      cookieStore.set(SESSION_COOKIE, data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    return { success: true, redirectTo: '/' }
  } catch (err) {
    console.error('signUp error:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}

// ─── Sign In ──────────────────────────────────────────────────────────────────
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const supabase = getServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.session) {
      return { success: false, error: 'Login failed. Please try again.' }
    }

    // Persist session token
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    // Role-based redirect
    const role = await getUserRole(data.user.id, data.session.access_token)

    return {
      success: true,
      redirectTo: role === 'admin' ? '/admin/dashboard' : '/',
    }
  } catch (err) {
    console.error('signIn error:', err)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect('/')
}

// ─── Get current session token from cookie ────────────────────────────────────
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value ?? null
}

// ─── Get current logged-in user ───────────────────────────────────────────────
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const token = await getSessionToken()
    if (!token) return null

    const supabase = getServerClient()

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null

    const role = await getUserRole(user.id, token)

    return {
      id: user.id,
      email: user.email!,
      role,
    }
  } catch {
    return null
  }
}

// ─── Determine user role ──────────────────────────────────────────────────────
// Admin = exists in bc_admins table
// Everyone else = customer
async function getUserRole(
  userId: string,
  token: string
): Promise<UserRole> {
  try {
    const supabase = getServerClient()

    // Use the user's token to check bc_admins (RLS: can only read own row)
    const { data } = await supabase
      .from('bc_admins')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    return data ? 'admin' : 'customer'
  } catch {
    return 'customer'
  }
}

// ─── Require auth — use in Server Components / Server Actions ─────────────────
// Redirects to /auth/login if not logged in
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  return user
}

// ─── Require admin — redirects non-admins ─────────────────────────────────────
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== 'admin') redirect('/')
  return user
}