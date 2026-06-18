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
        className="mb-6 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
        style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}
      >
        + Aggiungi FAQ
      </button>

      {showForm && (
        <div className="rounded-xl shadow-sm border p-6 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{editing ? 'Modifica' : 'Nuova'} FAQ</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Domanda</label>
              <input
                name="question"
                defaultValue={editing?.question}
                required
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="Es: Avete parcheggio?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Risposta</label>
              <textarea
                name="answer"
                defaultValue={editing?.answer}
                required
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="Es: Sì, abbiamo un parcheggio gratuito per i clienti..."
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50" style={{ background: 'var(--accent)' }}>
                {loading ? 'Salvataggio...' : 'Salva'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {faqs.length === 0 ? (
        <div className="rounded-xl shadow-sm border p-12 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Nessuna FAQ ancora. L&apos;AI risponderà solo con le info base della tua attività.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((f) => (
            <div key={f.id} className="rounded-xl shadow-sm border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{f.question}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{f.answer}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => { setEditing(f); setShowForm(true) }} className="text-xs hover:underline" style={{ color: 'var(--accent)' }}>Modifica</button>
                  <button onClick={() => deleteFaq(f.id)} className="text-xs hover:underline" style={{ color: '#ef4444' }}>Elimina</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
