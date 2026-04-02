import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthCookiesToClear } from '@/lib/auth-constants'
import { getSessionToken } from '@/lib/auth'
import { clearSession } from '@/lib/core'

export const dynamic = 'force-dynamic'

async function invalidateRemoteSession() {
  const token = await getSessionToken()
  if (!token) return

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )

  await supabase.auth.signOut()
}

function applyClearCookies(response: NextResponse) {
  const secure = process.env.NODE_ENV === 'production'

  for (const name of getAuthCookiesToClear()) {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    })
  }
}

async function handleLogout(request: NextRequest) {
  try {
    await invalidateRemoteSession()
  } catch (error) {
    console.error('[logout] remote signout failed:', error)
  }

  await clearSession()

  const response = NextResponse.redirect(new URL('/', request.url))
  applyClearCookies(response)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

export async function GET(request: NextRequest) {
  return handleLogout(request)
}

export async function POST(request: NextRequest) {
  return handleLogout(request)
}
