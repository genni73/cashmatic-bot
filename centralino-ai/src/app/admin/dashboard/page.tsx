import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BUSINESS_TYPES, BusinessType } from '@/lib/business-types'
import DashboardCharts from '@/components/ui/dashboard-charts'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user.businessId) redirect('/login')

  const businessId = session.user.businessId

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)

  const [
    totalBookings,
    pendingBookings,
    confirmedBookings,
    arrivedBookings,
    cancelledBookings,
    waitlistBookings,
    completedBookings,
    todayBookings,
    weekBookings,
    totalConversations,
    activeConversations,
    totalServices,
    totalCustomers,
  ] = await Promise.all([
    prisma.booking.count({ where: { businessId } }),
    prisma.booking.count({ where: { businessId, status: 'PENDING' } }),
    prisma.booking.count({ where: { businessId, status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { businessId, status: 'ARRIVED' } }),
    prisma.booking.count({ where: { businessId, status: 'CANCELLED' } }),
    prisma.booking.count({ where: { businessId, status: 'WAITLIST' } }),
    prisma.booking.count({ where: { businessId, status: 'COMPLETED' } }),
    prisma.booking.count({ where: { businessId, date: { gte: todayStart } } }),
    prisma.booking.count({ where: { businessId, date: { gte: weekStart } } }),
    prisma.conversation.count({ where: { businessId } }),
    prisma.conversation.count({ where: { businessId, status: 'ACTIVE' } }),
    prisma.service.count({ where: { businessId } }),
    prisma.booking.groupBy({ by: ['customerPhone'], where: { businessId } }).then(r => r.length),
  ])

  const recentBookings = await prisma.booking.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { service: true },
  })

  const recentConversations = await prisma.conversation.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Daily bookings for chart (last 7 days)
  const dailyBookings: { day: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart)
    d.setDate(d.getDate() - i)
    const nextD = new Date(d)
    nextD.setDate(nextD.getDate() + 1)
    const count = await prisma.booking.count({
      where: { businessId, date: { gte: d, lt: nextD } },
    })
    dailyBookings.push({
      day: d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' }),
      count,
    })
  }

  const typeConfig = BUSINESS_TYPES[session.user.business?.type as BusinessType]
  const bookingLabel = typeConfig?.bookingLabel || 'Prenotazioni'
  const businessLogo = session.user.business?.logoUrl

  const statusLabels: Record<string, string> = {
    PENDING: 'Da confermare',
    CONFIRMED: 'Confermata',
    ARRIVED: 'Arrivato',
    CANCELLED: 'Eliminata',
    COMPLETED: 'Completata',
    WAITLIST: 'Lista d\'attesa',
  }

  const statusCounts = [
    { name: 'Da confermare', value: pendingBookings, color: '#eab308' },
    { name: 'Confermate', value: confirmedBookings, color: '#22c55e' },
    { name: 'Arrivati', value: arrivedBookings, color: '#3b82f6' },
    { name: 'Lista attesa', value: waitlistBookings, color: '#f97316' },
    { name: 'Completate', value: completedBookings, color: '#6b7280' },
    { name: 'Eliminate', value: cancelledBookings, color: '#ef4444' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {businessLogo && (
            <img src={businessLogo} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
          )}
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{session.user.business?.name}</p>
          </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats principali */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard title="Oggi" value={todayBookings} accent="#06b6d4" />
        <StatCard title="Settimana" value={weekBookings} accent="#8b5cf6" />
        <StatCard title="Totali" value={totalBookings} accent="#6366f1" />
        <StatCard title="Conversazioni" value={totalConversations} subtitle={`${activeConversations} attive`} accent="#22c55e" />
        <StatCard title={typeConfig?.serviceLabel || 'Servizi'} value={totalServices} accent="#f59e0b" />
        <StatCard title="Clienti" value={totalCustomers} accent="#ec4899" />
      </div>

      {/* Grafici */}
      <div className="mb-6">
        <DashboardCharts statusCounts={statusCounts} dailyBookings={dailyBookings} />
      </div>

      {/* Stati prenotazioni */}
      <div className="rounded-xl shadow-sm border p-6 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Stato {bookingLabel}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatusCard label="Da confermare" count={pendingBookings} color="#eab308" />
          <StatusCard label="Confermate" count={confirmedBookings} color="#22c55e" />
          <StatusCard label="Arrivati" count={arrivedBookings} color="#3b82f6" />
          <StatusCard label="Lista d'attesa" count={waitlistBookings} color="#f97316" />
          <StatusCard label="Completate" count={completedBookings} color="#6b7280" />
          <StatusCard label="Eliminate" count={cancelledBookings} color="#ef4444" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ultime prenotazioni */}
        <div className="rounded-xl shadow-sm border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Ultime {bookingLabel}</h2>
            <a href="/admin/prenotazioni" className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>Vedi tutte</a>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nessuna prenotazione ancora.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{b.customerName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.service?.name || 'Generico'} — {new Date(b.date).toLocaleDateString('it-IT')} {b.time}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{
                    background: b.status === 'CONFIRMED' ? 'rgba(34,197,94,0.15)' :
                      b.status === 'PENDING' ? 'rgba(234,179,8,0.15)' :
                      b.status === 'ARRIVED' ? 'rgba(59,130,246,0.15)' :
                      b.status === 'WAITLIST' ? 'rgba(249,115,22,0.15)' :
                      b.status === 'CANCELLED' ? 'rgba(239,68,68,0.15)' : 'rgba(107,114,128,0.15)',
                    color: b.status === 'CONFIRMED' ? '#22c55e' :
                      b.status === 'PENDING' ? '#eab308' :
                      b.status === 'ARRIVED' ? '#3b82f6' :
                      b.status === 'WAITLIST' ? '#f97316' :
                      b.status === 'CANCELLED' ? '#ef4444' : '#6b7280',
                  }}>{statusLabels[b.status] || b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ultime conversazioni */}
        <div className="rounded-xl shadow-sm border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Ultime Conversazioni</h2>
            <a href="/admin/conversazioni" className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>Vedi tutte</a>
          </div>
          {recentConversations.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nessuna conversazione ancora.</p>
          ) : (
            <div className="space-y-3">
              {recentConversations.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{c.customerName || c.customerPhone}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.channel} — {new Date(c.createdAt).toLocaleDateString('it-IT')}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{
                    background: c.status === 'ACTIVE' ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
                    color: c.status === 'ACTIVE' ? '#22c55e' : '#6b7280',
                  }}>{c.status === 'ACTIVE' ? 'Attiva' : 'Chiusa'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick export */}
      <div className="rounded-xl shadow-sm border p-6 mt-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Esporta Dati</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ExportButton label="Servizi / Menu" href="/api/export/services?format=csv" format="Excel" />
          <ExportButton label="Servizi / Menu" href="/api/export/services?format=pdf" format="PDF" />
          <ExportButton label="Clienti" href="/api/export/customers?format=csv" format="Excel" />
          <ExportButton label="Clienti" href="/api/export/customers?format=pdf" format="PDF" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, accent }: { title: string; value: number; subtitle?: string; accent: string }) {
  return (
    <div className="rounded-xl border p-4" style={{
      background: 'var(--bg-card)',
      borderColor: 'var(--border-color)',
      borderLeft: `3px solid ${accent}`,
    }}>
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{title}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: accent }}>{value}</p>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
    </div>
  )
}

function StatusCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}40` }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{count}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  )
}

function ExportButton({ label, href, format }: { label: string; href: string; format: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors"
      style={{
        borderColor: 'var(--border-color)',
        color: 'var(--text-secondary)',
        background: 'var(--bg-secondary)',
      }}
    >
      <span>{format === 'PDF' ? '📄' : '📊'}</span>
      {label} ({format})
    </a>
  )
}
