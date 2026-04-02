/**
 * app/auth/logout/page.tsx
 *
 * Server Component — this IS a valid context for calling Server Actions.
 * The `signOut()` Server Action correctly:
 *   1. Invalidates the JWT on Supabase
 *   2. Deletes the bc_session cookie
 *   3. Calls redirect('/') — all in the right order
 *
 * Why a page and not a Route Handler?
 *   A Route Handler at app/auth/logout/route.ts also works, but
 *   a Server Component page is simpler and avoids the need for
 *   <Link> vs fetch() inconsistencies. Both are valid Next.js 15 contexts
 *   for cookie mutation.
 */

import { signOut } from '@/lib/auth'

export default async function LogoutPage() {
  // signOut() deletes the cookie then calls redirect('/').
  // redirect() throws NEXT_REDIRECT so this component never renders JSX.
  await signOut()

  // This line is unreachable — redirect() always throws.
  // Included only to satisfy TypeScript's return-type checker.
  return null
}