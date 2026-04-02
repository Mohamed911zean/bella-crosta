export type UserRole = 'admin' | 'customer'

export interface SessionUser {
  id: string
  email: string
  role: UserRole
}

export type AuthResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string }