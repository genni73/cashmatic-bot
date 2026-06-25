import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import KnowledgeClient from './knowledge-client'

export default async function KnowledgePage() {
  const session = await getSession()
  if (!session?.user.businessId) redirect('/login')

  const notes = await prisma.knowledgeNote.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Knowledge Base
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Scrivi note o importa file .md da Obsidian. Il bot AI le userà come contesto aggiuntivo per rispondere ai clienti.
      </p>
      <KnowledgeClient notes={notes} businessId={session.user.businessId} />
    </div>
  )
}
