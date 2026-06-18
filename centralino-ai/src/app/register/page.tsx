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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: '6px',
}

function handleInputFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = 'var(--accent)'
  e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'
}

function handleInputBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = 'var(--input-border)'
  e.currentTarget.style.boxShadow = 'none'
}

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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: 'var(--card-glass)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid var(--card-glass-border)',
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.08), 0 25px 50px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: '520px',
          padding: '40px 32px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px',
            }}
          >
            📞
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Netfood Centralino AI
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '14px' }}>
            Registra la tua attivita
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--error-bg)',
              color: 'var(--error-text)',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '14px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Il tuo nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => update('name', e.target.value)}
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => update('email', e.target.value)}
                required
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => update('password', e.target.value)}
              required
              minLength={6}
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />

          <div>
            <label style={labelStyle}>Nome Attivita</label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => update('businessName', e.target.value)}
              required
              placeholder="Es: Ristorante Da Mario"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          <div>
            <label style={labelStyle}>Tipo Attivita</label>
            <select
              value={formData.businessType}
              onChange={(e) => update('businessType', e.target.value)}
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Telefono</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => update('phone', e.target.value)}
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
            <div>
              <label style={labelStyle}>Citta</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => update('city', e.target.value)}
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.boxShadow = '0 4px 25px rgba(6, 182, 212, 0.5)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(6, 182, 212, 0.3)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {loading ? 'Registrazione...' : 'Registra Attivita'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', marginTop: '24px' }}>
          Hai gia un account?{' '}
          <a
            href="/login"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
          >
            Accedi
          </a>
        </p>
      </div>
    </div>
  )
}
