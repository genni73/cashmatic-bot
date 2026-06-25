import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildSystemPrompt } from '@/lib/ai-prompt'
import { BusinessType } from '@/lib/business-types'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

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

function parseBookingTag(text: string): {
  nome: string
  data: string
  ora: string
  persone: number
  note: string
} | null {
  const match = text.match(/\[PRENOTA:\s*(.+?)\]/)
  if (!match) return null

  const content = match[1]
  const getName = content.match(/nome="([^"]+)"/)
  const getDate = content.match(/data="([^"]+)"/)
  const getTime = content.match(/ora="([^"]+)"/)
  const getPeople = content.match(/persone=(\d+)/)
  const getNotes = content.match(/note="([^"]*)"/)

  if (!getName || !getDate || !getTime) return null

  return {
    nome: getName[1],
    data: getDate[1],
    ora: getTime[1],
    persone: getPeople ? parseInt(getPeople[1]) : 1,
    note: getNotes ? getNotes[1] : '',
  }
}

async function checkCapacity(businessId: string, date: Date, numberOfPeople: number): Promise<{
  isOverCapacity: boolean
  reason: string
}> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { maxTables: true, maxSeats: true, maxCapacity: true },
  })

  if (!business) return { isOverCapacity: false, reason: '' }

  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const activeBookings = await prisma.booking.findMany({
    where: {
      businessId,
      date: { gte: dayStart, lt: dayEnd },
      status: { in: ['CONFIRMED', 'ARRIVED', 'PENDING'] },
    },
  })

  const totalTables = activeBookings.length
  const totalPeople = activeBookings.reduce((sum, b) => sum + (b.numberOfPeople || 1), 0)

  if (business.maxTables && (totalTables + 1) > business.maxTables) {
    return { isOverCapacity: true, reason: `Tavoli esauriti (${totalTables}/${business.maxTables})` }
  }

  if (business.maxSeats && (totalPeople + numberOfPeople) > business.maxSeats) {
    return { isOverCapacity: true, reason: `Posti esauriti (${totalPeople}/${business.maxSeats})` }
  }

  if (business.maxCapacity && (totalPeople + numberOfPeople) > business.maxCapacity) {
    return { isOverCapacity: true, reason: `Capacita massima raggiunta (${totalPeople}/${business.maxCapacity})` }
  }

  return { isOverCapacity: false, reason: '' }
}

export async function POST(request: Request) {
  try {
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
        knowledgeNotes: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
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

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const activeBookings = await prisma.booking.findMany({
      where: {
        businessId: business.id,
        date: { gte: todayStart },
        status: { in: ['CONFIRMED', 'ARRIVED', 'PENDING'] },
      },
    })

    const currentOccupancy = {
      tables: activeBookings.length,
      seats: activeBookings.reduce((sum, b) => sum + (b.numberOfPeople || 1), 0),
    }

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
      maxTables: business.maxTables,
      maxSeats: business.maxSeats,
      maxCapacity: business.maxCapacity,
      autoWaitlist: business.autoWaitlist,
      waitlistMessage: business.waitlistMessage,
      currentOccupancy,
      knowledgeNotes: business.knowledgeNotes,
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
    let reply = aiData.content?.[0]?.text || 'Mi scuso, non riesco a rispondere in questo momento.'

    const bookingData = parseBookingTag(reply)
    if (bookingData) {
      reply = reply.replace(/\[PRENOTA:.*?\]/g, '').trim()

      const bookingDate = new Date(bookingData.data)
      const { isOverCapacity } = await checkCapacity(business.id, bookingDate, bookingData.persone)

      let bookingStatus = 'CONFIRMED'
      if (isOverCapacity && business.autoWaitlist) {
        bookingStatus = 'WAITLIST'
      }

      await prisma.booking.create({
        data: {
          businessId: business.id,
          customerName: bookingData.nome,
          customerPhone: from,
          date: bookingDate,
          time: bookingData.ora,
          duration: 90,
          numberOfPeople: bookingData.persone,
          status: bookingStatus,
          source: 'WHATSAPP',
          notes: bookingData.note || null,
        },
      })

      if (bookingStatus === 'WAITLIST') {
        const waitlistMsg = business.waitlistMessage ||
          `Gentile ${bookingData.nome}, al momento siamo al completo per il ${bookingDate.toLocaleDateString('it-IT')} alle ${bookingData.ora}. La inseriamo in lista d'attesa e la avviseremo appena si libera un posto. Grazie per la comprensione!`

        reply = waitlistMsg
      }

      if (conversation.customerName !== bookingData.nome) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { customerName: bookingData.nome },
        })
      }
    }

    await prisma.message.create({
      data: { conversationId: conversation.id, role: 'ASSISTANT', content: reply },
    })

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    await sendWhatsAppMessage(business.whatsappPhoneId!, business.whatsappToken!, from, reply)

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
