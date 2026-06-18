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

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'rgba(234,179,8,0.15)', text: '#eab308' },
  CONFIRMED: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  ARRIVED: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  CANCELLED: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  COMPLETED: { bg: 'rgba(107,114,128,0.15)', text: '#6b7280' },
  WAITLIST: { bg: 'rgba(249,115,22,0.15)', text: '#f97316' },
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
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
            style={{
              background: filterStatus === s ? 'var(--accent)' : s === 'ALL' ? 'var(--bg-secondary)' : statusColors[s]?.bg || 'var(--bg-secondary)',
              color: filterStatus === s ? '#fff' : s === 'ALL' ? 'var(--text-secondary)' : statusColors[s]?.text || 'var(--text-secondary)',
            }}
          >
            {s === 'ALL' ? 'Tutte' : statusLabels[s]} ({counts[s]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl shadow-sm border p-12 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Nessuna prenotazione {filterStatus !== 'ALL' ? `con stato "${statusLabels[filterStatus]}"` : ''}.</p>
        </div>
      ) : (
        <div className="rounded-xl shadow-sm border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Cliente</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Servizio</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Data</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Ora</th>
                {hasNumberOfPeople && <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Persone</th>}
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Canale</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Stato</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{b.customerName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{b.service?.name || '-'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{new Date(b.date).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{b.time}</td>
                  {hasNumberOfPeople && <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{b.numberOfPeople || '-'}</td>}
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>{b.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full" style={{
                      background: statusColors[b.status]?.bg || '',
                      color: statusColors[b.status]?.text || '',
                    }}>
                      {statusLabels[b.status] || b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {b.status === 'PENDING' && (
                        <>
                          <button onClick={() => updateStatus(b.id, 'CONFIRMED')} className="text-xs hover:underline" style={{ color: '#22c55e' }}>Conferma</button>
                          <button onClick={() => updateStatus(b.id, 'WAITLIST')} className="text-xs hover:underline" style={{ color: '#f97316' }}>In Lista</button>
                          <button onClick={() => updateStatus(b.id, 'CANCELLED')} className="text-xs hover:underline" style={{ color: '#ef4444' }}>Elimina</button>
                        </>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <>
                          <button onClick={() => updateStatus(b.id, 'ARRIVED')} className="text-xs hover:underline" style={{ color: '#3b82f6' }}>Arrivato</button>
                          <button onClick={() => updateStatus(b.id, 'CANCELLED')} className="text-xs hover:underline" style={{ color: '#ef4444' }}>Elimina</button>
                        </>
                      )}
                      {b.status === 'ARRIVED' && (
                        <button onClick={() => updateStatus(b.id, 'COMPLETED')} className="text-xs hover:underline" style={{ color: '#6b7280' }}>Completata</button>
                      )}
                      {b.status === 'WAITLIST' && (
                        <>
                          <button onClick={() => updateStatus(b.id, 'CONFIRMED')} className="text-xs hover:underline" style={{ color: '#22c55e' }}>Conferma</button>
                          <button onClick={() => updateStatus(b.id, 'CANCELLED')} className="text-xs hover:underline" style={{ color: '#ef4444' }}>Elimina</button>
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
