'use client'

import { useState } from 'react'

interface Message {
  id: string
  role: string
  content: string
  createdAt: string
}

interface Conversation {
  id: string
  customerPhone: string
  customerName: string | null
  channel: string
  status: string
  createdAt: string
  updatedAt: string
  messages: Message[]
}

export default function ConversationsClient({ conversations }: { conversations: Conversation[] }) {
  const [selected, setSelected] = useState<string | null>(null)

  const selectedConv = conversations.find((c) => c.id === selected)

  const channelIcons: Record<string, string> = {
    WHATSAPP: '📱',
    PHONE: '📞',
    SMS: '💬',
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
      <div className="w-80 rounded-xl shadow-sm border overflow-y-auto" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Nessuna conversazione ancora.
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className="w-full text-left p-4 transition-colors"
              style={{
                borderBottom: '1px solid var(--border-color)',
                background: selected === c.id ? 'rgba(6,182,212,0.1)' : 'transparent',
                borderLeft: selected === c.id ? '2px solid #06b6d4' : '2px solid transparent',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  {channelIcons[c.channel] || ''} {c.customerName || c.customerPhone}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{
                  background: c.status === 'ACTIVE' ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
                  color: c.status === 'ACTIVE' ? '#22c55e' : '#6b7280',
                }}>
                  {c.status === 'ACTIVE' ? 'Attiva' : 'Chiusa'}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {c.messages.length} messaggi — {new Date(c.updatedAt).toLocaleDateString('it-IT')}
              </p>
            </button>
          ))
        )}
      </div>

      <div className="flex-1 rounded-xl shadow-sm border flex flex-col" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Seleziona una conversazione per vedere i messaggi
          </div>
        ) : (
          <>
            <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {selectedConv.customerName || selectedConv.customerPhone}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {selectedConv.channel} — {selectedConv.customerPhone}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedConv.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'USER' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className="max-w-[70%] rounded-2xl px-4 py-2 text-sm"
                    style={{
                      background: m.role === 'USER' ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                      color: m.role === 'USER' ? 'var(--text-primary)' : '#ffffff',
                    }}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p className="text-xs mt-1" style={{
                      color: m.role === 'USER' ? 'var(--text-muted)' : 'rgba(255,255,255,0.7)',
                    }}>
                      {new Date(m.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
