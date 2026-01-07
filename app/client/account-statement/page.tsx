"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { selectCurrentUser } from "@/app/store/slices/authSlice"
import DashboardHeader from "@/components/dashboard-header"
import { AccountStatementView } from "@/components/dashboardagent"

export default function ClientAccountStatementPage() {
  const router = useRouter()
  const authUser = useSelector(selectCurrentUser)
  const userRole = (authUser?.role as string) || 'CLIENT'
  const isClient = userRole === 'CLIENT'
  const [dashboardTab, setDashboardTab] = useState('Home')

  // Handle tab change - navigate to dashboard with selected tab
  const handleTabChange = useCallback((tab: string) => {
    setDashboardTab(tab)
    if (tab !== 'Home') {
      router.push('/dashboard')
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('selectedTab', tab)
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-white">
      {isClient && (
        <DashboardHeader 
          selectedTab={dashboardTab} 
          onSelectTab={handleTabChange} 
        />
      )}
      <div className={isClient ? "-mt-0" : "-mt-0"}>
        <AccountStatementView />
      </div>
    </div>
  )
}

