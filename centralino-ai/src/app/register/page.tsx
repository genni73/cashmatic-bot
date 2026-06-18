'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    businessType: 'RESTAURANT',
    phone: '',
    city: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function update(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Errore nella registrazione')
        setLoading(false)
        return
      }

      router.push('/admin/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore di connessione al server'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Netfood Centralino AI</h1>
          <p className="text-gray-500 mt-2">Registra la tua attività</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Il tuo nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => update('name', e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => update('email', e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => update('password', e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          <hr className="my-4" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Attività</label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => update('businessName', e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Es: Ristorante Da Mario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Attività</label>
            <select
              value={formData.businessType}
              onChange={(e) => update('businessType', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => update('city', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Registrazione...' : 'Registra Attività'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Hai già un account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">Accedi</a>
        </p>
      </div>
    </div>
  )
}
