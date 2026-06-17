import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BUSINESS_TYPES, BusinessType } from '@/lib/business-types'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user.businessId) redirect('/login')

  const businessId = session.user.businessId

  const [totalBookings, pendingBookings, totalConversations, totalServices] = await Promise.all([
    prisma.booking.count({ where: { businessId } }),
    prisma.booking.count({ where: { businessId, status: 'PENDING' } }),
    prisma.conversation.count({ where: { businessId } }),
    prisma.service.count({ where: { businessId } }),
  ])

  const recentBookings = await prisma.booking.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { service: true },
  })

  const recentConversations = await prisma.conversation.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const typeConfig = BUSINESS_TYPES[session.user.business?.type as BusinessType]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title={`${typeConfig?.bookingLabel || 'Prenotazioni'} Totali`} value={totalBookings} color="blue" />
        <StatCard title="In Attesa" value={pendingBookings} color="yellow" />
        <StatCard title="Conversazioni" value={totalConversations} color="green" />
        <StatCard title={typeConfig?.serviceLabel || 'Servizi'} value={totalServices} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Ultime {typeConfig?.bookingLabel || 'Prenotazioni'}</h2>
          {recentBookings.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessuna prenotazione ancora.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{b.customerName}</p>
                    <p className="text-xs text-gray-500">{b.service?.name || 'Generico'} — {new Date(b.date).toLocaleDateString('it-IT')} {b.time}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Ultime Conversazioni</h2>
          {recentConversations.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessuna conversazione ancora.</p>
          ) : (
            <div className="space-y-3">
              {recentConversations.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{c.customerName || c.customerPhone}</p>
                    <p className="text-xs text-gray-500">{c.channel} — {new Date(c.createdAt).toLocaleDateString('it-IT')}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>{c.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  }

  return (
    <div className={`rounded-xl border p-6 ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}
