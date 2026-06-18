import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface ServiceRow {
  name: string
  category: string | null
  description: string | null
  price: number | null
  duration: number | null
}

function parseCSV(text: string): ServiceRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  // Skip header row (Nome;Categoria;Descrizione;Prezzo;Durata)
  const rows: ServiceRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(';')
    const name = cols[0]?.trim()
    if (!name) continue

    rows.push({
      name,
      category: cols[1]?.trim() || null,
      description: cols[2]?.trim() || null,
      price: cols[3] ? parseFloat(cols[3].trim().replace(',', '.')) || null : null,
      duration: cols[4] ? parseInt(cols[4].trim()) || null : null,
    })
  }
  return rows
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user.businessId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const contentType = request.headers.get('content-type') || ''
    let services: ServiceRow[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 })
      }
      const text = await file.text()
      services = parseCSV(text)
    } else if (contentType.includes('application/json')) {
      const body = await request.json()
      if (Array.isArray(body.services)) {
        services = body.services.map((s: Record<string, unknown>) => ({
          name: String(s.name || ''),
          category: s.category ? String(s.category) : null,
          description: s.description ? String(s.description) : null,
          price: s.price != null ? Number(s.price) || null : null,
          duration: s.duration != null ? Number(s.duration) || null : null,
        }))
      } else if (typeof body.csv === 'string') {
        services = parseCSV(body.csv)
      }
    } else {
      return NextResponse.json({ error: 'Formato non supportato' }, { status: 400 })
    }

    if (services.length === 0) {
      return NextResponse.json({ error: 'Nessun servizio trovato nel file' }, { status: 400 })
    }

    // Filter out entries without a name
    services = services.filter((s) => s.name)

    // Get existing max sortOrder
    const maxSort = await prisma.service.aggregate({
      where: { businessId: session.user.businessId },
      _max: { sortOrder: true },
    })
    let sortOrder = (maxSort._max.sortOrder ?? 0) + 1

    // Create services
    const created = await prisma.service.createMany({
      data: services.map((s) => ({
        businessId: session.user.businessId,
        name: s.name,
        category: s.category,
        description: s.description,
        price: s.price,
        duration: s.duration,
        isAvailable: true,
        sortOrder: sortOrder++,
      })),
    })

    return NextResponse.json({
      success: true,
      count: created.count,
      message: `${created.count} servizi importati con successo`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore durante l\'importazione'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
