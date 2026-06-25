'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface KnowledgeNote {
  id: string
  title: string
  content: string
  tags: string | null
  source: string
  fileName: string | null
  isActive: boolean
  createdAt: string
}

export default function KnowledgeClient({
  notes,
  businessId,
}: {
  notes: KnowledgeNote[]
  businessId: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<KnowledgeNote | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: string[]; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const data = {
      title: form.get('title') as string,
      content: form.get('content') as string,
      tags: form.get('tags') as string,
      businessId,
    }

    const url = editing ? `/api/knowledge?id=${editing.id}` : '/api/knowledge'
    const method = editing ? 'PUT' : 'POST'

    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })

    setShowForm(false)
    setEditing(null)
    setLoading(false)
    router.refresh()
  }

  async function deleteNote(id: string) {
    if (!confirm('Eliminare questa nota?')) return
    await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' })
    router.refresh()
  }

  async function toggleActive(note: KnowledgeNote) {
    await fetch(`/api/knowledge?id=${note.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !note.isActive }),
    })
    router.refresh()
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !files.length) return

    setImporting(true)
    setImportResult(null)

    const formData = new FormData()
    for (const file of Array.from(files)) {
      formData.append('files', file)
    }

    const res = await fetch('/api/knowledge/import', { method: 'POST', body: formData })
    const result = await res.json()
    setImportResult(result)
    setImporting(false)

    if (fileInputRef.current) fileInputRef.current.value = ''
    router.refresh()
  }

  const activeCount = notes.filter(n => n.isActive).length

  return (
    <div>
      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => { setShowForm(true); setEditing(null) }}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}
        >
          + Nuova nota
        </button>
        <label
          className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
          style={{
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.3)',
            color: '#22d3ee',
          }}
        >
          {importing ? 'Importazione...' : '⬆ Importa da Obsidian (.md)'}
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            multiple
            className="hidden"
            onChange={handleImport}
            disabled={importing}
          />
        </label>
      </div>

      {/* Import result */}
      {importResult && (
        <div
          className="rounded-xl border p-4 mb-6"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          {importResult.created.length > 0 && (
            <p className="text-sm mb-1" style={{ color: '#4ade80' }}>
              ✓ Importate: {importResult.created.join(', ')}
            </p>
          )}
          {importResult.errors.length > 0 && (
            <p className="text-sm" style={{ color: '#f87171' }}>
              ✗ Errori: {importResult.errors.join(', ')}
            </p>
          )}
          <button
            onClick={() => setImportResult(null)}
            className="text-xs mt-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Chiudi
          </button>
        </div>
      )}

      {/* Status bar */}
      {notes.length > 0 && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          {activeCount} di {notes.length} note attive — il bot le usa tutte
        </p>
      )}

      {/* Form */}
      {showForm && (
        <div
          className="rounded-xl shadow-sm border p-6 mb-6"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {editing ? 'Modifica nota' : 'Nuova nota'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Titolo
              </label>
              <input
                name="title"
                defaultValue={editing?.title}
                required
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="Es: Politica parcheggio, Allergeni, Come arrivarci..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Contenuto (Markdown)
              </label>
              <textarea
                name="content"
                defaultValue={editing?.content}
                required
                rows={8}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="Scrivi qui le informazioni che l'AI deve conoscere..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Tag (opzionale, separati da virgola)
              </label>
              <input
                name="tags"
                defaultValue={editing?.tags || ''}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="Es: menu, allergeni, orari"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {loading ? 'Salvataggio...' : 'Salva'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null) }}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {notes.length === 0 ? (
        <div
          className="rounded-xl shadow-sm border p-12 text-center"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <p className="text-4xl mb-3">📓</p>
          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Nessuna nota ancora
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Crea note manualmente oppure importa file .md dal tuo vault Obsidian.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl shadow-sm border p-4"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                opacity: note.isActive ? 1 : 0.5,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {note.title}
                    </p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: note.source === 'OBSIDIAN' ? 'rgba(139,92,246,0.15)' : 'rgba(6,182,212,0.1)',
                        color: note.source === 'OBSIDIAN' ? '#a78bfa' : '#22d3ee',
                        border: `1px solid ${note.source === 'OBSIDIAN' ? 'rgba(139,92,246,0.3)' : 'rgba(6,182,212,0.2)'}`,
                      }}
                    >
                      {note.source === 'OBSIDIAN' ? '🔮 Obsidian' : '✏️ Manuale'}
                    </span>
                    {!note.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(100,116,139,0.2)', color: '#64748b' }}>
                        Disattivata
                      </span>
                    )}
                  </div>
                  {note.tags && (
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      🏷 {note.tags}
                    </p>
                  )}
                  <p
                    className="text-sm"
                    style={{
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {note.content}
                  </p>
                  {note.fileName && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      📄 {note.fileName}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(note)}
                    className="text-xs hover:underline"
                    style={{ color: note.isActive ? '#f59e0b' : '#4ade80' }}
                  >
                    {note.isActive ? 'Disattiva' : 'Attiva'}
                  </button>
                  <button
                    onClick={() => { setEditing(note); setShowForm(true) }}
                    className="text-xs hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    Modifica
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-xs hover:underline"
                    style={{ color: '#ef4444' }}
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
