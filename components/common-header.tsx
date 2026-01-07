"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Coins,
  Menu,
  ChevronDown,
  Lock,
  FileText,
  BarChart2,
  History,
  BookOpen,
  SlidersHorizontal,
  LogOut,
  Clock as ClockIcon,
  User,
  Shield,
  Mail,
  CalendarDays,
  RefreshCw,
  Radio,
  Video,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import Logo from "./utils/Logo"
import { useDispatch, useSelector } from "react-redux"
import { logout as logoutThunk, selectCurrentUser, setCredentials } from "@/app/store/slices/authSlice"
import { useLoginMutation, useChangePasswordMutation, useSuperAdminSelfTopupMutation, useUpdateSiteVideoMutation, useGetSiteVideoQuery } from "@/app/services/Api"
import Cookies from "js-cookie"
import ChangePasswordModal from "@/components/modal/ChangePasswordModal"
import SelfTopupModal from "@/components/modal/SelfTopupModal"
import VideoUploadModal from "@/components/modal/VideoUploadModal"
import { toast } from "sonner"
import { useCricketLiveUpdates } from "@/app/hooks/useWebSocket"
import { useCricketMatches } from "@/app/hooks/useCricketMatches"

// Define navigation items for each role
const roleNavigationItems = {
  SUPER_ADMIN: [
    'Dashboard',
    'User Management',
    'Matches',
    'My Market',
    'Casino Analysis',
    'Game Controls',
    'System Settings',
    'Reports',
    'Detail Report'
  ],
  ADMIN: [
    'Dashboard',
    'User List',
    'Matches',
    'My Market',
    'Casino Analysis',
    'Game Controls',
    'Chip Summary',
    'Game List',
    'Detail Report'
  ],
  AGENT: [
    'Dashboard',
    'User List',
    'Matches',
    'My Market',
    'Casino Analysis',
    // 'Game Controls',
    'Chip Summary',
    // 'Game List',
    // 'Account Statement',
    'Bet History',
    'Balance Sheet',
    'Detail Report'
  ],
  CLIENT: [
    'Dashboard',
    'My Bets',
    'Matches',
    'Account Statement',
    'Bet History',
    'Profit Loss'
  ],
  SETTLEMENT_ADMIN: [
    'Settlement Management',
    'Pending Settlements',
    'Settlement Results',
    'Settlement Reports'
  ]
}

interface CommonHeaderProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export default function CommonHeader({ activeTab = 'Dashboard', onTabChange }: CommonHeaderProps = {}) {
  const router = useRouter()
  const dispatch = useDispatch<any>()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [isSelfTopupModalOpen, setIsSelfTopupModalOpen] = useState(false)
  const [isVideoUploadModalOpen, setIsVideoUploadModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const authUser = useSelector(selectCurrentUser)
  const [login] = useLoginMutation()
  const [changePassword] = useChangePasswordMutation()
  const [superAdminSelfTopup, { isLoading: isSelfTopupLoading }] = useSuperAdminSelfTopupMutation()
  const [updateSiteVideo, { isLoading: isVideoUploadLoading }] = useUpdateSiteVideoMutation()

  // WebSocket for live cricket updates
  const {
    isConnected,
    liveMatches: liveCricketMatches,
  } = useCricketLiveUpdates({
    url: process.env.NEXT_PUBLIC_SOCKET_URL
      ? `${process.env.NEXT_PUBLIC_SOCKET_URL}/entitysport`
      : 'http://localhost:3000/entitysport',
    autoConnect: true,
    realtimeEvent: 'entitySportRealtimeData',
    listEvent: 'entitySportLiveData',
  })
  
  // Fetch cricket matches from API as fallback
  const { matches: cricketMatches } = useCricketMatches({
    page: 1,
    per_page: 20,
  })

  // Use live matches if available and connected, otherwise use API data
  const currentCricketMatches = (isConnected && liveCricketMatches.length > 0) 
    ? liveCricketMatches 
    : cricketMatches

  // Calculate live cricket matches count using iplay field
  const liveCricketCount = useMemo(() => {
    const liveMatches = currentCricketMatches.filter((match: any) => {
      // Use iplay field directly from API response
      if (typeof match?.iplay === 'boolean') {
        return match.iplay === true
      }
      // Fallback to legacy logic if iplay not available
      const statusText = (match?.status_str || match?.state || match?.match_status || '')
        .toString()
        .toLowerCase()
      return (
        statusText.includes('live') ||
        match?.status === 3 ||
        match?.game_state === 3 ||
        match?.match_status === 'live'
      )
    })
    return liveMatches.length
  }, [currentCricketMatches])

  const normalizeNumber = (value: any) => {
    const parsed = typeof value === "number" ? value : parseFloat(value ?? "")
    return Number.isFinite(parsed) ? parsed : 0
  }

  const formatMoney = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const formatDate = (value?: string | null) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const userInfo = useMemo(() => {
    // If no authUser, return minimal state (Redux should be initialized synchronously, so this should be rare)
    if (!authUser) {
      return {
        name: null,
        balanceRaw: 0,
        balance: formatMoney(0),
        exposure: null,
        creditLimit: null,
        timezone: "GMT+5:00",
        role: "CLIENT",
        roleLabel: "Client",
        userId: null,
        email: null,
        createdAtLabel: null,
        updatedAtLabel: null,
      }
    }

    // Debug logging
    console.log("CommonHeader: authUser from Redux:", authUser)
    console.log("CommonHeader: balance field:", authUser?.balance)
    console.log("CommonHeader: all balance fields:", {
      balance: authUser?.balance,
      walletBalance: authUser?.walletBalance,
      availableBalance: authUser?.availableBalance,
      available_balance: authUser?.available_balance,
      chips: authUser?.chips
    })

    const role = (authUser?.role as string | undefined) ?? "CLIENT"
    const balanceValue = normalizeNumber(
      authUser?.balance ??
      authUser?.walletBalance ??
      authUser?.availableBalance ??
      authUser?.available_balance ??
      authUser?.chips
    )
    
    console.log("CommonHeader: Normalized balance value:", balanceValue)
    const exposureValue = normalizeNumber(
      authUser?.exposure ??
      authUser?.currentExposure ??
      authUser?.totalExposure
    )
    const creditLimitValue = normalizeNumber(
      authUser?.creditLimit ??
      authUser?.credit_limit
    )

    return {
      name:
        authUser?.username ??
        authUser?.name ??
        authUser?.fullName ??
        authUser?.email ??
        "User",
      balanceRaw: balanceValue,
      balance: formatMoney(balanceValue),
      exposure: exposureValue ? formatMoney(exposureValue) : null,
      creditLimit: creditLimitValue ? formatMoney(creditLimitValue) : null,
      timezone: authUser?.timezone ?? authUser?.time_zone ?? "GMT+5:00",
      role,
      roleLabel: role.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\S/g, (t) => t.toUpperCase()),
      userId: authUser?.userId ?? authUser?.id ?? authUser?.username ?? null,
      email: authUser?.email ?? null,
      createdAtLabel: formatDate(authUser?.createdAt ?? authUser?.created_at),
      updatedAtLabel: formatDate(authUser?.updatedAt ?? authUser?.updated_at),
    }
  }, [authUser])

  const dropdownItems = useMemo(() => {
    const role = userInfo.role

    if (role === "CLIENT") {
      return [
        { label: "Change Password", href: null, icon: Lock, action: "modal" },
        { label: "Account Statement", href: "/client/account-statement", icon: FileText, action: "navigate" },
        { label: "Profit Loss", href: "/client/profit-loss", icon: BarChart2, action: "navigate" },
        { label: "Bet History", href: "/client/bet-history", icon: History, action: "navigate" },
        { label: "Rules", href: "/client/rules", icon: BookOpen, action: "navigate" },
        { label: "Set Button Value", href: "/client/set-button-value", icon: SlidersHorizontal, action: "navigate" },
      ]
    }

    if (role === "AGENT") {
      return [
        { label: "Change Password", href: null, icon: Lock, action: "modal" },
        { label: "Account Statement", href: "/agent/account-statement", icon: FileText, action: "navigate" },
        { label: "Bet History", href: "/agent/bet-history", icon: History, action: "navigate" },
        { label: "Balance Sheet", href: "/agent/balance-sheet", icon: BarChart2, action: "navigate" },
        { label: "Rules", href: "/rules", icon: BookOpen, action: "navigate" },
      ]
    }

    if (role === "SETTLEMENT_ADMIN") {
      return [
        { label: "Change Password", href: null, icon: Lock, action: "modal" },
        { label: "Settlement Management", href: "/adminpanel/settlement-admin", icon: Shield, action: "navigate" },
        { label: "Rules", href: "/rules", icon: BookOpen, action: "navigate" },
      ]
    }

    return [
      { label: "Change Password", href: null, icon: Lock, action: "modal" },
      { label: "Account Statement", href: "/agent/account-statement", icon: FileText, action: "navigate" },
      { label: "Bet History", href: "/agent/bet-history", icon: History, action: "navigate" },
      { label: "Balance Sheet", href: "/agent/balance-sheet", icon: BarChart2, action: "navigate" },
      { label: "Rules", href: "/rules", icon: BookOpen, action: "navigate" },
    ]
  }, [userInfo.role])

  // Get navigation items based on user role
  const navigationItems = useMemo(() => {
    const role = userInfo.role as keyof typeof roleNavigationItems
    return roleNavigationItems[role] || roleNavigationItems.CLIENT
  }, [userInfo.role])
  const isSuperAdmin = userInfo.role === "SUPER_ADMIN"
  
  // Fetch site video only for super admin
  const { data: siteVideoData } = useGetSiteVideoQuery(undefined, { skip: !isSuperAdmin })

  // Function to manually refresh user balance
  const refreshUserBalance = async () => {
    try {
      const userEmail = authUser?.email || (typeof window !== 'undefined' ? sessionStorage.getItem('user_email') : null)
      if (!userEmail) {
        console.warn("Cannot refresh: No email found")
        return
      }

      // Note: We can't call login without password
      // The balance should be updated from deposit/withdraw API responses
      // If backend doesn't return updated user in deposit/withdraw response,
      // the user needs to logout and login again to get fresh balance
      // console.log("Balance refresh: Current balance in Redux:", authUser?.balance)
      // console.log("Balance refresh: To get updated balance, please ensure deposit/withdraw API returns updated parent user data")
      
      // If you have a token-based refresh endpoint, you could call it here
      // For now, we rely on deposit/withdraw responses to update the balance
    } catch (error) {
      console.error("Failed to refresh user balance:", error)
    }
  }

  const persistUpdatedUser = (updatedUser: any) => {
    dispatch(setCredentials({
      user: updatedUser,
      token: Cookies.get("token") || "",
    }))

    try {
      Cookies.set("auth_user", JSON.stringify(updatedUser), { path: '/', sameSite: 'lax' })
      if (typeof window !== "undefined") {
        window.localStorage.setItem("auth_user", JSON.stringify(updatedUser))
      }
    } catch (storageError) {
      console.warn("Failed to update stored auth", storageError)
    }
  }

  const handleSelfTopupSubmit = async ({ amount, remarks }: { amount: number; remarks: string }) => {
    try {
      const response = await superAdminSelfTopup({
        balance: amount,
        remarks,
      }).unwrap()

      const updatedUserFromApi =
        response?.user ||
        response?.data?.user ||
        response?.superAdmin ||
        response?.updatedUser

      if (updatedUserFromApi) {
        persistUpdatedUser(updatedUserFromApi)
      } else if (authUser) {
        const currentBalance = normalizeNumber(
          authUser.balance ??
          authUser.walletBalance ??
          authUser.availableBalance ??
          authUser.available_balance ??
          authUser.chips
        )
        const newBalance = currentBalance + amount
        const optimisticUser = {
          ...authUser,
          balance: newBalance,
          walletBalance: newBalance,
          availableBalance: newBalance,
          available_balance: newBalance,
        }
        persistUpdatedUser(optimisticUser)
      }

      toast.success(`Successfully added ${amount.toFixed(2)} to your balance`, {
        description: remarks || undefined,
      })
      setIsSelfTopupModalOpen(false)
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        error?.error?.data?.message ||
        error?.message ||
        "Failed to top up balance. Please try again."
      toast.error("Top-up failed", {
        description: errorMessage,
      })
      throw error
    }
  }

  useEffect(() => {
    if (!isUserMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isUserMenuOpen])

  const handleChangePassword = async (data: {
    password: string
    confirmPassword: string
  }) => {
    try {
      await changePassword({
        password: data.password,
        confirmPassword: data.confirmPassword,
      }).unwrap()
      toast.success("Password updated successfully")
      setIsChangePasswordModalOpen(false)
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        error?.error?.data?.message ||
        error?.message ||
        "Failed to change password. Please try again."
      toast.error("Change password failed", {
        description: errorMessage,
      })
      throw error
    }
  }

  const handleVideoUpload = async (data: { videoUrl: string }) => {
    try {
      await updateSiteVideo(data).unwrap()
      toast.success("Video uploaded successfully")
      setIsVideoUploadModalOpen(false)
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        error?.error?.data?.message ||
        error?.message ||
        "Failed to upload video. Please try again."
      toast.error("Video upload failed", {
        description: errorMessage,
      })
      throw error
    }
  }

  const handleLogout = () => {
    try {
      Cookies.remove("token")
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_user")
      }
    } catch (err) {
      console.warn("Failed to clear stored auth", err)
    }

    dispatch(logoutThunk())
    setIsUserMenuOpen(false)
    router.push("/login")
  }

  return (
    <div className="bg-gray-100">
      {/* Top bar */}
      <div className="bg-[#334443]">
        <div className="w-full px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 h-10 sm:h-12 flex items-center justify-between gap-1 xs:gap-2">
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              aria-label="Open sidebar"
              onClick={() => setIsSidebarOpen(true)}
              className="text-emerald-400 rounded p-1 xs:p-1.5 sm:p-2 flex-shrink-0 hover:bg-black/10 transition-colors"
            >
              <Menu className="w-4 h-4 xs:w-4.5 sm:w-5 sm:h-5" />
            </button>
            {/* Logo - Hidden on small screens, shown from sm breakpoint */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="hidden sm:block text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-wide flex-shrink-0"
            >
              <Logo/>
            </motion.div>
          </div>
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
            <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 bg-[#00A66E] text-black px-1 xs:px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-0.5 xs:py-0.5 sm:py-1 md:py-1.5 rounded-full shadow-sm min-w-[65px] xs:min-w-[75px] sm:min-w-[90px] md:min-w-[110px] lg:min-w-[120px] justify-center">
              <Coins className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-[#FFD949] flex-shrink-0" />
              <div className="leading-tight text-left min-w-0">
                <div className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium truncate">{userInfo.balance}</div>
              </div>
            </div>
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => setIsSelfTopupModalOpen(true)}
                  className="px-2 xs:px-2.5 sm:px-3 py-1 text-[10px] xs:text-xs sm:text-sm font-semibold rounded-full bg-white/10 text-white border border-white/30 hover:bg-white/20 transition-colors"
                  title="Top up super admin balance"
                >
                  Top Up
                </button>
                <button
                  onClick={() => setIsVideoUploadModalOpen(true)}
                  className="px-2 xs:px-2.5 sm:px-3 py-1 text-[10px] xs:text-xs sm:text-sm font-semibold rounded-full bg-white/10 text-white border border-white/30 hover:bg-white/20 transition-colors flex items-center gap-1"
                  title="Upload site video"
                >
                  <Video className="w-3 h-3" />
                  <span className="hidden sm:inline">Video</span>
                </button>
              </>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 bg-[#00A66E] px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 sm:py-1.5 rounded-full text-black font-semibold shadow-sm hover:bg-[#00b97b] transition text-[10px] xs:text-xs sm:text-sm min-w-0"
              >
                <User className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate max-w-[50px] xs:max-w-[60px] sm:max-w-[80px] md:max-w-none">{userInfo.name || <span className="text-[10px] xs:text-xs sm:text-sm">User</span>}</span>
                <ChevronDown
                  className={`w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 transition-transform flex-shrink-0 ${isUserMenuOpen ? "rotate-180" : "rotate-0"}`}
                />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-[280px] xs:w-56 sm:w-64 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-[60]"
                  >
                    <div className="px-3 xs:px-4 py-2 xs:py-3 bg-gray-100 text-[10px] xs:text-xs font-semibold text-gray-700 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1 xs:gap-0">
                      <div className="flex items-center gap-1.5 xs:gap-2">
                        <ClockIcon className="w-3 h-3 xs:w-3.5 xs:h-3.5 flex-shrink-0" />
                        <span className="truncate">{userInfo.timezone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] xs:text-[10px] sm:text-[11px] text-gray-600">
                        <Shield className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-[#00A66E] flex-shrink-0" />
                        <span>{userInfo.roleLabel}</span>
                      </div>
                    </div>

                    {(userInfo.userId || userInfo.email || userInfo.balance || userInfo.exposure || userInfo.creditLimit) && (
                      <div className="px-3 xs:px-4 py-2 xs:py-3 bg-white border-b border-gray-200 text-[10px] xs:text-xs text-gray-600 space-y-1">
                        {userInfo.email && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-500 flex items-center gap-1 flex-shrink-0">
                              <Mail className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-[#00A66E]" /> Email
                            </span>
                            <span className="font-medium text-gray-800 truncate max-w-[120px] xs:max-w-[140px] sm:max-w-[160px] text-right">
                              {userInfo.email}
                            </span>
                          </div>
                        )}
                        {userInfo.exposure && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-500">Exposure</span>
                            <span className="font-semibold text-gray-800 truncate">{userInfo.exposure}</span>
                          </div>
                        )}
                        {userInfo.creditLimit && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-500">Credit Limit</span>
                            <span className="font-semibold text-gray-800 truncate">{userInfo.creditLimit}</span>
                          </div>
                        )}
                        {userInfo.createdAtLabel && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-500 flex items-center gap-1 flex-shrink-0">
                              <CalendarDays className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-[#00A66E]" /> Joined
                            </span>
                            <span className="font-medium text-gray-800 text-right max-w-[140px] xs:max-w-[160px] sm:max-w-[180px] text-[9px] xs:text-[10px] sm:text-xs">
                              {userInfo.createdAtLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="py-1 text-xs xs:text-sm text-gray-700">
                      {dropdownItems.map((item) => {
                        const { label, href, icon: Icon, action } = item
                        const tabName = 'tab' in item ? item.tab : undefined
                        if (action === "modal") {
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setIsChangePasswordModalOpen(true)
                                setIsUserMenuOpen(false)
                              }}
                              className="w-full flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-1.5 xs:py-2 text-left text-gray-700 hover:bg-[#f4f7f6] transition"
                            >
                              <Icon className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-[#00A66E] flex-shrink-0" />
                              <span className="text-[11px] xs:text-xs sm:text-sm">{label}</span>
                            </button>
                          )
                        }
                        if (action === "tab" && onTabChange && tabName && typeof tabName === "string") {
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => {
                                onTabChange(tabName)
                                setIsUserMenuOpen(false)
                              }}
                              className="w-full flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-1.5 xs:py-2 text-left text-gray-700 hover:bg-[#f4f7f6] transition"
                            >
                              <Icon className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-[#00A66E] flex-shrink-0" />
                              <span className="text-[11px] xs:text-xs sm:text-sm">{label}</span>
                            </button>
                          )
                        }
                        return (
                          <Link
                            key={label}
                            href={href || "#"}
                            className="flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-1.5 xs:py-2 hover:bg-[#f4f7f6] transition"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Icon className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-[#00A66E] flex-shrink-0" />
                            <span className="text-[11px] xs:text-xs sm:text-sm">{label}</span>
                          </Link>
                        )
                      })}
                      <button
                        onClick={() => {
                          refreshUserBalance()
                          setIsUserMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-1.5 xs:py-2 text-left text-gray-700 hover:bg-[#f4f7f6] transition"
                        title="Refresh balance (balance updates automatically after deposit/withdraw)"
                      >
                        <RefreshCw className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-[#00A66E] flex-shrink-0" />
                        <span className="text-[11px] xs:text-xs sm:text-sm">Refresh Balance</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-1.5 xs:py-2 text-left text-[#8B1A3A] hover:bg-[#fce8ee] transition"
                      >
                        <LogOut className="w-3.5 h-3.5 xs:w-4 xs:h-4 flex-shrink-0" />
                        <span className="text-[11px] xs:text-xs sm:text-sm">Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      {/* Marquee */}
      <div className="bg-black text-emerald-400 py-0.5 xs:py-1 overflow-hidden">
        <div className="animate-marquee text-[0.55rem] xs:text-[0.6rem] sm:text-[0.65rem] md:text-[0.70rem] lg:text-[0.75rem] text-white font-medium whitespace-nowrap">
          Welcome to Playlive7! If you have any queries, contact us +923254353
        </div>
      </div>

      {/* Navigation Bar - Combined from SharedNavigation */}
      {onTabChange && (
        <div className="relative z-[20]">
          {/* Main Navigation Header */}
          <div className="bg-[#00A66E] text-black">
            <div className="px-1 xs:px-1.5 sm:px-3 md:px-4 lg:px-4 py-1 xs:py-1.5 sm:py-2 md:py-2.5 lg:py-3">
              <div className="flex justify-start sm:justify-center items-center space-x-0.5 xs:space-x-1 sm:space-x-1.5 md:space-x-2 lg:space-x-3 xl:space-x-4 overflow-x-auto no-scrollbar scroll-smooth">
                {navigationItems.map((item) => (
                  <button
                    key={item}
                    onClick={() => onTabChange?.(item)}
                    className={`font-semibold flex items-center gap-0.5 xs:gap-1 sm:gap-1.5 whitespace-nowrap text-[0.55rem] xs:text-[0.6rem] sm:text-[0.65rem] md:text-[0.7rem] lg:text-[0.75rem] xl:text-[0.8rem] transition-colors min-h-[20px] xs:min-h-[22px] sm:min-h-[24px] md:min-h-[26px] lg:min-h-[28px] px-1 xs:px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-0.5 xs:py-1 sm:py-1.5 md:py-2 ${
                      item === 'Game Controls' ? 'hover:text-gray-200' : ''
                    } ${
                      item === activeTab 
                        ? 'bg-white text-black rounded font-bold shadow-sm' 
                        : 'hover:text-gray-200 hover:bg-black/10 rounded'
                    }`}
                  >
                    <span className="truncate">{item}</span>
                    {/* Show live count for Matches tab (Cricket) */}
                    {item === 'Matches' && liveCricketCount > 0 && (
                      <span className="flex items-center gap-0.5 xs:gap-1 bg-red-500 text-white px-1 xs:px-1.5 py-0.5 rounded-full text-[0.55rem] xs:text-[0.6rem] sm:text-[0.65rem] font-bold flex-shrink-0">
                        <Radio className="w-2 h-2 xs:w-2.5 xs:h-2.5 animate-pulse flex-shrink-0" />
                        {liveCricketCount}
                      </span>
                    )}
                    {item === 'Game Controls' && (
                      <ChevronDown className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ml-0.5 xs:ml-1 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section Header */}
          {/* <div className="bg-black text-white px-4 sm:px-6 py-2">
            <h1 className="text-lg font-semibold">{activeTab}</h1>
          </div> */}
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedTab="Home"
        onSelectTab={(tab) => {
          // Sidebar navigation - can be customized based on needs
          console.log('Sidebar tab selected:', tab)
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        username={userInfo.name || "User"}
        onSubmit={handleChangePassword}
      />

      {isSuperAdmin && (
        <>
          <SelfTopupModal
            isOpen={isSelfTopupModalOpen}
            onClose={() => setIsSelfTopupModalOpen(false)}
            onSubmit={handleSelfTopupSubmit}
            isSubmitting={isSelfTopupLoading}
          />
          <VideoUploadModal
            isOpen={isVideoUploadModalOpen}
            onClose={() => setIsVideoUploadModalOpen(false)}
            currentVideoUrl={siteVideoData?.videoUrl}
          />
        </>
      )}
    </div>
  )
}

