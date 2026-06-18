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

  // Skip header row (Nome;Telefono;Email)
  const rows: CustomerRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(';')
    const name = cols[0]?.trim()
    const phone = cols[1]?.trim()
    if (!name || !phone) continue

    rows.push({
      name,
      phone,
      email: cols[2]?.trim() || null,
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
    let customers: CustomerRow[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 })
      }
      const text = await file.text()
      customers = parseCSV(text)
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

    if (customers.length === 0) {
      return NextResponse.json({ error: 'Nessun cliente trovato nel file' }, { status: 400 })
    }

    // Filter out entries without name or phone
    customers = customers.filter((c) => c.name && c.phone)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Create bookings as MANUAL source so customers appear in the customer list
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
        notes: 'Importato da CSV',
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
