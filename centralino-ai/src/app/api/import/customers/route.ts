import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface CustomerRow {
  name: string
  phone: string
  email: string | null
}

function parseCSV(text: string): CustomerRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const rows: CustomerRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(';')
    const name = cols[0]?.trim().replace(/^"|"$/g, '')
    const phone = cols[1]?.trim().replace(/^"|"$/g, '')
    if (!name || !phone) continue

    rows.push({
      name,
      phone,
      email: cols[2]?.trim().replace(/^"|"$/g, '') || null,
    })
  }
  return rows
}

function parsePDFText(text: string): CustomerRow[] {
  const customers: CustomerRow[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  const phoneRegex = /(\+?\d[\d\s\-().]{7,}\d)/
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/

  for (const line of lines) {
    if (line.length < 3) continue
    if (/^(pagina|page|\d+\/\d+|www\.|http|tel:|fax:|email:)/i.test(line)) continue

    const phoneMatch = line.match(phoneRegex)
    if (!phoneMatch) continue

    const phone = phoneMatch[1].replace(/[\s\-().]/g, '')
    if (phone.length < 8) continue

    let name = line.replace(phoneMatch[0], '').trim()

    let email: string | null = null
    const emailMatch = name.match(emailRegex)
    if (emailMatch) {
      email = emailMatch[1]
      name = name.replace(emailMatch[0], '').trim()
    }

    name = name.replace(/[,;:\-–—]+$/, '').replace(/^[,;:\-–—]+/, '').trim()

    if (name.length >= 2 && name.length < 80) {
      customers.push({ name, phone, email })
    }
  }

  return customers
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user.businessId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const contentType = request.headers.get('content-type') || ''
    let customers: CustomerRow[] = []

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
        customers = parsePDFText(pdfData.text)
      } else {
        const text = await file.text()
        customers = parseCSV(text)
      }
    } else if (contentType.includes('application/json')) {
      const body = await request.json()
      if (typeof body.csv === 'string') {
        customers = parseCSV(body.csv)
      } else if (Array.isArray(body.customers)) {
        customers = body.customers.map((c: Record<string, unknown>) => ({
          name: String(c.name || ''),
          phone: String(c.phone || ''),
          email: c.email ? String(c.email) : null,
        }))
      }
    } else {
      return NextResponse.json({ error: 'Formato non supportato' }, { status: 400 })
    }

    customers = customers.filter((c) => c.name && c.phone)

    if (customers.length === 0) {
      return NextResponse.json({ error: 'Nessun cliente trovato nel file. Assicurati che il file contenga nomi e numeri di telefono.' }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const created = await prisma.booking.createMany({
      data: customers.map((c) => ({
        businessId: session.user.businessId,
        customerName: c.name,
        customerPhone: c.phone,
        customerEmail: c.email,
        date: today,
        time: '00:00',
        duration: 0,
        status: 'COMPLETED',
        source: 'MANUAL',
        notes: 'Importato',
      })),
    })

    return NextResponse.json({
      success: true,
      count: created.count,
      message: `${created.count} clienti importati con successo`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore durante l\'importazione'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
