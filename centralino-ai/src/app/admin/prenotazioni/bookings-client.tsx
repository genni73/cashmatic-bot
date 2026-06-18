'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

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

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  ARRIVED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  WAITLIST: 'bg-orange-100 text-orange-700',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Da confermare',
  CONFIRMED: 'Confermata',
  ARRIVED: 'Arrivato',
  CANCELLED: 'Eliminata',
  COMPLETED: 'Completata',
  WAITLIST: 'Lista d\'attesa',
}

const ALL_STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'ARRIVED', 'WAITLIST', 'CANCELLED', 'COMPLETED'] as const

export default function BookingsClient({ bookings, hasNumberOfPeople }: Props) {
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/bookings?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  const filtered = filterStatus === 'ALL' ? bookings : bookings.filter(b => b.status === filterStatus)

  const counts: Record<string, number> = {}
  for (const s of ALL_STATUSES) {
    counts[s] = s === 'ALL' ? bookings.length : bookings.filter(b => b.status === s).length
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filterStatus === s
                ? 'bg-blue-600 text-white'
                : s === 'ALL' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : `${statusColors[s]} hover:opacity-80`
            }`}
          >
            {s === 'ALL' ? 'Tutte' : statusLabels[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Nessuna prenotazione {filterStatus !== 'ALL' ? `con stato "${statusLabels[filterStatus]}"` : ''}.</p>
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
              {filtered.map((b) => (
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
                    <div className="flex gap-1 flex-wrap">
                      {b.status === 'PENDING' && (
                        <>
                          <button onClick={() => updateStatus(b.id, 'CONFIRMED')} className="text-xs text-green-600 hover:underline">Conferma</button>
                          <button onClick={() => updateStatus(b.id, 'WAITLIST')} className="text-xs text-orange-600 hover:underline">In Lista</button>
                          <button onClick={() => updateStatus(b.id, 'CANCELLED')} className="text-xs text-red-600 hover:underline">Elimina</button>
                        </>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <>
                          <button onClick={() => updateStatus(b.id, 'ARRIVED')} className="text-xs text-blue-600 hover:underline">Arrivato</button>
                          <button onClick={() => updateStatus(b.id, 'CANCELLED')} className="text-xs text-red-600 hover:underline">Elimina</button>
                        </>
                      )}
                      {b.status === 'ARRIVED' && (
                        <button onClick={() => updateStatus(b.id, 'COMPLETED')} className="text-xs text-gray-600 hover:underline">Completata</button>
                      )}
                      {b.status === 'WAITLIST' && (
                        <>
                          <button onClick={() => updateStatus(b.id, 'CONFIRMED')} className="text-xs text-green-600 hover:underline">Conferma</button>
                          <button onClick={() => updateStatus(b.id, 'CANCELLED')} className="text-xs text-red-600 hover:underline">Elimina</button>
                        </>
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
