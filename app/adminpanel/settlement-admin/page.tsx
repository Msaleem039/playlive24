import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/session'
import SettlementAdminPanelClient from '../settlement-admin-client'

export default async function SettlementAdminPage() {
  const session = await getServerSession()

  // Redirect unauthenticated users to login
  if (!session.isValid || !session.user) {
    redirect('/login')
  }

  // Check role - only SETTLEMENT_ADMIN can access
  const role = session.user.role?.toUpperCase().replace(/[-\s]+/g, '_')
  if (role !== 'SETTLEMENT_ADMIN') {
    redirect('/dashboard')
  }

  return <SettlementAdminPanelClient />
}

