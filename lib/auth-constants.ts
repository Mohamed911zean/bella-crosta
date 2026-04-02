export const SESSION_COOKIE = 'session'
export const LEGACY_SESSION_COOKIE = 'bc_session'
export const ACCESS_TOKEN_COOKIE = 'sb-access-token'
export const REFRESH_TOKEN_COOKIE = 'sb-refresh-token'

function getSupabaseProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return null
  try {
    const host = new URL(url).hostname
    return host.split('.')[0] ?? null
  } catch {
    return null
  }
}

export function getAuthCookiesToClear(): string[] {
  const cookies = new Set<string>([
    SESSION_COOKIE,
    LEGACY_SESSION_COOKIE,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
  ])

  const projectRef = getSupabaseProjectRef()
  if (projectRef) {
    cookies.add(`sb-${projectRef}-auth-token`)
    cookies.add(`sb-${projectRef}-auth-token.0`)
    cookies.add(`sb-${projectRef}-auth-token.1`)
    cookies.add(`sb-${projectRef}-refresh-token`)
    cookies.add(`sb-${projectRef}-access-token`)
  }

  return Array.from(cookies)
}

