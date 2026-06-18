'use client'

import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface ChartData {
  statusCounts: { name: string; value: number; color: string }[]
  dailyBookings: { day: string; count: number }[]
  capacityData?: { label: string; used: number; max: number }[]
}

export default function DashboardCharts({ statusCounts, dailyBookings, capacityData }: ChartData) {
  const hasStatusData = statusCounts.some((s) => s.value > 0)
  const hasDailyData = dailyBookings.some((d) => d.count > 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Area Chart */}
      <div style={{ background: '#111', borderRadius: 16, border: '1px solid #1a1a1a', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Trend Prenotazioni</h3>
          <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>7 giorni</span>
        </div>
        {hasDailyData ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyBookings}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="day" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, color: '#fff', fontSize: 12 }}
                labelStyle={{ color: '#D4AF37' }}
              />
              <Area type="monotone" dataKey="count" name="Prenotazioni" stroke="#D4AF37" strokeWidth={2} fill="url(#goldGradient)" dot={{ fill: '#D4AF37', r: 3, stroke: '#111', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#D4AF37', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#333', fontSize: 12 }}>Nessun dato</p>
          </div>
        )}
      </div>

      {/* Donut */}
      <div style={{ background: '#111', borderRadius: 16, border: '1px solid #1a1a1a', padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Distribuzione Stato</h3>
        {hasStatusData ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 180, height: 180, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusCounts.filter(s => s.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {statusCounts.filter(s => s.value > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, color: '#fff', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
              {statusCounts.filter(s => s.value > 0).map((s) => {
                const total = statusCounts.reduce((a, x) => a + x.value, 0)
                const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
                return (
                  <div key={s.name} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}60` }} />
                        <span style={{ fontSize: 11, color: '#888' }}>{s.name}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#ddd' }}>{s.value} ({pct}%)</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 3, background: '#1a1a1a', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: s.color, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#333', fontSize: 12 }}>Nessun dato</p>
          </div>
        )}
      </div>

      {/* Capacity */}
      {capacityData && capacityData.length > 0 && (
        <div style={{ gridColumn: 'span 2', background: '#111', borderRadius: 16, border: '1px solid #1a1a1a', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Capacita in Tempo Reale</h3>
            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,212,255,0.1)', color: '#00D4FF', fontWeight: 600 }}>LIVE</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${capacityData.length}, 1fr)`, gap: 24 }}>
            {capacityData.map((item) => {
              const pct = item.max > 0 ? Math.round((item.used / item.max) * 100) : 0
              const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f97316' : '#00D4FF'
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#888' }}>{item.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: barColor }}>{item.used}/{item.max}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 6, background: '#1a1a1a', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 6, width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}aa)`, boxShadow: `0 0 10px ${barColor}30`, transition: 'width 0.5s' }} />
                  </div>
                  <p style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
                    {pct}% occupato
                    {pct >= 90 && <span style={{ color: '#ef4444', marginLeft: 6 }}>PIENO</span>}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
