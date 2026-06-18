'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Business {
  id: string
  name: string
  type: string
  phone: string | null
  email: string | null
  website: string | null
  address: string | null
  city: string | null
  province: string | null
  zipCode: string | null
  description: string | null
  openingHours: string | null
  logoUrl: string | null
  aiTone: string | null
  aiWelcomeMessage: string | null
  aiClosingMessage: string | null
  whatsappToken: string | null
  whatsappPhoneId: string | null
}

const BUSINESS_TYPES = [
  { value: 'RESTAURANT', label: 'Ristorante' },
  { value: 'HAIR_SALON', label: 'Parrucchiere' },
  { value: 'BEAUTY_CENTER', label: 'Centro Estetico' },
  { value: 'MEDICAL_OFFICE', label: 'Studio Medico' },
  { value: 'DENTAL_OFFICE', label: 'Studio Dentistico' },
  { value: 'HOTEL', label: 'Hotel / B&B' },
  { value: 'GYM', label: 'Palestra' },
  { value: 'SPORTS_CENTER', label: 'Centro Sportivo' },
  { value: 'VETERINARY', label: 'Veterinario' },
  { value: 'REAL_ESTATE', label: 'Agenzia Immobiliare' },
  { value: 'AUTO_REPAIR', label: 'Officina / Carrozzeria' },
  { value: 'BAKERY', label: 'Pasticceria / Panificio' },
  { value: 'BAR', label: 'Bar / Caffetteria' },
  { value: 'CATERING', label: 'Catering / Banqueting' },
  { value: 'PHARMACY', label: 'Farmacia' },
  { value: 'OTHER', label: 'Altra Attività' },
]

export default function SettingsForm({ business }: { business: Business }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(business.logoUrl)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoMessage, setLogoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    const form = new FormData(e.currentTarget)
    const data: Record<string, string | null> = {}
    form.forEach((value, key) => {
      data[key] = (value as string) || null
    })

    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    setSaving(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoUploading(true)
    setLogoMessage(null)

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const res = await fetch('/api/settings/logo', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        setLogoMessage({ type: 'error', text: data.error || 'Errore nel caricamento' })
      } else {
        setLogoUrl(data.logoUrl)
        setLogoMessage({ type: 'success', text: 'Logo caricato con successo!' })
        router.refresh()
        setTimeout(() => setLogoMessage(null), 3000)
      }
    } catch {
      setLogoMessage({ type: 'error', text: 'Errore nel caricamento del logo' })
    } finally {
      setLogoUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Logo Upload */}
      <section className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Logo Attività</h2>
        <div className="flex items-center gap-6">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="w-20 h-20 rounded-full object-cover border-2 border-[var(--border-color)]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] flex items-center justify-center">
              <span className="text-[var(--text-muted)] text-xs text-center">Nessun logo</span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {logoUploading ? 'Caricamento...' : 'Carica Logo'}
            </button>
            <p className="text-xs text-[var(--text-muted)]">Max 500KB, formato immagine</p>
            {logoMessage && (
              <p className={`text-xs ${logoMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {logoMessage.text}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Info Attività */}
      <section className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Informazioni Attività</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nome Attività</label>
            <input name="name" defaultValue={business.name} required className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tipo</label>
            <select name="type" defaultValue={business.type} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm">
              {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Telefono</label>
            <input name="phone" defaultValue={business.phone || ''} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email</label>
            <input name="email" type="email" defaultValue={business.email || ''} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Sito Web</label>
            <input name="website" defaultValue={business.website || ''} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Città</label>
            <input name="city" defaultValue={business.city || ''} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Indirizzo</label>
            <input name="address" defaultValue={business.address || ''} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Provincia</label>
              <input name="province" defaultValue={business.province || ''} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">CAP</label>
              <input name="zipCode" defaultValue={business.zipCode || ''} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Descrizione</label>
          <textarea name="description" defaultValue={business.description || ''} rows={3} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Orari di Apertura</label>
          <textarea name="openingHours" defaultValue={business.openingHours || ''} rows={4} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" placeholder="Lun-Ven: 9:00-18:00&#10;Sab: 9:00-13:00&#10;Dom: Chiuso" />
        </div>
      </section>

      {/* AI Config */}
      <section className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Configurazione AI</h2>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tono dell'Assistente</label>
          <select name="aiTone" defaultValue={business.aiTone || 'FRIENDLY'} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm">
            <option value="FRIENDLY">Amichevole - Come un amico esperto</option>
            <option value="FORMAL">Formale - Usa il Lei, linguaggio curato</option>
            <option value="PROFESSIONAL">Professionale - Equilibrato e cordiale</option>
          </select>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Messaggio di Benvenuto</label>
          <input name="aiWelcomeMessage" defaultValue={business.aiWelcomeMessage || ''} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" placeholder="Es: Ciao! Benvenuto da Mario. Come posso aiutarti?" />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Messaggio di Chiusura</label>
          <input name="aiClosingMessage" defaultValue={business.aiClosingMessage || ''} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" placeholder="Es: Grazie per averci contattato! A presto!" />
        </div>
      </section>

      {/* WhatsApp Config */}
      <section className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Integrazione WhatsApp</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">Collega il tuo numero WhatsApp Business per ricevere e rispondere ai messaggi automaticamente.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">WhatsApp Token</label>
            <input name="whatsappToken" type="password" defaultValue={business.whatsappToken || ''} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">WhatsApp Phone ID</label>
            <input name="whatsappPhoneId" defaultValue={business.whatsappPhoneId || ''} className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] text-sm" />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
          {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
        </button>
        {saved && <span className="text-green-600 text-sm">Salvato con successo!</span>}
      </div>
    </form>
  )
}
