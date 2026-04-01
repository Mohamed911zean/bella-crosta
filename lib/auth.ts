'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SESSION_COOKIE = 'session'

function getServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

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

    if (error) return { success: false, error: error.message }
    if (!data.user) return { success: false, error: 'Account creation failed. Please try again.' }

    // Create customer profile
    const { error: profileError } = await supabase
      .from('customers')
      .insert({ id: data.user.id, email, full_name: fullName })

    if (profileError) {
      console.error('Profile creation error:', profileError.message)
    }

    if (data.session) {
      const cookieStore = await cookies()
      cookieStore.set(SESSION_COOKIE, data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return { success: false, error: error.message }
    if (!data.session) return { success: false, error: 'Login failed. Please try again.' }

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    // Role-based redirect: admin → /admin/dashboard, customer → /
    const role = await getUserRole(data.user.id)
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

// ─── Get session token ────────────────────────────────────────────────────────
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value ?? null
}

// ─── Get current user ────────────────────────────────────────────────────────
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const token = await getSessionToken()
    if (!token) return null

    const supabase = getServerClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null

    const role = await getUserRole(user.id)
    return { id: user.id, email: user.email!, role }
  } catch {
    return null
  }
}

// ─── Determine role ───────────────────────────────────────────────────────────
async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const supabase = getServerClient()
    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    return data ? 'admin' : 'customer'
  } catch {
    return 'customer'
  }
}

// ─── Guards ───────────────────────────────────────────────────────────────────
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== 'admin') redirect('/')
  return user
}