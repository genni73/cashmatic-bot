import { prisma } from '@/lib/prisma'
import { buildSystemPrompt } from '@/lib/ai-prompt'
import { BusinessType } from '@/lib/business-types'

interface VapiToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

async function getBusinessByPhoneNumber(phoneNumber: string) {
  const business = await prisma.business.findFirst({
    where: {
      OR: [
        { twilioPhoneNumber: phoneNumber },
        { vapiPhoneNumber: phoneNumber },
      ],
      isActive: true,
    },
    include: {
      services: { where: { isAvailable: true } },
      faqs: { where: { isActive: true } },
    },
  })
  return business
}

async function getBusinessById(businessId: string) {
  return prisma.business.findUnique({
    where: { id: businessId },
    include: {
      services: { where: { isAvailable: true } },
      faqs: { where: { isActive: true } },
    },
  })
}

async function checkCapacity(businessId: string, date: Date, numberOfPeople: number) {
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
    return { isOverCapacity: true, reason: `Capacità massima raggiunta (${totalPeople}/${business.maxCapacity})` }
  }

  return { isOverCapacity: false, reason: '' }
}

function buildVoiceSystemPrompt(business: Parameters<typeof buildSystemPrompt>[0]) {
  const base = buildSystemPrompt(business)

  return base + `

=== ISTRUZIONI VOCALI ===
Stai rispondendo al TELEFONO, non in chat. Adatta il tuo comportamento:
- Risposte BREVI e naturali (max 2-3 frasi per volta)
- Parla come al telefono: "Pronto, ${business.name}, come posso aiutarla?"
- Non usare emoji, link, o formattazione
- Non dire "clicca qui" o "visita il sito"
- Quando detti numeri o date, scandiscili chiaramente
- Se non capisci, chiedi gentilmente di ripetere
- Per le prenotazioni, conferma sempre ripetendo i dettagli ad alta voce

IMPORTANTE: Quando hai raccolto TUTTI i dati per la prenotazione, usa la funzione "crea_prenotazione" per salvarla.
NON usare il formato [PRENOTA:...] nelle chiamate telefoniche.`
}

async function handleAssistantRequest(message: Record<string, unknown>) {
  const call = message.call as Record<string, unknown> | undefined
  const phoneNumber = (call?.phoneNumber as Record<string, string>)?.number ||
    (call?.assistantId as string) || ''

  let business = await getBusinessByPhoneNumber(phoneNumber)

  if (!business) {
    business = await prisma.business.findFirst({
      where: { isActive: true },
      include: {
        services: { where: { isAvailable: true } },
        faqs: { where: { isActive: true } },
      },
    })
  }

  if (!business) {
    return Response.json({
      assistant: {
        model: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          messages: [{ role: 'system', content: 'Rispondi che il servizio non è al momento disponibile.' }],
        },
        voice: { provider: '11labs', voiceId: 'ErXwobaYiN019PkySvjV' },
        firstMessage: 'Mi scusi, il servizio non è al momento disponibile. La prego di richiamare più tardi.',
      },
    })
  }

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

  const systemPrompt = buildVoiceSystemPrompt({
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
  })

  const customerPhone = (call?.customer as Record<string, string>)?.number || ''
  if (customerPhone) {
    await prisma.conversation.create({
      data: {
        businessId: business.id,
        customerPhone,
        channel: 'PHONE',
        status: 'ACTIVE',
      },
    })
  }

  return Response.json({
    assistant: {
      model: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        systemPrompt,
        tools: [
          {
            type: 'function',
            function: {
              name: 'crea_prenotazione',
              description: 'Crea una nuova prenotazione quando il cliente conferma tutti i dettagli',
              parameters: {
                type: 'object',
                properties: {
                  nome: { type: 'string', description: 'Nome completo del cliente' },
                  data: { type: 'string', description: 'Data della prenotazione in formato YYYY-MM-DD' },
                  ora: { type: 'string', description: 'Ora della prenotazione in formato HH:MM' },
                  persone: { type: 'number', description: 'Numero di persone' },
                  note: { type: 'string', description: 'Eventuali note o richieste speciali' },
                  telefono: { type: 'string', description: 'Numero di telefono del cliente' },
                },
                required: ['nome', 'data', 'ora'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'verifica_disponibilita',
              description: 'Verifica la disponibilità per una data e ora specifiche',
              parameters: {
                type: 'object',
                properties: {
                  data: { type: 'string', description: 'Data in formato YYYY-MM-DD' },
                  persone: { type: 'number', description: 'Numero di persone' },
                },
                required: ['data'],
              },
            },
          },
        ],
      },
      voice: {
        provider: '11labs',
        voiceId: 'ErXwobaYiN019PkySvjV',
        language: 'it',
      },
      firstMessage: business.aiWelcomeMessage ||
        `Pronto, ${business.name}, buongiorno! Come posso aiutarla?`,
      endCallMessage: business.aiClosingMessage ||
        'Grazie per aver chiamato, arrivederci!',
      serverUrl: process.env.NEXT_PUBLIC_URL + '/api/webhook/vapi',
      metadata: {
        businessId: business.id,
      },
    },
  })
}

async function handleToolCalls(message: Record<string, unknown>) {
  const toolCalls = message.toolCallList as VapiToolCall[] ||
    (message as Record<string, unknown>).toolCalls as VapiToolCall[] || []

  const metadata = (message.call as Record<string, Record<string, string>>)?.metadata ||
    (message as Record<string, Record<string, string>>).metadata || {}
  const businessId = metadata.businessId

  const results = []

  for (const toolCall of toolCalls) {
    const args = JSON.parse(toolCall.function.arguments || '{}')

    if (toolCall.function.name === 'crea_prenotazione') {
      try {
        const business = businessId ? await getBusinessById(businessId) : null
        if (!business) {
          results.push({ toolCallId: toolCall.id, result: 'Errore: attività non trovata.' })
          continue
        }

        const bookingDate = new Date(args.data)
        const numberOfPeople = args.persone || 1
        const { isOverCapacity } = await checkCapacity(business.id, bookingDate, numberOfPeople)

        let bookingStatus = 'CONFIRMED'
        if (isOverCapacity && business.autoWaitlist) {
          bookingStatus = 'WAITLIST'
        }

        const customerPhone = args.telefono ||
          ((message.call as Record<string, Record<string, string>>)?.customer?.number) || 'sconosciuto'

        await prisma.booking.create({
          data: {
            businessId: business.id,
            customerName: args.nome,
            customerPhone,
            date: bookingDate,
            time: args.ora,
            duration: 90,
            numberOfPeople,
            status: bookingStatus,
            source: 'PHONE',
            notes: args.note || null,
          },
        })

        if (bookingStatus === 'WAITLIST') {
          results.push({
            toolCallId: toolCall.id,
            result: `Il cliente ${args.nome} è stato inserito in LISTA D'ATTESA per il ${bookingDate.toLocaleDateString('it-IT')} alle ${args.ora}. Siamo al completo, avvisa il cliente che sarà contattato appena si libera un posto.`,
          })
        } else {
          results.push({
            toolCallId: toolCall.id,
            result: `Prenotazione CONFERMATA per ${args.nome}, ${bookingDate.toLocaleDateString('it-IT')} alle ${args.ora}, ${numberOfPeople} ${numberOfPeople === 1 ? 'persona' : 'persone'}. Conferma al cliente che è tutto a posto.`,
          })
        }
      } catch {
        results.push({ toolCallId: toolCall.id, result: 'Errore nella creazione della prenotazione. Chiedi scusa al cliente e prova a prendere i dati manualmente.' })
      }
    } else if (toolCall.function.name === 'verifica_disponibilita') {
      try {
        const bookingDate = new Date(args.data)
        const numberOfPeople = args.persone || 1
        const { isOverCapacity, reason } = await checkCapacity(businessId, bookingDate, numberOfPeople)

        if (isOverCapacity) {
          results.push({
            toolCallId: toolCall.id,
            result: `Per il ${bookingDate.toLocaleDateString('it-IT')}: ${reason}. Il cliente può essere inserito in lista d'attesa.`,
          })
        } else {
          results.push({
            toolCallId: toolCall.id,
            result: `Per il ${bookingDate.toLocaleDateString('it-IT')}: c'è disponibilità! Si può procedere con la prenotazione.`,
          })
        }
      } catch {
        results.push({ toolCallId: toolCall.id, result: 'Non riesco a verificare la disponibilità al momento.' })
      }
    }
  }

  return Response.json({ results })
}

async function handleEndOfCall(message: Record<string, unknown>) {
  const call = message.call as Record<string, Record<string, string>> | undefined
  const customerPhone = call?.customer?.number
  const businessId = call?.metadata?.businessId

  if (customerPhone && businessId) {
    const conversation = await prisma.conversation.findFirst({
      where: { businessId, customerPhone, channel: 'PHONE', status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })

    if (conversation) {
      const transcript = (message as Record<string, string>).transcript || ''
      const summary = (message as Record<string, string>).summary || ''

      if (transcript) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'SYSTEM',
            content: `[Trascrizione chiamata]\n${transcript}`,
          },
        })
      }

      if (summary) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'SYSTEM',
            content: `[Riepilogo chiamata]\n${summary}`,
          },
        })
      }

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'CLOSED', updatedAt: new Date() },
      })
    }
  }

  return Response.json({ ok: true })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = body.message || body

    const type = message.type as string

    switch (type) {
      case 'assistant-request':
        return handleAssistantRequest(message)
      case 'tool-calls':
        return handleToolCalls(message)
      case 'end-of-call-report':
        return handleEndOfCall(message)
      case 'function-call':
        return handleToolCalls(message)
      case 'speech-update':
      case 'transcript':
      case 'hang':
      case 'status-update':
        return Response.json({ ok: true })
      default:
        return Response.json({ ok: true })
    }
  } catch (error) {
    console.error('Vapi webhook error:', error)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
