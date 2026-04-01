import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-5 flex items-center justify-between border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-base shadow-lg shadow-primary/20">
            🍕
          </div>
          <span
            className="text-lg font-bold text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Bella Crosta
          </span>
        </Link>

        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to store
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="px-6 py-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 Bella Crosta. Authentic Italian craft pizzas.
        </p>
      </footer>
    </div>
  )
}
