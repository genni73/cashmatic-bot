import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function ClientiPage() {
  const session = await getSession()
  if (!session?.user.businessId) redirect('/login')

  const businessId = session.user.businessId

  const bookings = await prisma.booking.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    select: {
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      date: true,
      status: true,
      source: true,
    },
  })

  const customerMap = new Map<string, {
    name: string
    phone: string
    email: string
    totalBookings: number
    lastVisit: Date
    source: string
  }>()

  for (const b of bookings) {
    const key = b.customerPhone
    const existing = customerMap.get(key)
    if (!existing) {
      customerMap.set(key, {
        name: b.customerName,
        phone: b.customerPhone,
        email: b.customerEmail || '',
        totalBookings: 1,
        lastVisit: b.date,
        source: b.source,
      })
    } else {
      existing.totalBookings++
      if (b.date > existing.lastVisit) {
        existing.lastVisit = b.date
        existing.name = b.customerName
        if (b.customerEmail) existing.email = b.customerEmail
      }
    }
  }

  const customers = Array.from(customerMap.values()).sort((a, b) => b.totalBookings - a.totalBookings)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Clienti</h1>
        <div className="flex gap-2">
          <a href="/api/export/customers?format=csv" className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}>
            📊 Esporta Excel
          </a>
          <a href="/api/export/customers?format=pdf" className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}>
            📄 Esporta PDF
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderLeft: '3px solid #06b6d4' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Clienti Totali</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#06b6d4' }}>{customers.length}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderLeft: '3px solid #22c55e' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Clienti Abituali (3+)</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#22c55e' }}>{customers.filter(c => c.totalBookings >= 3).length}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderLeft: '3px solid #8b5cf6' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Prenotazioni Totali</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#8b5cf6' }}>{bookings.length}</p>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-xl shadow-sm border p-12 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Nessun cliente ancora. I clienti appariranno qui quando faranno prenotazioni.</p>
        </div>
      ) : (
        <div className="rounded-xl shadow-sm border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Cliente</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Telefono</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Email</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Prenotazioni</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Ultima Visita</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Canale</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.phone} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{c.phone}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{c.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.totalBookings}</span>
                    {c.totalBookings >= 3 && <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>Abituale</span>}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{new Date(c.lastVisit).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>{c.source}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
