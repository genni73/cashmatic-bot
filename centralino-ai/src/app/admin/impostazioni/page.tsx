import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BUSINESS_TYPES, BusinessType } from '@/lib/business-types'
import SettingsForm from './settings-form'

export default async function ImpostazioniPage() {
  const session = await getSession()
  if (!session?.user.businessId) redirect('/login')

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
  })

  if (!business) redirect('/login')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Impostazioni</h1>
      <SettingsForm business={business} />
    </div>
  )
}
