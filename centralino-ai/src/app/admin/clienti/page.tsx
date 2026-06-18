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
    statuses: Record<string, number>
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
        statuses: { [b.status]: 1 },
      })
    } else {
      existing.totalBookings++
      existing.statuses[b.status] = (existing.statuses[b.status] || 0) + 1
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
        <h1 className="text-2xl font-bold text-gray-900">Clienti</h1>
        <div className="flex gap-2">
          <a
            href="/api/export/customers?format=csv"
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            📊 Esporta Excel
          </a>
          <a
            href="/api/export/customers?format=pdf"
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            📄 Esporta PDF
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-600">Clienti Totali</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{customers.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs font-medium text-green-600">Clienti Abituali (3+)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{customers.filter(c => c.totalBookings >= 3).length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-xs font-medium text-purple-600">Prenotazioni Totali</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{bookings.length}</p>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Nessun cliente ancora. I clienti appariranno qui quando faranno prenotazioni.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Telefono</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Prenotazioni</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ultima Visita</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Canale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c.phone} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-700">{c.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900">{c.totalBookings}</span>
                    {c.totalBookings >= 3 && <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Abituale</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{new Date(c.lastVisit).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{c.source}</span>
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
