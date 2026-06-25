import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const notes = await prisma.knowledgeNote.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(notes)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const data = await request.json()

  const note = await prisma.knowledgeNote.create({
    data: {
      title: data.title,
      content: data.content,
      tags: data.tags || null,
      source: data.source || 'MANUAL',
      fileName: data.fileName || null,
      businessId: session.user.businessId,
    },
  })

  return NextResponse.json(note)
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obbligatorio' }, { status: 400 })

  const existing = await prisma.knowledgeNote.findFirst({ where: { id, businessId: session.user.businessId } })
  if (!existing) return NextResponse.json({ error: 'Nota non trovata' }, { status: 404 })

  const data = await request.json()

  const note = await prisma.knowledgeNote.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.tags !== undefined && { tags: data.tags || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })

  return NextResponse.json(note)
}

export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obbligatorio' }, { status: 400 })

  const existing = await prisma.knowledgeNote.findFirst({ where: { id, businessId: session.user.businessId } })
  if (!existing) return NextResponse.json({ error: 'Nota non trovata' }, { status: 404 })

  await prisma.knowledgeNote.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
