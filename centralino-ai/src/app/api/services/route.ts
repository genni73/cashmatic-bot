import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const services = await prisma.service.findMany({
    where: { businessId: session.user.businessId },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  })

  return NextResponse.json(services)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const data = await request.json()

  const service = await prisma.service.create({
    data: {
      name: data.name,
      description: data.description || null,
      category: data.category || null,
      price: data.price || null,
      duration: data.duration || null,
      isAvailable: data.isAvailable ?? true,
      businessId: session.user.businessId,
    },
  })

  return NextResponse.json(service)
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obbligatorio' }, { status: 400 })

  const existing = await prisma.service.findFirst({
    where: { id, businessId: session.user.businessId },
  })
  if (!existing) return NextResponse.json({ error: 'Servizio non trovato' }, { status: 404 })

  const data = await request.json()

  const service = await prisma.service.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
    },
  })

  return NextResponse.json(service)
}

export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obbligatorio' }, { status: 400 })

  const existing = await prisma.service.findFirst({
    where: { id, businessId: session.user.businessId },
  })
  if (!existing) return NextResponse.json({ error: 'Servizio non trovato' }, { status: 404 })

  await prisma.service.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
