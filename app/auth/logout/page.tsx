import { signOut } from '@/lib/auth'

export default async function LogoutPage() {
  await signOut()
  return null
}
