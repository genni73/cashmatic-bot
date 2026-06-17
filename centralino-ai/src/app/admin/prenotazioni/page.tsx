import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BUSINESS_TYPES, BusinessType } from '@/lib/business-types'
import BookingsClient from './bookings-client'

export default async function PrenotazioniPage() {
  const session = await getSession()
  if (!session?.user.businessId) redirect('/login')

  const bookings = await prisma.booking.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { date: 'desc' },
    include: { service: true },
    take: 50,
  })

  const typeConfig = BUSINESS_TYPES[session.user.business?.type as BusinessType]

  const serialized = JSON.parse(JSON.stringify(bookings))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{typeConfig?.bookingLabel || 'Prenotazioni'}</h1>
      <BookingsClient bookings={serialized} hasNumberOfPeople={typeConfig?.hasNumberOfPeople || false} />
    </div>
  )
}
