import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BUSINESS_TYPES, BusinessType } from '@/lib/business-types'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user.businessId) redirect('/login')

  const businessId = session.user.businessId

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

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

  const typeConfig = BUSINESS_TYPES[session.user.business?.type as BusinessType]
  const bookingLabel = typeConfig?.bookingLabel || 'Prenotazioni'

  const statusLabels: Record<string, string> = {
    PENDING: 'Da confermare',
    CONFIRMED: 'Confermata',
    ARRIVED: 'Arrivato',
    CANCELLED: 'Eliminata',
    COMPLETED: 'Completata',
    WAITLIST: 'Lista d\'attesa',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">{now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Stats principali */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard title="Oggi" value={todayBookings} color="blue" />
        <StatCard title="Settimana" value={weekBookings} color="indigo" />
        <StatCard title="Totali" value={totalBookings} color="gray" />
        <StatCard title="Conversazioni" value={totalConversations} subtitle={`${activeConversations} attive`} color="green" />
        <StatCard title={typeConfig?.serviceLabel || 'Servizi'} value={totalServices} color="purple" />
        <StatCard title="Clienti" value={totalCustomers} color="teal" />
      </div>

      {/* Stati prenotazioni */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Stato {bookingLabel}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatusCard label="Da confermare" count={pendingBookings} color="bg-yellow-500" />
          <StatusCard label="Confermate" count={confirmedBookings} color="bg-green-500" />
          <StatusCard label="Arrivati" count={arrivedBookings} color="bg-blue-500" />
          <StatusCard label="Lista d'attesa" count={waitlistBookings} color="bg-orange-500" />
          <StatusCard label="Completate" count={completedBookings} color="bg-gray-500" />
          <StatusCard label="Eliminate" count={cancelledBookings} color="bg-red-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ultime prenotazioni */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Ultime {bookingLabel}</h2>
            <a href="/admin/prenotazioni" className="text-sm text-blue-600 hover:underline">Vedi tutte</a>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessuna prenotazione ancora.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{b.customerName}</p>
                    <p className="text-xs text-gray-500">{b.service?.name || 'Generico'} — {new Date(b.date).toLocaleDateString('it-IT')} {b.time}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    b.status === 'ARRIVED' ? 'bg-blue-100 text-blue-700' :
                    b.status === 'WAITLIST' ? 'bg-orange-100 text-orange-700' :
                    b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{statusLabels[b.status] || b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ultime conversazioni */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Ultime Conversazioni</h2>
            <a href="/admin/conversazioni" className="text-sm text-blue-600 hover:underline">Vedi tutte</a>
          </div>
          {recentConversations.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessuna conversazione ancora.</p>
          ) : (
            <div className="space-y-3">
              {recentConversations.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{c.customerName || c.customerPhone}</p>
                    <p className="text-xs text-gray-500">{c.channel} — {new Date(c.createdAt).toLocaleDateString('it-IT')}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>{c.status === 'ACTIVE' ? 'Attiva' : 'Chiusa'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick export */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Esporta Dati</h2>
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

function StatCard({ title, value, subtitle, color }: { title: string; value: number; subtitle?: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    teal: 'bg-teal-50 border-teal-200 text-teal-600',
    gray: 'bg-gray-50 border-gray-200 text-gray-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    red: 'bg-red-50 border-red-200 text-red-600',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <p className="text-xs font-medium opacity-80">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs opacity-70 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function StatusCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <div>
        <p className="text-sm font-medium text-gray-900">{count}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function ExportButton({ label, href, format }: { label: string; href: string; format: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <span>{format === 'PDF' ? '📄' : '📊'}</span>
      {label} ({format})
    </a>
  )
}
