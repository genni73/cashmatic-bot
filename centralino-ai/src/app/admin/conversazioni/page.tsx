import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ConversationsClient from './conversations-client'

export default async function ConversazioniPage() {
  const session = await getSession()
  if (!session?.user.businessId) redirect('/login')

  const conversations = await prisma.conversation.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
    take: 50,
  })

  const serialized = JSON.parse(JSON.stringify(conversations))

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Conversazioni</h1>
      <ConversationsClient conversations={serialized} />
    </div>
  )
}
