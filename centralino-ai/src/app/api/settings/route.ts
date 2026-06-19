import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const data = await request.json()

  const business = await prisma.business.update({
    where: { id: session.user.businessId },
    data: {
      name: data.name || undefined,
      type: data.type || undefined,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      address: data.address || null,
      city: data.city || null,
      province: data.province || null,
      zipCode: data.zipCode || null,
      description: data.description || null,
      openingHours: data.openingHours || null,
      aiTone: data.aiTone || null,
      aiWelcomeMessage: data.aiWelcomeMessage || null,
      aiClosingMessage: data.aiClosingMessage || null,
      maxTables: data.maxTables != null ? parseInt(data.maxTables) || null : undefined,
      maxSeats: data.maxSeats != null ? parseInt(data.maxSeats) || null : undefined,
      maxCapacity: data.maxCapacity != null ? parseInt(data.maxCapacity) || null : undefined,
      autoWaitlist: data.autoWaitlist !== undefined ? data.autoWaitlist === true || data.autoWaitlist === 'true' : undefined,
      waitlistMessage: data.waitlistMessage !== undefined ? data.waitlistMessage || null : undefined,
      whatsappToken: data.whatsappToken || null,
      whatsappPhoneId: data.whatsappPhoneId || null,
      vapiPhoneNumber: data.vapiPhoneNumber !== undefined ? data.vapiPhoneNumber || null : undefined,
      vapiAssistantId: data.vapiAssistantId !== undefined ? data.vapiAssistantId || null : undefined,
    },
  })

  return NextResponse.json({ success: true, business })
}
