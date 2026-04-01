import Link from 'next/link'
import { requireAuth } from '@/lib/auth'

export const metadata = {
  title: 'Bella Crosta — Profile',
}

export default async function ProfilePage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-4xl border border-border bg-linear-to-br from-[#1f1b16]/95 via-[#161310]/95 to-[#0e0c0a]/95 shadow-2xl shadow-black/20">
          <div className="relative p-8 sm:p-10">
            <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(232,101,42,0.18),transparent_55%)] pointer-events-none" />
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Account Dashboard</p>
                <h1 className="mt-4 text-4xl font-bold text-foreground">Your Bella Crosta profile</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Keep your details up to date, review your account role, and enjoy faster ordering every time you visit.
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-card/95 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Signed in as</p>
                    <p className="mt-2 font-semibold text-foreground break-all">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <section className="rounded-3xl border border-border bg-background/95 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Account details</p>
                <div className="mt-5 space-y-4 text-sm text-foreground/80">
                  <div className="flex items-center justify-between rounded-2xl bg-card/80 p-4">
                    <span>Email</span>
                    <span className="font-semibold text-foreground">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-card/80 p-4">
                    <span>Role</span>
                    <span className="font-semibold text-foreground">{user.role}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-card/80 p-4">
                    <span>Customer ID</span>
                    <span className="font-semibold text-foreground">{user.id.slice(0, 8)}</span>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-background/95 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Quick actions</p>
                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    href="/menu"
                    className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent"
                  >
                    Order a pizza
                  </Link>
                  <Link
                    href="/cart"
                    className="rounded-2xl border border-border bg-card/90 px-4 py-3 text-sm text-foreground transition hover:border-primary"
                  >
                    View cart
                  </Link>
                  <Link
                    href="/auth/logout"
                    className="rounded-2xl bg-destructive px-4 py-3 text-sm font-semibold text-white transition hover:bg-destructive/90"
                  >
                    Sign out
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
