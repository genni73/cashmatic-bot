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

  const rows: ServiceRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(';')
    const name = cols[0]?.trim().replace(/^"|"$/g, '')
    if (!name) continue

    rows.push({
      name,
      category: cols[1]?.trim().replace(/^"|"$/g, '') || null,
      description: cols[2]?.trim().replace(/^"|"$/g, '') || null,
      price: cols[3] ? parseFloat(cols[3].trim().replace(/^"|"$/g, '').replace(',', '.')) || null : null,
      duration: cols[4] ? parseInt(cols[4].trim().replace(/^"|"$/g, '')) || null : null,
    })
  }
  return rows
}

function parsePDFText(text: string): ServiceRow[] {
  const services: ServiceRow[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  let currentCategory: string | null = null
  const priceRegex = /[€$]\s*(\d+[.,]\d{2})/
  const priceRegex2 = /(\d+[.,]\d{2})\s*[€$]/
  const priceRegexPlain = /\b(\d+[.,]\d{2})\b/

  for (const line of lines) {
    if (line.length < 2) continue
    // Skip common PDF headers/footers
    if (/^(pagina|page|\d+\/\d+|www\.|http|tel|fax|email)/i.test(line)) continue

    // Detect category headers (all caps, short, no price)
    const isCategory = (
      line === line.toUpperCase() &&
      line.length < 40 &&
      !priceRegex.test(line) &&
      !priceRegex2.test(line) &&
      !/\d+[.,]\d{2}/.test(line)
    )

    if (isCategory) {
      currentCategory = line.charAt(0) + line.slice(1).toLowerCase()
      continue
    }

    // Try to extract a service line
    let price: number | null = null
    let name = line

    const priceMatch = line.match(priceRegex) || line.match(priceRegex2) || line.match(priceRegexPlain)
    if (priceMatch) {
      price = parseFloat(priceMatch[1].replace(',', '.'))
      name = line.replace(priceMatch[0], '').trim()
    }

    // Clean up separators
    name = name.replace(/[.…]+$/, '').replace(/\s{2,}/g, ' ').trim()

    if (name.length >= 2 && name.length < 100) {
      // Split name and description if there's a dash or parenthesis
      let description: string | null = null
      const dashIdx = name.indexOf(' - ')
      const parenIdx = name.indexOf('(')

      if (dashIdx > 2) {
        description = name.slice(dashIdx + 3).trim()
        name = name.slice(0, dashIdx).trim()
      } else if (parenIdx > 2) {
        description = name.slice(parenIdx).trim()
        name = name.slice(0, parenIdx).trim()
      }

      services.push({
        name,
        category: currentCategory,
        description,
        price,
        duration: null,
      })
    }
  }

  return services
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

      const fileName = file.name.toLowerCase()

      if (fileName.endsWith('.pdf')) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
        const buffer = Buffer.from(await file.arrayBuffer())
        const pdfData = await pdfParse(buffer)
        services = parsePDFText(pdfData.text)
      } else {
        const text = await file.text()
        services = parseCSV(text)
      }
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

    services = services.filter((s) => s.name)

    if (services.length === 0) {
      return NextResponse.json({ error: 'Nessun servizio trovato nel file. Assicurati che il PDF contenga una lista di prodotti/servizi con nomi leggibili.' }, { status: 400 })
    }

    const maxSort = await prisma.service.aggregate({
      where: { businessId: session.user.businessId },
      _max: { sortOrder: true },
    })
    let sortOrder = (maxSort._max.sortOrder ?? 0) + 1

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
