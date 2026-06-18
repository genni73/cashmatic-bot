import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session?.user.businessId) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'csv'

  const bookings = await prisma.booking.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { createdAt: 'desc' },
    select: {
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      date: true,
      status: true,
      source: true,
      numberOfPeople: true,
    },
  })

  const customerMap = new Map<string, {
    name: string
    phone: string
    email: string
    totalBookings: number
    lastVisit: Date
    source: string
  }>()

  for (const b of bookings) {
    const key = b.customerPhone
    const existing = customerMap.get(key)
    if (!existing) {
      customerMap.set(key, {
        name: b.customerName,
        phone: b.customerPhone,
        email: b.customerEmail || '',
        totalBookings: 1,
        lastVisit: b.date,
        source: b.source,
      })
    } else {
      existing.totalBookings++
      if (b.date > existing.lastVisit) {
        existing.lastVisit = b.date
        existing.name = b.customerName
        if (b.customerEmail) existing.email = b.customerEmail
      }
    }
  }

  const customers = Array.from(customerMap.values()).sort((a, b) => b.totalBookings - a.totalBookings)

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
    select: { name: true },
  })

  if (format === 'pdf') {
    const html = generateCustomersPDF(customers, business?.name || 'Attività')
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline; filename="clienti.html"',
      },
    })
  }

  const header = 'Nome;Telefono;Email;Prenotazioni Totali;Ultima Visita;Canale'
  const rows = customers.map(c =>
    `"${c.name}";"${c.phone}";"${c.email}";"${c.totalBookings}";"${new Date(c.lastVisit).toLocaleDateString('it-IT')}";"${c.source}"`
  )
  const csv = '﻿' + [header, ...rows].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="clienti.csv"',
    },
  })
}

interface Customer {
  name: string
  phone: string
  email: string
  totalBookings: number
  lastVisit: Date
  source: string
}

function generateCustomersPDF(customers: Customer[], businessName: string): string {
  const rows = customers.map(c => `
    <tr>
      <td>${c.name}</td>
      <td>${c.phone}</td>
      <td>${c.email || '-'}</td>
      <td>${c.totalBookings}</td>
      <td>${new Date(c.lastVisit).toLocaleDateString('it-IT')}</td>
      <td>${c.source}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Clienti - ${businessName}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
  h1 { color: #1e40af; margin-bottom: 5px; }
  h2 { color: #666; font-weight: normal; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { background: #1e40af; color: white; padding: 10px; text-align: left; font-size: 13px; }
  td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  tr:nth-child(even) { background: #f9fafb; }
  .footer { margin-top: 30px; font-size: 11px; color: #999; text-align: center; }
  @media print { body { padding: 20px; } }
</style></head><body>
<h1>${businessName}</h1>
<h2>Lista Clienti</h2>
<p style="font-size:12px;color:#666;">Esportato il ${new Date().toLocaleDateString('it-IT')} — ${customers.length} clienti</p>
<table>
  <thead><tr><th>Nome</th><th>Telefono</th><th>Email</th><th>Prenotazioni</th><th>Ultima Visita</th><th>Canale</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">Generato da Netfood Centralino AI</div>
<script>window.onload = function() { window.print(); }</script>
</body></html>`
}
