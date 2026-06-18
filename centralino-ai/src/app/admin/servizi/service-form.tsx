'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Service {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  duration: number | null
  isAvailable: boolean
  sortOrder: number
}

interface Props {
  services: Service[]
  businessId: string
  categories: readonly string[]
  serviceLabel: string
}

export default function ServiceForm({ services, businessId, categories, serviceLabel }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [loading, setLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [csvText, setCsvText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const data = {
      name: form.get('name') as string,
      description: form.get('description') as string || null,
      category: form.get('category') as string || null,
      price: form.get('price') ? parseFloat(form.get('price') as string) : null,
      duration: form.get('duration') ? parseInt(form.get('duration') as string) : null,
      isAvailable: true,
      businessId,
    }

    const url = editing ? `/api/services?id=${editing.id}` : '/api/services'
    const method = editing ? 'PUT' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    setShowForm(false)
    setEditing(null)
    setLoading(false)
    router.refresh()
  }

  async function toggleAvailability(id: string, isAvailable: boolean) {
    await fetch(`/api/services?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !isAvailable }),
    })
    router.refresh()
  }

  async function deleteService(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questo servizio?')) return
    await fetch(`/api/services?id=${id}`, { method: 'DELETE' })
    router.refresh()
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImportLoading(true)
    setImportMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/import/services', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        setImportMessage({ type: 'error', text: data.error || 'Errore nell\'importazione' })
      } else {
        setImportMessage({ type: 'success', text: `${data.count} servizi importati con successo!` })
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
      const res = await fetch('/api/import/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      })

      const data = await res.json()
      if (!res.ok) {
        setImportMessage({ type: 'error', text: data.error || 'Errore nell\'importazione' })
      } else {
        setImportMessage({ type: 'success', text: `${data.count} servizi importati con successo!` })
        setCsvText('')
        router.refresh()
      }
    } catch {
      setImportMessage({ type: 'error', text: 'Errore nell\'importazione' })
    } finally {
      setImportLoading(false)
    }
  }

  const grouped = services.reduce((acc, s) => {
    const cat = s.category || 'Altro'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setShowForm(true); setEditing(null) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Aggiungi {serviceLabel}
        </button>
        <button
          onClick={() => setShowImport(!showImport)}
          className="bg-[var(--bg-card)] text-[var(--text-primary)] px-4 py-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-colors text-sm font-medium"
        >
          Importa (CSV / PDF)
        </button>
      </div>

      {showImport && (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 mb-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">Importa Servizi / Menu</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Carica un file <strong>PDF</strong> (menu, listino prezzi) o <strong>CSV</strong> (Nome;Categoria;Descrizione;Prezzo;Durata).
            Il sistema legge automaticamente prodotti, categorie e prezzi dal file.
          </p>

          <div className="space-y-4">
            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Carica file PDF o CSV</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.pdf,application/pdf"
                onChange={handleFileImport}
                disabled={importLoading}
                className="block w-full text-sm text-[var(--text-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-[var(--border-color)]" />
              <span className="text-xs text-[var(--text-muted)]">oppure incolla i dati</span>
              <div className="flex-1 h-px bg-[var(--border-color)]" />
            </div>

            {/* Paste area */}
            <div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm font-mono"
                placeholder={"Nome;Categoria;Descrizione;Prezzo;Durata\nTaglio Uomo;Tagli;Taglio classico;15;30\nPiega Donna;Piega;Piega con phon;20;45"}
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
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 mb-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">{editing ? 'Modifica' : 'Nuovo'} {serviceLabel}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nome</label>
                <input name="name" defaultValue={editing?.name} required className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Categoria</label>
                <select name="category" defaultValue={editing?.category || ''} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm">
                  <option value="">Seleziona...</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Descrizione</label>
              <textarea name="description" defaultValue={editing?.description || ''} rows={2} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Prezzo (EUR)</label>
                <input name="price" type="number" step="0.01" defaultValue={editing?.price || ''} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Durata (minuti)</label>
                <input name="duration" type="number" defaultValue={editing?.duration || ''} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Salvataggio...' : 'Salva'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 rounded-lg text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-12 text-center">
          <p className="text-[var(--text-muted)]">Nessun servizio ancora. Clicca "Aggiungi" per iniziare.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-2">{category}</h3>
            <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] divide-y divide-[var(--border-color)]">
              {items.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${s.isAvailable ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] line-through'}`}>{s.name}</span>
                      {!s.isAvailable && <span className="text-xs bg-[var(--bg-secondary)] text-[var(--text-muted)] px-2 py-0.5 rounded">Non disponibile</span>}
                    </div>
                    {s.description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.description}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    {s.price && <span className="text-sm font-medium text-[var(--text-secondary)]">{'€'}{s.price.toFixed(2)}</span>}
                    {s.duration && <span className="text-xs text-[var(--text-muted)]">{s.duration} min</span>}
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(s); setShowForm(true) }} className="text-xs text-blue-600 hover:underline">Modifica</button>
                      <button onClick={() => toggleAvailability(s.id, s.isAvailable)} className="text-xs text-yellow-600 hover:underline">
                        {s.isAvailable ? 'Disattiva' : 'Attiva'}
                      </button>
                      <button onClick={() => deleteService(s.id)} className="text-xs text-red-600 hover:underline">Elimina</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
