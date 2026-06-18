import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BUSINESS_TYPES, BusinessType } from '@/lib/business-types'
import ServiceForm from './service-form'

export default async function ServiziPage() {
  const session = await getSession()
  if (!session?.user.businessId) redirect('/login')

  const services = await prisma.service.findMany({
    where: { businessId: session.user.businessId },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  })

  const typeConfig = BUSINESS_TYPES[session.user.business?.type as BusinessType]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{typeConfig?.serviceLabel || 'Servizi'}</h1>
        <div className="flex gap-2">
          <a href="/api/export/services?format=csv" className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">📊 Excel</a>
          <a href="/api/export/services?format=pdf" className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">📄 PDF</a>
        </div>
      </div>
      <ServiceForm
        services={services}
        businessId={session.user.businessId}
        categories={typeConfig?.defaultCategories || []}
        serviceLabel={typeConfig?.serviceLabel || 'Servizi'}
      />
    </div>
  )
}
