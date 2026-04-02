import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { SESSION_COOKIE, getAuthCookiesToClear } from '@/lib/auth-constants'
import { SessionUser, UserRole } from './auth.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function serverClient() {
  return createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function setSession(token: string) {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function getSessionToken() {
  const jar = await cookies()
  return jar.get(SESSION_COOKIE)?.value ?? null
}

export async function clearSession() {
  const jar = await cookies()
  const secure = process.env.NODE_ENV === 'production'

  for (const name of getAuthCookiesToClear()) {
    jar.set(name, '', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    })
    jar.delete(name)
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSessionToken()
  if (!token) return null

  const sb = serverClient()
  const { data: { user } } = await sb.auth.getUser(token)

  if (!user) return null

  return {
    id: user.id,
    email: user.email!,
    role: user.role as UserRole,
  }
}
