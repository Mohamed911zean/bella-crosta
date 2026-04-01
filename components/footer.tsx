export function Footer() {
  return (
    <footer className="bg-muted border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Bella Crosta. All rights reserved.</p>
          <p className="mt-2">Authentic Italian pizzas delivered fresh to your door</p>
        </div>
      </div>
    </footer>
  )
}
