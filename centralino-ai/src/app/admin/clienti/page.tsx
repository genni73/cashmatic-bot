import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ClientiClient from './clienti-client'

export default async function ClientiPage() {
  const session = await getSession()
  if (!session?.user.businessId) redirect('/login')

  const businessId = session.user.businessId

  const bookings = await prisma.booking.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    select: {
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      date: true,
      status: true,
      source: true,
    },
  })

  const customerMap = new Map<string, {
    name: string
    phone: string
    email: string
    totalBookings: number
    lastVisit: string
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
        lastVisit: b.date.toISOString(),
        source: b.source,
      })
    } else {
      existing.totalBookings++
      if (b.date.toISOString() > existing.lastVisit) {
        existing.lastVisit = b.date.toISOString()
        existing.name = b.customerName
        if (b.customerEmail) existing.email = b.customerEmail
      }
    }
  }

  const customers = Array.from(customerMap.values()).sort((a, b) => b.totalBookings - a.totalBookings)

  return (
    <ClientiClient
      customers={customers}
      totalBookings={bookings.length}
    />
  )
}
