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

  const services = await prisma.service.findMany({
    where: { businessId: session.user.businessId },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  })

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
    select: { name: true },
  })

  if (format === 'pdf') {
    const html = generateServicesPDF(services, business?.name || 'Attività')
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline; filename="servizi.html"',
      },
    })
  }

  const header = 'Nome;Categoria;Descrizione;Prezzo;Durata (min);Disponibile'
  const rows = services.map(s =>
    `"${s.name}";"${s.category || ''}";"${(s.description || '').replace(/"/g, '""')}";"${s.price != null ? s.price.toFixed(2) : ''}";"${s.duration || ''}";"${s.isAvailable ? 'Sì' : 'No'}"`
  )
  const csv = '﻿' + [header, ...rows].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="servizi.csv"',
    },
  })
}

interface ServiceRow {
  name: string
  category: string | null
  description: string | null
  price: number | null
  duration: number | null
  isAvailable: boolean
}

function generateServicesPDF(services: ServiceRow[], businessName: string): string {
  const rows = services.map(s => `
    <tr>
      <td>${s.name}</td>
      <td>${s.category || '-'}</td>
      <td>${s.description || '-'}</td>
      <td>${s.price != null ? '€ ' + s.price.toFixed(2) : '-'}</td>
      <td>${s.duration ? s.duration + ' min' : '-'}</td>
      <td>${s.isAvailable ? 'Sì' : 'No'}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Servizi - ${businessName}</title>
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
<h2>Lista Servizi / Menu</h2>
<p style="font-size:12px;color:#666;">Esportato il ${new Date().toLocaleDateString('it-IT')} — ${services.length} elementi</p>
<table>
  <thead><tr><th>Nome</th><th>Categoria</th><th>Descrizione</th><th>Prezzo</th><th>Durata</th><th>Disponibile</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">Generato da Netfood Centralino AI</div>
<script>window.onload = function() { window.print(); }</script>
</body></html>`
}
