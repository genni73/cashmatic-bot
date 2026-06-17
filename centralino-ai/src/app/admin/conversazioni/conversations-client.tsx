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
      <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Nessuna conversazione ancora.
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                selected === c.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-gray-900">
                  {channelIcons[c.channel] || ''} {c.customerName || c.customerPhone}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  c.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {c.status === 'ACTIVE' ? 'Attiva' : 'Chiusa'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {c.messages.length} messaggi — {new Date(c.updatedAt).toLocaleDateString('it-IT')}
              </p>
            </button>
          ))
        )}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Seleziona una conversazione per vedere i messaggi
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                {selectedConv.customerName || selectedConv.customerPhone}
              </h3>
              <p className="text-xs text-gray-500">
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
                    className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                      m.role === 'USER'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p className={`text-xs mt-1 ${m.role === 'USER' ? 'text-gray-400' : 'text-blue-200'}`}>
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
