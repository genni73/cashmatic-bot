'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Customer {
  name: string
  phone: string
  email: string
  totalBookings: number
  lastVisit: string
  source: string
}

export default function ClientiClient({ customers, totalBookings }: { customers: Customer[]; totalBookings: number }) {
  const [showImport, setShowImport] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [csvText, setCsvText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImportLoading(true)
    setImportMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/import/customers', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        setImportMessage({ type: 'error', text: data.error || 'Errore nell\'importazione' })
      } else {
        setImportMessage({ type: 'success', text: `${data.count} clienti importati con successo!` })
        router.refresh()
      }
    } catch {
      setImportMessage({ type: 'error', text: 'Errore nell\'importazione del file' })
    } finally {
      setImportLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handlePasteImport() {
    if (!csvText.trim()) return

    setImportLoading(true)
    setImportMessage(null)

    try {
      const res = await fetch('/api/import/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      })

      const data = await res.json()
      if (!res.ok) {
        setImportMessage({ type: 'error', text: data.error || 'Errore nell\'importazione' })
      } else {
        setImportMessage({ type: 'success', text: `${data.count} clienti importati con successo!` })
        setCsvText('')
        router.refresh()
      }
    } catch {
      setImportMessage({ type: 'error', text: 'Errore nell\'importazione' })
    } finally {
      setImportLoading(false)
    }
  }

  const habitual = customers.filter(c => c.totalBookings >= 3).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Clienti</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(!showImport)}
            className="px-4 py-2 text-sm rounded-lg border font-medium"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
          >
            Importa (CSV / PDF)
          </button>
          <a href="/api/export/customers?format=csv" className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}>
            Esporta Excel
          </a>
          <a href="/api/export/customers?format=pdf" className="px-4 py-2 text-sm rounded-lg border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}>
            Esporta PDF
          </a>
        </div>
      </div>

      {showImport && (
        <div className="rounded-xl shadow-sm border p-6 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Importa Clienti</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Carica un file <strong>PDF</strong> (lista clienti con nome e telefono) o <strong>CSV</strong> (Nome;Telefono;Email).
            Il sistema legge automaticamente nomi, numeri e email dal file.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Carica file PDF o CSV</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.pdf,application/pdf"
                onChange={handleFileImport}
                disabled={importLoading}
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>oppure incolla i dati</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
            </div>

            <div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
                placeholder={"Nome;Telefono;Email\nMario Rossi;+393331234567;mario@email.com\nLuigi Bianchi;+393339876543;"}
              />
              <button
                onClick={handlePasteImport}
                disabled={importLoading || !csvText.trim()}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {importLoading ? 'Importazione...' : 'Importa'}
              </button>
            </div>

            {importMessage && (
              <p className={`text-sm ${importMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {importMessage.text}
              </p>
            )}

            <button
              type="button"
              onClick={() => { setShowImport(false); setImportMessage(null) }}
              className="text-sm hover:underline"
              style={{ color: 'var(--text-muted)' }}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderLeft: '3px solid #06b6d4' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Clienti Totali</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#06b6d4' }}>{customers.length}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderLeft: '3px solid #22c55e' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Clienti Abituali (3+)</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#22c55e' }}>{habitual}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderLeft: '3px solid #8b5cf6' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Prenotazioni Totali</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#8b5cf6' }}>{totalBookings}</p>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-xl shadow-sm border p-12 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Nessun cliente ancora. Importa clienti o appariranno qui con le prenotazioni.</p>
        </div>
      ) : (
        <div className="rounded-xl shadow-sm border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Cliente</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Telefono</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Email</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Prenotazioni</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Ultima Visita</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>Canale</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.phone} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{c.phone}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{c.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.totalBookings}</span>
                    {c.totalBookings >= 3 && <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>Abituale</span>}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{new Date(c.lastVisit).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>{c.source}</span>
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
