'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth'
import { Mail, Lock, User, Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react'

// Password strength indicator
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null

  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
  ]

  const score = checks.filter(c => c.pass).length

  const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong'][score] ?? 'Weak'
  const strengthColor = ['#e05252', '#ca8a04', '#16a34a', '#16a34a'][score] ?? '#e05252'

  return (
    <div className="mt-2 space-y-1.5">
      {/* Bar */}
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              background: i < score ? strengthColor : 'rgba(200,160,100,0.15)',
            }}
          />
        ))}
      </div>
      {/* Label */}
      <p className="text-xs" style={{ color: strengthColor }}>
        {strengthLabel}
      </p>
      {/* Checklist */}
      <div className="flex gap-3 flex-wrap">
        {checks.map(c => (
          <span
            key={c.label}
            className="flex items-center gap-1 text-xs"
            style={{ color: c.pass ? '#16a34a' : 'var(--muted-foreground)' }}
          >
            <CheckCircle className="w-3 h-3" />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.fullName.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const result = await signUp(form.email, form.password, form.fullName.trim())

      if (!result.success) {
        setError(result.error)
        return
      }

      router.push(result.redirectTo)
      router.refresh()
    })
  }

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-foreground mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Create account
          </h1>
          <p className="text-muted-foreground text-sm">
            Join Bella Crosta for faster ordering and order tracking
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary-foreground">
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={form.fullName}
                onChange={set('fullName')}
                placeholder="Ahmed Hassan"
                required
                autoComplete="name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary-foreground">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Create a strong password"
                required
                autoComplete="new-password"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={form.password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary-foreground">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                placeholder="Repeat your password"
                required
                autoComplete="new-password"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Match indicator */}
            {form.confirmPassword && (
              <p
                className="text-xs"
                style={{
                  color: form.password === form.confirmPassword ? '#16a34a' : '#e05252',
                }}
              >
                {form.password === form.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary hover:bg-accent text-primary-foreground font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-card text-xs text-muted-foreground">
              Already have an account?
            </span>
          </div>
        </div>

        {/* Sign in link */}
        <Link
          href="/auth/login"
          className="w-full flex items-center justify-center py-2.5 px-6 rounded-xl border border-border text-foreground hover:bg-secondary text-sm font-medium transition-all duration-200"
        >
          Sign in instead
        </Link>
      </div>

      {/* Terms */}
      <p className="text-center text-xs text-muted-foreground mt-5 px-4">
        By creating an account you agree to receive order updates and promotions from Bella Crosta.
      </p>
    </div>
  )
}