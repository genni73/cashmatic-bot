'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FAQ {
  id: string
  question: string
  answer: string
  isActive: boolean
  sortOrder: number
}

export default function FAQClient({ faqs, businessId }: { faqs: FAQ[]; businessId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FAQ | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const data = {
      question: form.get('question') as string,
      answer: form.get('answer') as string,
      businessId,
    }

    const url = editing ? `/api/faqs?id=${editing.id}` : '/api/faqs'
    const method = editing ? 'PUT' : 'POST'

    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })

    setShowForm(false)
    setEditing(null)
    setLoading(false)
    router.refresh()
  }

  async function deleteFaq(id: string) {
    if (!confirm('Eliminare questa FAQ?')) return
    await fetch(`/api/faqs?id=${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div>
      <button
        onClick={() => { setShowForm(true); setEditing(null) }}
        className="mb-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        + Aggiungi FAQ
      </button>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold mb-4">{editing ? 'Modifica' : 'Nuova'} FAQ</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domanda</label>
              <input
                name="question"
                defaultValue={editing?.question}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
                placeholder="Es: Avete parcheggio?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risposta</label>
              <textarea
                name="answer"
                defaultValue={editing?.answer}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
                placeholder="Es: Sì, abbiamo un parcheggio gratuito per i clienti..."
              />
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

      {faqs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Nessuna FAQ ancora. L'AI risponderà solo con le info base della tua attività.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((f) => (
            <div key={f.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{f.question}</p>
                  <p className="text-gray-600 text-sm mt-1">{f.answer}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => { setEditing(f); setShowForm(true) }} className="text-xs text-blue-600 hover:underline">Modifica</button>
                  <button onClick={() => deleteFaq(f.id)} className="text-xs text-red-600 hover:underline">Elimina</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
