'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/app/store/slices/authSlice'
import SettlementAdminLayout from '@/components/layouts/SettlementAdminLayout'
import Loader from '@/components/utils/Loader'

export default function SettlementAdminPanelClient() {
  const router = useRouter()
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  const isSettlementAdmin = userRole === 'SETTLEMENT_ADMIN'

  useEffect(() => {
    // Client-side role check
    if (!authUser) {
      router.push('/login')
      return
    }

    // Only SETTLEMENT_ADMIN role can access
    if (!isSettlementAdmin) {
      router.push('/dashboard')
      return
    }
  }, [authUser, isSettlementAdmin, router])

  // Show loader while checking auth
  if (!authUser || !isSettlementAdmin) {
    return <Loader />
  }

  return <SettlementAdminLayout />
}


