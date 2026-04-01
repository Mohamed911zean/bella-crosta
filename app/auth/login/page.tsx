'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth'
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const result = await signIn(email, password)

      if (!result.success) {
        setError(result.error)
        return
      }

      // returnUrl overrides role-based redirect only for customer routes
      const dest = returnUrl && !returnUrl.startsWith('/admin')
        ? returnUrl
        : result.redirectTo

      router.push(dest)
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
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to your Bella Crosta account
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
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-secondary-foreground">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye className="w-4 h-4" />
                }
              </button>
            </div>
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
                Signing in…
              </>
            ) : (
              'Sign in'
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
              Don&apos;t have an account?
            </span>
          </div>
        </div>

        {/* Sign up link */}
        <Link
          href="/auth/signup"
          className="w-full flex items-center justify-center py-2.5 px-6 rounded-xl border border-border text-foreground hover:bg-secondary text-sm font-medium transition-all duration-200"
        >
          Create an account
        </Link>
      </div>

      {/* Admin hint */}
      <p className="text-center text-xs text-muted-foreground mt-5">
        Restaurant staff?{' '}
        <span className="text-primary">
          Sign in with your admin credentials to access the dashboard.
        </span>
      </p>
    </div>
  )
}