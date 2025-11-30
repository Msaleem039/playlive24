import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/session'
import SuperAdminSelectClient from './select-client'

export default async function SuperAdminSelectPage() {
  const session = await getServerSession()

  // Redirect unauthenticated users to login
  if (!session.isValid || !session.user) {
    redirect('/login')
  }

  // Check role and redirect if not super admin
  const role = session.user.role?.toUpperCase().replace(/[-\s]+/g, '_')
  if (role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  return <SuperAdminSelectClient />
}

