'use client'

import { useState } from 'react'
import DashboardCharts from '@/components/ui/dashboard-charts'

interface BookingItem {
  id: string
  customerName: string
  customerPhone: string
  date: string
  time: string
  duration: number
  numberOfPeople: number | null
  status: string
  notes: string | null
  source: string
  service?: { name: string } | null
}

interface ConversationItem {
  id: string
  customerName: string | null
  customerPhone: string
  channel: string
  status: string
  createdAt: string
}

interface Props {
  businessName: string
  businessLogo: string | null
  businessType: string
  serviceLabel: string
  bookingLabel: string
  stats: {
    todayBookings: number
    weekBookings: number
    totalBookings: number
    totalConversations: number
    activeConversations: number
    totalServices: number
    totalCustomers: number
    seatedNow: number
    seatedGuests: number
    arrivingSoon: number
    arrivingSoonParties: number
    coversToday: number
    waitlistCount: number
    pendingBookings: number
    confirmedBookings: number
    arrivedBookings: number
    cancelledBookings: number
    waitlistBookings: number
    completedBookings: number
  }
  dailyBookings: { day: string; count: number }[]
  todayBookings: BookingItem[]
  recentBookings: BookingItem[]
  recentConversations: ConversationItem[]
  capacityData: { label: string; used: number; max: number }[]
  maxTables: number
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Da confermare',
  CONFIRMED: 'Confermata',
  ARRIVED: 'Arrivato',
  CANCELLED: 'Eliminata',
  COMPLETED: 'Completata',
  WAITLIST: 'Lista d\'attesa',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#D4AF37',
  CONFIRMED: '#D4AF37',
  ARRIVED: '#00D4FF',
  CANCELLED: '#ef4444',
  COMPLETED: '#22c55e',
  WAITLIST: '#f97316',
}

export default function DashboardClient({
  businessName, businessLogo, businessType, serviceLabel, bookingLabel,
  stats, dailyBookings, todayBookings, recentBookings, recentConversations,
  capacityData, maxTables,
}: Props) {
  const [activeView, setActiveView] = useState<'floor' | 'timeline'>('floor')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [selectedArea, setSelectedArea] = useState('Sala Principale')
  const [showAreaDropdown, setShowAreaDropdown] = useState(false)
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const areas = ['Sala Principale', 'Terrazza', 'Rooftop', 'Sala Privata']

  const tableCount = maxTables || 12
  const tables = Array.from({ length: tableCount }, (_, i) => {
    const id = `T${i + 1}`
    const capacity = [2, 4, 6, 4, 2, 8, 4, 6, 4, 2, 4, 6][i % 12]
    const labels = ['', 'Finestra', '', 'Terrazza', '', '', 'Finestra dx', '', '', '', '', '']
    const booking = todayBookings.find(b => {
      const tableNote = b.notes?.match(/T(\d+)/i)
      return tableNote && parseInt(tableNote[1]) === i + 1
    })

    let status: 'available' | 'reserved' | 'seated' | 'completed' | 'noshow' = 'available'
    if (booking) {
      if (booking.status === 'ARRIVED') status = 'seated'
      else if (booking.status === 'CONFIRMED' || booking.status === 'PENDING') status = 'reserved'
      else if (booking.status === 'COMPLETED') status = 'completed'
      else if (booking.status === 'CANCELLED') status = 'noshow'
    }

    return { id, capacity, label: labels[i % 12], status, booking }
  })

  const timeSlots = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']

  const statusCounts = [
    { name: 'Da confermare', value: stats.pendingBookings, color: '#D4AF37' },
    { name: 'Confermate', value: stats.confirmedBookings, color: '#E5C158' },
    { name: 'Arrivati', value: stats.arrivedBookings, color: '#00D4FF' },
    { name: 'Lista attesa', value: stats.waitlistBookings, color: '#f97316' },
    { name: 'Completate', value: stats.completedBookings, color: '#22c55e' },
    { name: 'Eliminate', value: stats.cancelledBookings, color: '#ef4444' },
  ]

  const tableBorderColor = (status: string) => {
    switch (status) {
      case 'seated': return '#00D4FF'
      case 'reserved': return '#D4AF37'
      case 'completed': return '#22c55e'
      case 'noshow': return '#ef4444'
      default: return '#2a2a2a'
    }
  }

  const tableGlow = (status: string) => {
    switch (status) {
      case 'seated': return '0 0 20px rgba(0,212,255,0.4), 0 0 40px rgba(0,212,255,0.1)'
      case 'reserved': return '0 0 15px rgba(212,175,55,0.3)'
      default: return 'none'
    }
  }

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh', color: '#fff', margin: '-24px', padding: '0' }}>
      {/* Mobile menu overlay */}
      {mobileMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={() => setMobileMenu(false)} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 280, background: '#111', padding: 24, borderRight: '1px solid #222' }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ color: '#D4AF37', fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>NETFOOD</h2>
              <p style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{businessName}</p>
            </div>
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: '#555', fontSize: 10, fontWeight: 600, letterSpacing: 2, marginBottom: 12 }}>SERVIZIO</p>
              <NavItem label="Floor & Timeline" active onClick={() => setMobileMenu(false)} />
              <NavItem label="Prenotazioni" href="/admin/prenotazioni" />
              <NavItem label="Lista d'attesa" />
            </div>
            <div>
              <p style={{ color: '#555', fontSize: 10, fontWeight: 600, letterSpacing: 2, marginBottom: 12 }}>GESTIONE</p>
              <NavItem label="Servizi / Menu" href="/admin/servizi" />
              <NavItem label="Clienti" href="/admin/clienti" />
              <NavItem label="Impostazioni" href="/admin/impostazioni" />
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setMobileMenu(true)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          {businessLogo ? (
            <img src={businessLogo} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #D4AF37, #B8860B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
              {businessName.charAt(0)}
            </div>
          )}
          <div>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Service {currentTime}</span>
            <span style={{ color: '#555', fontSize: 11, display: 'block' }}>{businessName}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            + Walk-in
          </button>
          <a href="/admin/prenotazioni" style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)', color: '#0D0D0D', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            + Prenotazione
          </a>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <StatBox label="SEDUTI ORA" value={stats.seatedNow} sub={`${stats.seatedGuests} ospiti`} color="#00D4FF" />
        <StatBox label="IN ARRIVO < 60 MIN" value={stats.arrivingSoon} sub={`${stats.arrivingSoonParties} persone`} color="#D4AF37" />
        <StatBox label="COPERTI OGGI" value={stats.coversToday} sub="" color="#8b5cf6" />
        <StatBox label="PRENOTAZIONI" value={stats.todayBookings} sub={`${stats.totalBookings} totali`} color="#E5C158" />
        <StatBox label="LISTA D'ATTESA" value={stats.waitlistCount} sub={`${stats.waitlistCount} in attesa`} color="#f97316" />
      </div>

      {/* Controls Bar */}
      <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button style={{ background: '#1a1a1a', color: '#ccc', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          {now.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4l3 3 3-3" /></svg>
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAreaDropdown(!showAreaDropdown)}
            style={{ background: '#1a1a1a', color: '#ccc', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {selectedArea}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4l3 3 3-3" /></svg>
          </button>
          {showAreaDropdown && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, minWidth: 180, zIndex: 10, overflow: 'hidden' }}>
              {areas.map(a => (
                <button key={a} onClick={() => { setSelectedArea(a); setShowAreaDropdown(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: selectedArea === a ? '#D4AF37' : '#888', fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
                  {selectedArea === a && <span style={{ color: '#D4AF37' }}>&#10003;</span>}
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #2a2a2a' }}>
          <button
            onClick={() => setActiveView('floor')}
            style={{ background: activeView === 'floor' ? '#D4AF3720' : '#1a1a1a', color: activeView === 'floor' ? '#D4AF37' : '#666', border: 'none', padding: '6px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRight: '1px solid #2a2a2a' }}
          >
            # Floor Plan
          </button>
          <button
            onClick={() => setActiveView('timeline')}
            style={{ background: activeView === 'timeline' ? '#D4AF3720' : '#1a1a1a', color: activeView === 'timeline' ? '#D4AF37' : '#666', border: 'none', padding: '6px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Timeline
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
          <span style={{ color: '#666', fontSize: 11, whiteSpace: 'nowrap' }}>{currentTime}</span>
          <div style={{ flex: 1, height: 4, background: '#1a1a1a', borderRadius: 4, position: 'relative' }}>
            <div style={{ position: 'absolute', left: '50%', top: -8, transform: 'translateX(-50%)', background: '#D4AF37', color: '#0D0D0D', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, letterSpacing: 1 }}>LIVE</div>
          </div>
          <span style={{ color: '#666', fontSize: 11 }}>23:00</span>
        </div>

        <a href="/admin/impostazioni" style={{ background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          Modifica
        </a>
      </div>

      {/* Main View */}
      <div style={{ padding: '0 24px 24px' }}>
        {activeView === 'floor' ? (
          /* FLOOR PLAN VIEW */
          <div style={{ background: '#111', borderRadius: 16, border: '1px solid #1a1a1a', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#D4AF37' }}>{selectedArea}</h2>
              <div style={{ display: 'flex', gap: 16 }}>
                <Legend color="#2a2a2a" label="Disponibile" />
                <Legend color="#D4AF37" label="Prenotato" />
                <Legend color="#00D4FF" label="Seduto" glow />
                <Legend color="#22c55e" label="Completato" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
              {tables.map((t) => (
                <div key={t.id} style={{
                  background: '#0D0D0D',
                  border: `2px solid ${tableBorderColor(t.status)}`,
                  borderRadius: t.capacity <= 4 ? '50%' : 16,
                  width: t.capacity <= 4 ? 120 : '100%',
                  height: t.capacity <= 4 ? 120 : 100,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: t.capacity <= 4 ? '0 auto' : 0,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: tableGlow(t.status),
                  position: 'relative',
                }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: t.status === 'seated' ? '#00D4FF' : t.status === 'reserved' ? '#D4AF37' : '#555' }}>{t.id}</span>
                  <span style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{t.capacity}p{t.label ? ` - ${t.label}` : ''}</span>
                  {t.booking && (
                    <span style={{ fontSize: 10, color: t.status === 'seated' ? '#00D4FF' : '#D4AF37', marginTop: 4, maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.booking.customerName} ({t.booking.numberOfPeople || '?'})
                    </span>
                  )}
                  {t.status === 'seated' && (
                    <div style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: '50%', background: '#00D4FF', boxShadow: '0 0 8px #00D4FF' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* TIMELINE VIEW */
          <div style={{ background: '#111', borderRadius: 16, border: '1px solid #1a1a1a', overflow: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${timeSlots.length}, 1fr)`, minWidth: 900 }}>
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a1a', borderRight: '1px solid #1a1a1a', background: '#0D0D0D', position: 'sticky', left: 0, zIndex: 2 }}>
                <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>TAVOLO</span>
              </div>
              {timeSlots.map(t => (
                <div key={t} style={{ padding: '12px 8px', borderBottom: '1px solid #1a1a1a', borderRight: '1px solid #151515', textAlign: 'center' }}>
                  <span style={{ fontSize: 11, color: '#555', fontWeight: 500 }}>{t}</span>
                </div>
              ))}

              {/* Rows */}
              {tables.slice(0, 10).map((table) => {
                const tableBookings = todayBookings.filter(b => {
                  const tn = b.notes?.match(/T(\d+)/i)
                  return tn && `T${tn[1]}` === table.id
                })

                return (
                  <div key={table.id} style={{ display: 'contents' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #1a1a1a', borderRight: '1px solid #1a1a1a', background: '#0D0D0D', position: 'sticky', left: 0, zIndex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>{table.id}</span>
                      <span style={{ fontSize: 10, color: '#555' }}>{table.capacity}p</span>
                    </div>
                    <div style={{ gridColumn: `2 / span ${timeSlots.length}`, borderBottom: '1px solid #1a1a1a', position: 'relative', minHeight: 48 }}>
                      {tableBookings.map((b) => {
                        const [h, m] = b.time.split(':').map(Number)
                        const startHour = h + m / 60
                        const durationHours = (b.duration || 90) / 60
                        const startOffset = Math.max(0, ((startHour - 12) / timeSlots.length) * 100)
                        const widthPct = (durationHours / timeSlots.length) * 100

                        const isSeated = b.status === 'ARRIVED'
                        const bgColor = isSeated ? 'rgba(0,212,255,0.15)' : 'rgba(212,175,55,0.15)'
                        const borderColor = isSeated ? '#00D4FF' : '#D4AF37'
                        const textColor = isSeated ? '#00D4FF' : '#D4AF37'

                        return (
                          <div key={b.id} style={{
                            position: 'absolute',
                            left: `${startOffset}%`,
                            width: `${widthPct}%`,
                            top: 6,
                            bottom: 6,
                            background: bgColor,
                            border: `1px solid ${borderColor}`,
                            borderRadius: 6,
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            overflow: 'hidden',
                            cursor: 'pointer',
                          }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: textColor, whiteSpace: 'nowrap' }}>
                              {b.customerName} ({b.numberOfPeople || '?'})
                            </span>
                            <span style={{ fontSize: 10, color: '#666', whiteSpace: 'nowrap' }}>
                              {b.time} - {`${Math.floor(h + (b.duration || 90) / 60)}:${String((m + (b.duration || 90) % 60) % 60).padStart(2, '0')}`}
                            </span>
                          </div>
                        )
                      })}
                      {/* Grid lines */}
                      {timeSlots.map((_, i) => (
                        <div key={i} style={{ position: 'absolute', left: `${(i / timeSlots.length) * 100}%`, top: 0, bottom: 0, borderLeft: '1px solid #151515' }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div style={{ padding: '0 24px 24px' }}>
        <DashboardCharts
          statusCounts={statusCounts}
          dailyBookings={dailyBookings}
          capacityData={capacityData.length > 0 ? capacityData : undefined}
        />
      </div>

      {/* Bottom Panels */}
      <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent Bookings */}
        <div style={{ background: '#111', borderRadius: 16, border: '1px solid #1a1a1a', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Ultime {bookingLabel}</h3>
            <a href="/admin/prenotazioni" style={{ fontSize: 11, color: '#D4AF37', textDecoration: 'none' }}>Vedi tutte</a>
          </div>
          {recentBookings.length === 0 ? (
            <p style={{ color: '#555', fontSize: 12, textAlign: 'center', padding: 24 }}>Nessuna prenotazione</p>
          ) : (
            <div>
              {recentBookings.slice(0, 6).map((b) => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${STATUS_COLORS[b.status] || '#555'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLORS[b.status] || '#555' }}>{b.customerName.charAt(0)}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#ddd' }}>{b.customerName}</p>
                      <p style={{ fontSize: 10, color: '#555' }}>{b.service?.name || 'Generico'} - {new Date(b.date).toLocaleDateString('it-IT')} {b.time}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: `${STATUS_COLORS[b.status] || '#555'}15`, color: STATUS_COLORS[b.status] || '#555' }}>
                    {STATUS_LABELS[b.status] || b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div style={{ background: '#111', borderRadius: 16, border: '1px solid #1a1a1a', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Ultime Conversazioni</h3>
            <a href="/admin/conversazioni" style={{ fontSize: 11, color: '#D4AF37', textDecoration: 'none' }}>Vedi tutte</a>
          </div>
          {recentConversations.length === 0 ? (
            <p style={{ color: '#555', fontSize: 12, textAlign: 'center', padding: 24 }}>Nessuna conversazione</p>
          ) : (
            <div>
              {recentConversations.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: c.status === 'ACTIVE' ? 'rgba(34,197,94,0.12)' : 'rgba(85,85,85,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c.status === 'ACTIVE' ? '#22c55e' : '#555' }}>
                        {(c.customerName || c.customerPhone).charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#ddd' }}>{c.customerName || c.customerPhone}</p>
                      <p style={{ fontSize: 10, color: '#555' }}>{c.channel} - {new Date(c.createdAt).toLocaleDateString('it-IT')}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: c.status === 'ACTIVE' ? 'rgba(34,197,94,0.12)' : 'rgba(85,85,85,0.12)', color: c.status === 'ACTIVE' ? '#22c55e' : '#555' }}>
                    {c.status === 'ACTIVE' ? 'Attiva' : 'Chiusa'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ background: '#111', borderRadius: 16, border: '1px solid #1a1a1a', padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Esporta Dati</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: `${serviceLabel} (Excel)`, href: '/api/export/services?format=csv' },
              { label: `${serviceLabel} (PDF)`, href: '/api/export/services?format=pdf' },
              { label: 'Clienti (Excel)', href: '/api/export/customers?format=csv' },
              { label: 'Clienti (PDF)', href: '/api/export/customers?format=pdf' },
            ].map(exp => (
              <a key={exp.label} href={exp.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0D0D', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px 14px', color: '#888', fontSize: 12, textDecoration: 'none', transition: 'all 0.2s' }}>
                {exp.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div style={{ background: '#111', borderRadius: 12, border: '1px solid #1a1a1a', padding: '16px 14px', textAlign: 'center' }}>
      <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: '#555', marginBottom: 8, textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#444', marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

function Legend({ color, label, glow }: { color: string; label: string; glow?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: glow ? `0 0 8px ${color}` : 'none' }} />
      <span style={{ fontSize: 10, color: '#666' }}>{label}</span>
    </div>
  )
}

function NavItem({ label, active, href, onClick }: { label: string; active?: boolean; href?: string; onClick?: () => void }) {
  const style = {
    display: 'block',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 13,
    color: active ? '#D4AF37' : '#888',
    background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
    textDecoration: 'none' as const,
    cursor: 'pointer' as const,
    marginBottom: 2,
    border: 'none' as const,
    width: '100%' as const,
    textAlign: 'left' as const,
  }

  if (href) return <a href={href} style={style}>{label}</a>
  return <button onClick={onClick} style={style}>{label}</button>
}
