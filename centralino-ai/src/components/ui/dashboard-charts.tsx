'use client'

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ChartData {
  statusCounts: { name: string; value: number; color: string }[]
  dailyBookings: { day: string; count: number }[]
}

export default function DashboardCharts({ statusCounts, dailyBookings }: ChartData) {
  const hasStatusData = statusCounts.some((s) => s.value > 0)
  const hasDailyData = dailyBookings.some((d) => d.count > 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Pie Chart - Booking Statuses */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">
          Stato Prenotazioni
        </h3>
        {hasStatusData ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusCounts}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-[var(--text-muted)]">
            Nessun dato disponibile
          </div>
        )}
      </div>

      {/* Bar Chart - Daily Bookings */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">
          Prenotazioni Ultimi 7 Giorni
        </h3>
        {hasDailyData ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyBookings}>
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border-color)' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border-color)' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
              <Bar dataKey="count" name="Prenotazioni" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-[var(--text-muted)]">
            Nessun dato disponibile
          </div>
        )}
      </div>
    </div>
  )
}
