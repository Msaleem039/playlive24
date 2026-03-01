"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { selectCurrentUser } from "@/app/store/slices/authSlice"
import DashboardHeader from "@/components/dashboard-header"

export default function ClientRulesPage() {
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
      <div className={`${isClient ? "pt-[20px]" : ""} min-h-[400px] bg-white rounded-lg shadow p-6`}>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Rules &amp; Guidelines</h1>
        <h2 className="text-lg font-semibold text-gray-800 mt-4 mb-3">Betting Agreement</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>If you are placing bet that mean you are accepting our Betting Agreement.</li>
          <li>Cheating Bets Deleted Automatically. No Claims.</li>
          <li>Worng Rate Bets Deleted Automatically in Fancy and ODDS. No Claims.</li>
          <li>cheating and Un-Fair Bets Cancelled Or Corrected Even After SETTELING.</li>
          <li>In All Events Max Back Rate is 100. All Back Bets Chanched To 100. If you More Feeded By You.</li>
          <li>Dead Hit Rule Feeded By Betfair.</li>
          <li>You are only responsible of your account and passwords.</li>
          <li>Local Fancy On Haar Jeet Bassis.</li>
          <li>On Match Canclled, NO Result Abandoned ETC. Completed Sessions Settled.</li>
          <li>On Match Tie, All Completed Sessions Settled.</li>
          <li>If You Not Accept This Agreement Do Not Place Bet.</li>
          <li>Administrator Decision Is Final No Claim On It.</li>
          <li>This Website for Fun Betting Only. No Real Money Involed.</li>
          <li>All Events On Haar Jeet Bassis. If we Are Facing Any Issue On Server End.</li>
          <li>If You Have Any Issue You Can Contact Your Dealer.</li>
          <li>For any commision issue Contact Your Dealer.</li>
          <li>From your winnings, all dealers are responsible to pay you min. x2 of your last deposit amount in every 24hours</li>
        </ol>
      </div>
    </div>
  )
}

