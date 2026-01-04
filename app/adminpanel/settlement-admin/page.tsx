import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/session'
import SettlementAdminPanelClient from '../settlement-admin-client'

export default async function SettlementAdminPage() {
  const session = await getServerSession()

  // Redirect unauthenticated users to login
  if (!session.isValid || !session.user) {
    redirect('/login')
  }

  // Check role - SETTLEMENT_ADMIN and SUPER_ADMIN can access
  const role = session.user.role?.toUpperCase().replace(/[-\s]+/g, '_')
  if (role !== 'SETTLEMENT_ADMIN' && role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  return <SettlementAdminPanelClient />
}

