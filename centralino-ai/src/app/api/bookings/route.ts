import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const bookings = await prisma.booking.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { date: 'desc' },
    include: { service: true },
  })

  return NextResponse.json(bookings)
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obbligatorio' }, { status: 400 })

  const existing = await prisma.booking.findFirst({
    where: { id, businessId: session.user.businessId },
  })
  if (!existing) return NextResponse.json({ error: 'Prenotazione non trovata' }, { status: 404 })

  const data = await request.json()

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  })

  return NextResponse.json(booking)
}
