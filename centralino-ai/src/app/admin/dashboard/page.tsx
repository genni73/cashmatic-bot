import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BUSINESS_TYPES, BusinessType } from '@/lib/business-types'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user.businessId) redirect('/login')

  const businessId = session.user.businessId

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

  const [
    totalBookings,
    pendingBookings,
    confirmedBookings,
    arrivedBookings,
    cancelledBookings,
    waitlistBookings,
    completedBookings,
    todayBookings,
    weekBookings,
    totalConversations,
    activeConversations,
    totalServices,
    totalCustomers,
    business,
  ] = await Promise.all([
    prisma.booking.count({ where: { businessId } }),
    prisma.booking.count({ where: { businessId, status: 'PENDING' } }),
    prisma.booking.count({ where: { businessId, status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { businessId, status: 'ARRIVED' } }),
    prisma.booking.count({ where: { businessId, status: 'CANCELLED' } }),
    prisma.booking.count({ where: { businessId, status: 'WAITLIST' } }),
    prisma.booking.count({ where: { businessId, status: 'COMPLETED' } }),
    prisma.booking.count({ where: { businessId, date: { gte: todayStart } } }),
    prisma.booking.count({ where: { businessId, date: { gte: weekStart } } }),
    prisma.conversation.count({ where: { businessId } }),
    prisma.conversation.count({ where: { businessId, status: 'ACTIVE' } }),
    prisma.service.count({ where: { businessId } }),
    prisma.booking.groupBy({ by: ['customerPhone'], where: { businessId } }).then(r => r.length),
    prisma.business.findUnique({ where: { id: businessId } }),
  ])

  const todayActiveBookings = await prisma.booking.count({
    where: { businessId, date: { gte: todayStart }, status: { in: ['CONFIRMED', 'ARRIVED', 'PENDING'] } },
  })

  const todayPeople = await prisma.booking.aggregate({
    where: { businessId, date: { gte: todayStart }, status: { in: ['CONFIRMED', 'ARRIVED', 'PENDING'] } },
    _sum: { numberOfPeople: true },
  })

  const seatedNow = await prisma.booking.aggregate({
    where: { businessId, date: { gte: todayStart }, status: 'ARRIVED' },
    _sum: { numberOfPeople: true },
    _count: true,
  })

  const arrivingSoon = await prisma.booking.findMany({
    where: { businessId, date: { gte: todayStart }, status: { in: ['CONFIRMED', 'PENDING'] } },
  })
  const arrivingSoonCount = arrivingSoon.filter(b => {
    const [h, m] = b.time.split(':').map(Number)
    const bookingTime = new Date(todayStart)
    bookingTime.setHours(h, m)
    return bookingTime >= now && bookingTime <= oneHourFromNow
  })

  const recentBookings = await prisma.booking.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { service: true },
  })

  const recentConversations = await prisma.conversation.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const dailyBookings: { day: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart)
    d.setDate(d.getDate() - i)
    const nextD = new Date(d)
    nextD.setDate(nextD.getDate() + 1)
    const count = await prisma.booking.count({
      where: { businessId, date: { gte: d, lt: nextD } },
    })
    dailyBookings.push({
      day: d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' }),
      count,
    })
  }

  const todayBookingsList = await prisma.booking.findMany({
    where: { businessId, date: { gte: todayStart } },
    orderBy: { time: 'asc' },
    include: { service: true },
  })

  const typeConfig = BUSINESS_TYPES[business?.type as BusinessType]

  const capacityData: { label: string; used: number; max: number }[] = []
  if (business?.maxTables) capacityData.push({ label: 'Tavoli', used: todayActiveBookings, max: business.maxTables })
  if (business?.maxSeats) capacityData.push({ label: 'Posti', used: todayPeople._sum.numberOfPeople || 0, max: business.maxSeats })
  if (business?.maxCapacity) capacityData.push({ label: 'Capacita', used: todayPeople._sum.numberOfPeople || 0, max: business.maxCapacity })

  const serializedBookings = JSON.parse(JSON.stringify(todayBookingsList))
  const serializedRecent = JSON.parse(JSON.stringify(recentBookings))
  const serializedConversations = JSON.parse(JSON.stringify(recentConversations))

  return (
    <DashboardClient
      businessName={business?.name || ''}
      businessLogo={business?.logoUrl || null}
      businessType={business?.type || 'OTHER'}
      serviceLabel={typeConfig?.serviceLabel || 'Servizi'}
      bookingLabel={typeConfig?.bookingLabel || 'Prenotazioni'}
      stats={{
        todayBookings,
        weekBookings,
        totalBookings,
        totalConversations,
        activeConversations,
        totalServices,
        totalCustomers,
        seatedNow: seatedNow._count || 0,
        seatedGuests: seatedNow._sum.numberOfPeople || 0,
        arrivingSoon: arrivingSoonCount.length,
        arrivingSoonParties: arrivingSoonCount.reduce((acc, b) => acc + (b.numberOfPeople || 1), 0),
        coversToday: todayPeople._sum.numberOfPeople || 0,
        waitlistCount: waitlistBookings,
        pendingBookings,
        confirmedBookings,
        arrivedBookings,
        cancelledBookings,
        waitlistBookings,
        completedBookings,
      }}
      dailyBookings={dailyBookings}
      todayBookings={serializedBookings}
      recentBookings={serializedRecent}
      recentConversations={serializedConversations}
      capacityData={capacityData}
      maxTables={business?.maxTables || 0}
    />
  )
}
