"use client"

import { useState, useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import Cookies from "js-cookie"
import CommonHeader from "@/components/common-header"
import {
  AddClientModal,
  AllUsersModal,
  UserManagementView,
  AccountStatementView,
  BetHistoryView,
  BalanceSheetView,
  SettlementAdminPanel,
} from "@/components/dashboardagent"
import { MyReportView } from "@/components/MyReportView"
import MatchesView from "@/components/MatchesView"
import {
  MyMarketView,
  CasinoAnalysisView,
  GameControlsView,
  ChipSummaryView,
  GameListView,
  DetailReportView,
  SystemSettingsView,
  ReportsView,
} from "@/components/views"
import { setCredentials } from "@/app/store/slices/authSlice"
import Loader from "@/components/utils/Loader"

export default function DashboardLayout({ role }: { role: string }) {
  const dispatch = useDispatch()
  const user = useSelector((state: any) => state.auth.user) // adjust typing if you have TS types
  const [loading, setLoading] = useState(true)

  // Your existing UI states
  const [activeTab, setActiveTab] = useState("Dashboard")
  const [userTab, setUserTab] = useState("Active Users")
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isAllUsersModalOpen, setIsAllUsersModalOpen] = useState(false)

  // Dummy users data
  const users = [
    {
      id: "1",
      loginName: "demo_user",
      creditLimit: "0.00",
      plCash: "0.00",
      balance: "0.00",
      liability: "0.00",
      availableBalance: "0.00",
      active: true,
    },
  ]

  useEffect(() => {
    // On mount, try to rehydrate auth state from cookie
    const token = Cookies.get("token")
    const userJson = Cookies.get("auth_user") // assuming you store user as JSON string in cookie
    
    if (token && userJson) {
      try {
        const userObj = JSON.parse(userJson)
        dispatch(setCredentials({ token, user: userObj }))
      } catch (e) {
        console.error("Failed to parse user cookie", e)
      }
    }

    setLoading(false)
  }, [dispatch])

  // Ref for the main scrollable container
  const mainRef = useRef<HTMLElement>(null)

  // Reset scroll position when tab changes to prevent fluctuation
  useEffect(() => {
    if (mainRef.current) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        mainRef.current?.scrollTo({ top: 0, behavior: 'instant' })
      })
    }
  }, [activeTab])

  // Prevent body scrolling when dashboard is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  if (loading) {
    return <Loader />
  }

  // Now render the dashboard normally
  const handleAddUser = () => setIsAddUserModalOpen(true)
  const handleAllUsers = () => setIsAllUsersModalOpen(true)

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Header with Navigation - Fixed position, no scrollbar here */}
      <div className="fixed top-0 left-0 right-0 z-30 flex-shrink-0">
        <CommonHeader activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Spacer to push content below fixed header - Top bar (h-10=40px mobile, h-12=48px desktop) + Marquee (py-1≈20px) + Nav bar (≈44px mobile, ≈48px desktop) */}
      <div className="h-[104px] sm:h-[116px] flex-shrink-0" />

      {/* ======= Tab Content ======= - Scrollable area starts below header */}
      <main ref={mainRef} className="flex-1 relative z-10 p-0 pt-0 overflow-x-hidden overflow-y-auto">
        {activeTab === "Dashboard" && <MyReportView />}

        {(activeTab === "User Management" || activeTab === "User List") && (
          <UserManagementView
            userTab={userTab}
            setUserTab={setUserTab}
            users={users}
            onAddUser={handleAddUser}
            onAllUsers={handleAllUsers}
          />
        )}

        {activeTab === "Matches" && <MatchesView />}
        {activeTab === "My Market" && <MyMarketView />}
        {activeTab === "Casino Analysis" && <CasinoAnalysisView />}
        {activeTab === "Game Controls" && <GameControlsView />}
        {activeTab === "Chip Summary" && <ChipSummaryView />}
        {activeTab === "Game List" && <GameListView />}
        {activeTab === "Account Statement" && <AccountStatementView />}
        {activeTab === "Bet History" && <BetHistoryView />}
        {activeTab === "Balance Sheet" && <BalanceSheetView />}
        {activeTab === "Detail Report" && <DetailReportView />}
        {activeTab === "System Settings" && <SystemSettingsView />}
        {activeTab === "Reports" && <ReportsView />}
        {activeTab === "Settlement" && <SettlementAdminPanel />}
      </main>

      {/* ======= Modals ======= */}
      {isAddUserModalOpen && (
        <AddClientModal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          onSubmit={(data) => console.log("Add client:", data)}
        />
      )}

      {isAllUsersModalOpen && (
        <AllUsersModal
          isOpen={isAllUsersModalOpen}
          onClose={() => setIsAllUsersModalOpen(false)}
        />
      )}
    </div>
  )
}
