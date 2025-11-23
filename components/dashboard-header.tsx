"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Coins,
  Menu,
  Radio,
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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import Logo from "./utils/Logo"
import { useCricketLiveUpdates } from "@/app/hooks/useWebSocket"
import { useCricketMatches } from "@/app/hooks/useCricketMatches"
import { useDispatch, useSelector } from "react-redux"
import { logout as logoutThunk, selectCurrentUser } from "@/app/store/slices/authSlice"
import Cookies from "js-cookie"

type DashboardHeaderProps = {
  selectedTab: string
  onSelectTab: (tab: string) => void
}

const TABS = [
  { name: "Home", hasLiveCount: false, liveCount: 0 },
  { name: "In-Play", hasLiveCount: false, liveCount: 0 },
  { name: "Cricket", hasLiveCount: true, liveCount: 0 }, // Has WebSocket connection
  { name: "Soccer", hasLiveCount: false, liveCount: 0 }, // No WebSocket yet
  { name: "Tennis", hasLiveCount: false, liveCount: 0 }, // No WebSocket yet
  { name: "Horse", hasLiveCount: false, liveCount: 0 },
  { name: "Greyhound", hasLiveCount: false, liveCount: 0 },
  { name: "Lobby", hasLiveCount: false, liveCount: 0 },
  { name: "Aviator", hasLiveCount: false, liveCount: 0 },
  { name: "Indian Poker", hasLiveCount: false, liveCount: 0 },
  { name: "Casino", hasLiveCount: false, liveCount: 0 },
  { name: "Evolution", hasLiveCount: false, liveCount: 0 },
]

export default function DashboardHeader({ selectedTab, onSelectTab }: DashboardHeaderProps) {
  const router = useRouter()
  const dispatch = useDispatch<any>()
  const active = useMemo(() => selectedTab, [selectedTab])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const authUser = useSelector(selectCurrentUser)

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
    const role = (authUser?.role as string | undefined) ?? "CLIENT"
    const balanceValue = normalizeNumber(
      authUser?.balance ??
      authUser?.walletBalance ??
      authUser?.availableBalance ??
      authUser?.available_balance ??
      authUser?.chips
    )
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
        "Guest",
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
        { label: "Change Password", href: "/client/change-password", icon: Lock },
        { label: "Account Statement", href: "/client/account-statement", icon: FileText },
        { label: "Profit Loss", href: "/client/profit-loss", icon: BarChart2 },
        { label: "Bet History", href: "/client/bet-history", icon: History },
        { label: "Rules", href: "/client/rules", icon: BookOpen },
        { label: "Set Button Value", href: "/client/set-button-value", icon: SlidersHorizontal },
      ]
    }

    if (role === "AGENT") {
      return [
        { label: "Change Password", href: "/agent/change-password", icon: Lock },
        { label: "Account Statement", href: "/agent/account-statement", icon: FileText },
        { label: "Clients", href: "/agent/clients", icon: History },
        { label: "Rules", href: "/rules", icon: BookOpen },
      ]
    }

    return [
      { label: "Change Password", href: "/account/change-password", icon: Lock },
      { label: "Account Statement", href: "/account/statement", icon: FileText },
      { label: "Profit Loss", href: "/account/profit-loss", icon: BarChart2 },
      { label: "Bet History", href: "/account/bet-history", icon: History },
      { label: "Rules", href: "/rules", icon: BookOpen },
    ]
  }, [userInfo.role])

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
  const cricketLiveCount = useMemo(() => {
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
  
  // Calculate live counts for each sport based on actual WebSocket data
  const tabsWithLiveCounts = useMemo(() => {
    return TABS.map(tab => {
      if (tab.name === "Cricket") {
        return { ...tab, liveCount: cricketLiveCount }
      }
      // Only show live counts for sports that have actual WebSocket data
      // Other sports will show 0 until their WebSocket connections are implemented
      return { ...tab, liveCount: 0 }
    })
  }, [cricketLiveCount])
  return (
    <div className="sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-[#334443]">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open sidebar"
              onClick={() => setIsSidebarOpen(true)}
              className="text-emerald-400 rounded p-2"
            >
              <Menu className="w-5 h-5" />
            </button>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
            {/* <Image src="/images/logo.png" alt="logo" width={100} height={100} /> */}
            <Logo/>
            </motion.div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#00A66E] text-black px-2 py-1.5 rounded-full shadow-sm min-w-[120px] justify-center">
              <Coins className="w-3 h-4 text-[#FFD949]" />
              <div className="leading-tight text-left">
                {/* <div className="text-[10px] font-semibold uppercase tracking-wide text-black/70">Balance</div> */}
                <div className="text-sm font-medium">{userInfo.balance}</div>
              </div>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-[#00A66E] px-3 py-1.5 rounded-full text-black font-semibold shadow-sm hover:bg-[#00b97b] transition"
              >
                <User className="w-4 h-4" />
                <span className="text-sm">{userInfo.name}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isUserMenuOpen ? "rotate-180" : "rotate-0"}`}
                />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 bg-gray-100 text-xs font-semibold text-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span>{userInfo.timezone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-600">
                        <Shield className="w-3.5 h-3.5 text-[#00A66E]" />
                        <span>{userInfo.roleLabel}</span>
                      </div>
                    </div>

                    {(userInfo.userId || userInfo.email || userInfo.balance || userInfo.exposure || userInfo.creditLimit) && (
                      <div className="px-4 py-3 bg-white border-b border-gray-200 text-xs text-gray-600 space-y-1">
                        {/* {userInfo.userId && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">User ID</span>
                            <span className="font-semibold text-gray-800">{userInfo.userId}</span>
                          </div>
                        )} */}
                        {userInfo.email && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-[#00A66E]" /> Email
                            </span>
                            <span className="font-medium  text-gray-800 truncate max-w-[160px]">
                              {userInfo.email}
                            </span>
                          </div>
                        )}
                        {userInfo.exposure && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Exposure</span>
                            <span className="font-semibold text-gray-800">{userInfo.exposure}</span>
                          </div>
                        )}
                        {userInfo.creditLimit && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Credit Limit</span>
                            <span className="font-semibold text-gray-800">{userInfo.creditLimit}</span>
                          </div>
                        )}
                        {userInfo.createdAtLabel && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5 text-[#00A66E]" /> Joined
                            </span>
                            <span className="font-medium text-gray-800 text-right max-w-[180px]">
                              {userInfo.createdAtLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="py-1 text-sm text-gray-700">
                      {dropdownItems.map(({ label, href, icon: Icon }) => (
                        <Link
                          key={label}
                          href={href}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-[#f4f7f6] transition"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Icon className="w-4 h-4 text-[#00A66E]" />
                          <span>{label}</span>
                        </Link>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-[#8B1A3A] hover:bg-[#fce8ee] transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
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
      <div className="bg-black text-emerald-400 py-1 overflow-hidden">
        <div className="animate-marquee text-[0.70rem] text-white font-medium whitespace-nowrap">
          Welcome to Playlive7! If you have any queries, contact us +923216258560
        </div>
      </div>
      {/* Nav bar */}
      <div className="bg-[#00A66E]">
        <nav className="w-full px-2 sm:px-6 lg:px-6 overflow-x-auto">
          <ul className="flex items-center h-10 gap-4 sm:gap-6 whitespace-nowrap py-1 no-scrollbar">
            {tabsWithLiveCounts.map((tab) => (
              <li key={tab.name} className="shrink-0 relative group">
                <button
                  onClick={() => onSelectTab(tab.name)}
                  className={`uppercase font-bold text-[0.68rem] px-3 py-2 rounded transition-colors ${
                    active === tab.name ? "text-black" : "text-black/80 hover:text-white"
                  }`}
                >
                  {tab.name}
                </button>
                
                {/* Live Count Badge with Signal Icon */}
                {tab.hasLiveCount && tab.liveCount > 0 && (
                  <div className="absolute -top-1 -right-1 flex items-center gap-1">
                    <div className="w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border border-white font-bold">
                      {tab.liveCount}
                    </div>
                    <Radio className="w-3 h-3 text-red-500" />
                  </div>
                )}
                
                {/* Hover line indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedTab={selectedTab}
        onSelectTab={onSelectTab}
      />
    </div>
  )
}


