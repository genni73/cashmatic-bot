import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const faqs = await prisma.fAQ.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(faqs)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const data = await request.json()

  const count = await prisma.fAQ.count({ where: { businessId: session.user.businessId } })

  const faq = await prisma.fAQ.create({
    data: {
      question: data.question,
      answer: data.answer,
      sortOrder: count,
      businessId: session.user.businessId,
    },
  })

  return NextResponse.json(faq)
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obbligatorio' }, { status: 400 })

  const existing = await prisma.fAQ.findFirst({ where: { id, businessId: session.user.businessId } })
  if (!existing) return NextResponse.json({ error: 'FAQ non trovata' }, { status: 404 })

  const data = await request.json()

  const faq = await prisma.fAQ.update({
    where: { id },
    data: {
      ...(data.question !== undefined && { question: data.question }),
      ...(data.answer !== undefined && { answer: data.answer }),
    },
  })

  return NextResponse.json(faq)
}

export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obbligatorio' }, { status: 400 })

  const existing = await prisma.fAQ.findFirst({ where: { id, businessId: session.user.businessId } })
  if (!existing) return NextResponse.json({ error: 'FAQ non trovata' }, { status: 404 })

  await prisma.fAQ.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
