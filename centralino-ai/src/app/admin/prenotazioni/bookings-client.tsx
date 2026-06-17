'use client'

import { useRouter } from 'next/navigation'

interface Booking {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  date: string
  time: string
  duration: number
  numberOfPeople: number | null
  status: string
  notes: string | null
  source: string
  service: { name: string } | null
}

interface Props {
  bookings: Booking[]
  hasNumberOfPeople: boolean
}

export default function BookingsClient({ bookings, hasNumberOfPeople }: Props) {
  const router = useRouter()

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/bookings?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-gray-100 text-gray-700',
  }

  const statusLabels: Record<string, string> = {
    PENDING: 'In attesa',
    CONFIRMED: 'Confermata',
    CANCELLED: 'Cancellata',
    COMPLETED: 'Completata',
  }

  return (
    <div>
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Nessuna prenotazione ancora. Le prenotazioni dall'AI appariranno qui.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Servizio</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ora</th>
                {hasNumberOfPeople && <th className="text-left px-4 py-3 font-medium text-gray-600">Persone</th>}
                <th className="text-left px-4 py-3 font-medium text-gray-600">Canale</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stato</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.customerName}</p>
                    <p className="text-xs text-gray-500">{b.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{b.service?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{new Date(b.date).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3 text-gray-700">{b.time}</td>
                  {hasNumberOfPeople && <td className="px-4 py-3 text-gray-700">{b.numberOfPeople || '-'}</td>}
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{b.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[b.status] || ''}`}>
                      {statusLabels[b.status] || b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {b.status === 'PENDING' && (
                        <>
                          <button onClick={() => updateStatus(b.id, 'CONFIRMED')} className="text-xs text-green-600 hover:underline">Conferma</button>
                          <button onClick={() => updateStatus(b.id, 'CANCELLED')} className="text-xs text-red-600 hover:underline">Rifiuta</button>
                        </>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <button onClick={() => updateStatus(b.id, 'COMPLETED')} className="text-xs text-blue-600 hover:underline">Completata</button>
                      )}
                    </div>
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
