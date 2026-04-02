'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { getAllCustomers } from '@/lib/db'
import type { Customer } from '@/lib/db'
import { Menu, User, Mail, Calendar } from 'lucide-react'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [mobile, setMobile] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getAllCustomers().then(d => { setCustomers(d); setLoading(false) })
  }, [])

  const filtered = customers.filter(c => 
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block w-64 shrink-0"><AdminSidebar /></div>
      {mobile && <AdminSidebar mobile onClose={() => setMobile(false)} />}

      <div className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold text-foreground">Customers</h1>
          <button onClick={() => setMobile(true)} className="md:hidden p-2 hover:bg-muted rounded-lg"><Menu className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-md px-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading customers...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                {search ? 'No customers match your search.' : 'No customers found.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Customer</th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Contact</th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id} className="border-b border-border hover:bg-muted/30 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{c.full_name || 'Unnamed User'}</p>
                              <p className="text-xs text-muted-foreground font-mono">{c.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="w-3.5 h-3.5" />
                              {c.email}
                            </div>
                            {c.phone && (
                              <p className="text-xs text-foreground font-medium">{c.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
