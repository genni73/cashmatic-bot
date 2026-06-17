'use client'

import { useState } from 'react'
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
  const [editing, setEditing] = useState<Service | null>(null)
  const [loading, setLoading] = useState(false)
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

  const grouped = services.reduce((acc, s) => {
    const cat = s.category || 'Altro'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div>
      <button
        onClick={() => { setShowForm(true); setEditing(null) }}
        className="mb-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        + Aggiungi {serviceLabel}
      </button>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold mb-4">{editing ? 'Modifica' : 'Nuovo'} {serviceLabel}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input name="name" defaultValue={editing?.name} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select name="category" defaultValue={editing?.category || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm">
                  <option value="">Seleziona...</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
              <textarea name="description" defaultValue={editing?.description || ''} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (EUR)</label>
                <input name="price" type="number" step="0.01" defaultValue={editing?.price || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durata (minuti)</label>
                <input name="duration" type="number" defaultValue={editing?.duration || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Salvataggio...' : 'Salva'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-700 hover:bg-gray-50">
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Nessun servizio ancora. Clicca "Aggiungi" per iniziare.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">{category}</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
              {items.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${s.isAvailable ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{s.name}</span>
                      {!s.isAvailable && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Non disponibile</span>}
                    </div>
                    {s.description && <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    {s.price && <span className="text-sm font-medium text-gray-700">{'€'}{s.price.toFixed(2)}</span>}
                    {s.duration && <span className="text-xs text-gray-500">{s.duration} min</span>}
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
