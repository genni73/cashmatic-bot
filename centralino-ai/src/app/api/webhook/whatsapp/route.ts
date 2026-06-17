import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildSystemPrompt } from '@/lib/ai-prompt'
import { BusinessType } from '@/lib/business-types'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

export async function POST(request: Request) {
  const body = await request.json()

  const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  if (!message) return NextResponse.json({ status: 'no message' })

  const from = message.from
  const text = message.text?.body
  if (!text) return NextResponse.json({ status: 'no text' })

  const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id

  const business = await prisma.business.findFirst({
    where: { whatsappPhoneId: phoneNumberId, isActive: true },
    include: {
      services: { where: { isAvailable: true } },
      faqs: { where: { isActive: true } },
    },
  })

  if (!business) {
    console.error(`No business found for phone ID: ${phoneNumberId}`)
    return NextResponse.json({ status: 'no business' })
  }

  let conversation = await prisma.conversation.findFirst({
    where: { businessId: business.id, customerPhone: from, status: 'ACTIVE' },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { businessId: business.id, customerPhone: from, channel: 'WHATSAPP', status: 'ACTIVE' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
  }

  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'USER', content: text },
  })

  const systemPrompt = buildSystemPrompt({
    name: business.name,
    type: business.type as BusinessType,
    description: business.description,
    address: business.address,
    city: business.city,
    phone: business.phone,
    email: business.email,
    website: business.website,
    openingHours: business.openingHours,
    aiTone: business.aiTone,
    aiWelcomeMessage: business.aiWelcomeMessage,
    aiClosingMessage: business.aiClosingMessage,
    services: business.services,
    faqs: business.faqs,
  })

  const messages = [
    ...conversation.messages.map((m) => ({ role: m.role.toLowerCase() as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: text },
  ]

  const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  })

  const aiData = await aiResponse.json()
  const reply = aiData.content?.[0]?.text || 'Mi scuso, non riesco a rispondere in questo momento.'

  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'ASSISTANT', content: reply },
  })

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  })

  await fetch(`https://graph.facebook.com/v18.0/${business.whatsappPhoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${business.whatsappToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: from,
      type: 'text',
      text: { body: reply },
    }),
  })

  return NextResponse.json({ status: 'ok' })
}
