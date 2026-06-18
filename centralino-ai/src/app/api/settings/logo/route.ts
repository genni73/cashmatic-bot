import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user.businessId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('logo') as File
    if (!file) {
      return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 })
    }

    if (file.size > 500 * 1024) {
      return NextResponse.json({ error: 'File troppo grande (max 500KB)' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/png'
    const dataUrl = `data:${mimeType};base64,${base64}`

    await prisma.business.update({
      where: { id: session.user.businessId },
      data: { logoUrl: dataUrl },
    })

    return NextResponse.json({ logoUrl: dataUrl })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore nel caricamento'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
