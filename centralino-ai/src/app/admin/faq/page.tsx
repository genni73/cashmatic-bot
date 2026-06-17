import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import FAQClient from './faq-client'

export default async function FAQPage() {
  const session = await getSession()
  if (!session?.user.businessId) redirect('/login')

  const faqs = await prisma.fAQ.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">FAQ Personalizzate</h1>
      <p className="text-gray-500 text-sm mb-6">
        Aggiungi domande e risposte frequenti. L'AI le userà per rispondere ai clienti.
      </p>
      <FAQClient faqs={faqs} businessId={session.user.businessId} />
    </div>
  )
}
