import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { BUSINESS_TYPES, BusinessType } from '@/lib/business-types'
import Sidebar from '@/components/ui/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const typeConfig = BUSINESS_TYPES[session.user.business?.type as BusinessType]

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar
        businessName={session.user.business?.name || 'La tua attività'}
        businessType={typeConfig?.label || 'Attività'}
        logoUrl={session.user.business?.logoUrl || null}
      />
      <main className="flex-1 p-8" style={{ color: 'var(--text-primary)' }}>{children}</main>
    </div>
  )
}
