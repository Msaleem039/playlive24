'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/app/store/slices/authSlice'
import { SettlementAdminPanel } from '@/components/dashboardagent/SettlementAdminPanel'
import Loader from '@/components/utils/Loader'

export default function SettlementAdminPanelClient() {
  const router = useRouter()
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  useEffect(() => {
    // Client-side role check as backup
    if (!authUser) {
      router.push('/login')
      return
    }

    if (!isSuperAdmin) {
      router.push('/dashboard')
      return
    }
  }, [authUser, isSuperAdmin, router])

  // Show loader while checking auth
  if (!authUser || !isSuperAdmin) {
    return <Loader />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <SettlementAdminPanel />
    </div>
  )
}


