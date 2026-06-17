'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/servizi', label: 'Servizi / Menu', icon: '📋' },
  { href: '/admin/prenotazioni', label: 'Prenotazioni', icon: '📅' },
  { href: '/admin/conversazioni', label: 'Conversazioni', icon: '💬' },
  { href: '/admin/faq', label: 'FAQ', icon: '❓' },
  { href: '/admin/impostazioni', label: 'Impostazioni', icon: '⚙️' },
]

export default function Sidebar({ businessName, businessType }: { businessName: string; businessType: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-lg font-bold">Centralino AI</h1>
        <p className="text-sm text-gray-400 mt-1">{businessName}</p>
        <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full mt-2 inline-block">{businessType}</span>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="w-full text-left text-sm text-gray-400 hover:text-white px-3 py-2">
            Esci
          </button>
        </form>
      </div>
    </aside>
  )
}
