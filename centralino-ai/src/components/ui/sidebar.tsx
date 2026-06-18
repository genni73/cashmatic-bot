'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-provider'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/servizi', label: 'Servizi / Menu', icon: '📋' },
  { href: '/admin/prenotazioni', label: 'Prenotazioni', icon: '📅' },
  { href: '/admin/clienti', label: 'Clienti', icon: '👥' },
  { href: '/admin/conversazioni', label: 'Conversazioni', icon: '💬' },
  { href: '/admin/faq', label: 'FAQ', icon: '❓' },
  { href: '/admin/impostazioni', label: 'Impostazioni', icon: '⚙️' },
]

interface SidebarProps {
  businessName: string
  businessType: string
  logoUrl?: string | null
}

export default function Sidebar({ businessName, businessType, logoUrl }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: '260px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0c1222 0%, #0f172a 100%)',
        color: 'var(--sidebar-text)',
        borderRight: '1px solid rgba(6, 182, 212, 0.1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(6, 182, 212, 0.3)',
              }}
            />
          ) : (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 700,
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              {businessName.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ overflow: 'hidden' }}>
            <h1 style={{ fontSize: '15px', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
              Netfood Centralino AI
            </h1>
            <p
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                margin: '2px 0 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {businessName}
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: '11px',
            background: 'rgba(6, 182, 212, 0.15)',
            color: '#22d3ee',
            padding: '3px 10px',
            borderRadius: '9999px',
            border: '1px solid rgba(6, 182, 212, 0.25)',
          }}
        >
          {businessType}
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1))'
                      : 'transparent',
                    boxShadow: isActive
                      ? '0 0 20px rgba(6, 182, 212, 0.15), inset 0 0 0 1px rgba(6, 182, 212, 0.25)'
                      : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      const el = e.currentTarget
                      el.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))'
                      el.style.color = '#e2e8f0'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      const el = e.currentTarget
                      el.style.background = 'transparent'
                      el.style.color = '#94a3b8'
                    }
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '16px 12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <ThemeToggle />
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            style={{
              width: '100%',
              textAlign: 'left',
              fontSize: '14px',
              color: '#64748b',
              background: 'transparent',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.color = '#f87171'
              el.style.background = 'rgba(239,68,68,0.1)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.color = '#64748b'
              el.style.background = 'transparent'
            }}
          >
            <span style={{ fontSize: '18px' }}>🚪</span>
            Esci
          </button>
        </form>
      </div>
    </aside>
  )
}
