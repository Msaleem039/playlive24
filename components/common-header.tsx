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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import Logo from "./utils/Logo"
import { useDispatch, useSelector } from "react-redux"
import { logout as logoutThunk, selectCurrentUser, setCredentials } from "@/app/store/slices/authSlice"
import { useLoginMutation } from "@/app/services/Api"
import Cookies from "js-cookie"

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
    'Game Controls',
    'Chip Summary',
    'Game List',
    'Detail Report'
  ],
  CLIENT: [
    'Dashboard',
    'My Bets',
    'Matches',
    'Account Statement',
    'Bet History',
    'Profit Loss'
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
  const menuRef = useRef<HTMLDivElement | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const authUser = useSelector(selectCurrentUser)
  const [login] = useLoginMutation()

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

  // Get navigation items based on user role
  const navigationItems = useMemo(() => {
    const role = userInfo.role as keyof typeof roleNavigationItems
    return roleNavigationItems[role] || roleNavigationItems.CLIENT
  }, [userInfo.role])

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
      console.log("Balance refresh: Current balance in Redux:", authUser?.balance)
      console.log("Balance refresh: To get updated balance, please ensure deposit/withdraw API returns updated parent user data")
      
      // If you have a token-based refresh endpoint, you could call it here
      // For now, we rely on deposit/withdraw responses to update the balance
    } catch (error) {
      console.error("Failed to refresh user balance:", error)
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
        <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 h-10 sm:h-12 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              aria-label="Open sidebar"
              onClick={() => setIsSidebarOpen(true)}
              className="text-emerald-400 rounded p-1.5 sm:p-2 flex-shrink-0 hover:bg-black/10 transition-colors"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="hidden sm:block text-lg sm:text-2xl lg:text-3xl font-extrabold text-white tracking-wide flex-shrink-0"
            >
              <Logo/>
            </motion.div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#00A66E] text-black px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full shadow-sm min-w-[90px] sm:min-w-[120px] justify-center">
              <Coins className="w-3 h-3 sm:w-3.5 sm:h-4 text-[#FFD949] flex-shrink-0" />
              <div className="leading-tight text-left min-w-0">
                <div className="text-xs sm:text-sm font-medium truncate">{userInfo.balance}</div>
              </div>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 sm:gap-2 bg-[#00A66E] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-black font-semibold shadow-sm hover:bg-[#00b97b] transition text-xs sm:text-sm min-w-0"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate max-w-[80px] sm:max-w-none">{userInfo.name || <span className="text-xs sm:text-sm">User</span>}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform flex-shrink-0 ${isUserMenuOpen ? "rotate-180" : "rotate-0"}`}
                />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-[60]"
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
                        onClick={() => {
                          refreshUserBalance()
                          setIsUserMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-[#f4f7f6] transition"
                        title="Refresh balance (balance updates automatically after deposit/withdraw)"
                      >
                        <RefreshCw className="w-4 h-4 text-[#00A66E]" />
                        <span>Refresh Balance</span>
                      </button>
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
        <div className="animate-marquee text-[0.65rem] xs:text-[0.70rem] sm:text-[0.75rem] text-white font-medium whitespace-nowrap">
          Welcome to Playlive7! If you have any queries, contact us +923216258560
        </div>
      </div>

      {/* Navigation Bar - Combined from SharedNavigation */}
      {onTabChange && (
        <div className="relative z-[20]">
          {/* Main Navigation Header */}
          <div className="bg-[#00A66E] text-black">
            <div className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
              <div className="flex justify-start sm:justify-center items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-6 xl:space-x-8 overflow-x-auto no-scrollbar scroll-smooth">
                {navigationItems.map((item) => (
                  <button
                    key={item}
                    onClick={() => onTabChange?.(item)}
                    className={`font-semibold flex items-center whitespace-nowrap text-[0.65rem] xs:text-[0.7rem] sm:text-[0.75rem] md:text-[0.8rem] transition-colors min-h-[25px] sm:min-h-[25px] px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 ${
                      item === 'Game Controls' ? 'hover:text-gray-200' : ''
                    } ${
                      item === activeTab 
                        ? 'bg-white text-black rounded font-bold shadow-sm' 
                        : 'hover:text-gray-200 hover:bg-black/10 rounded'
                    }`}
                  >
                    {item}
                    {item === 'Game Controls' && (
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5 sm:ml-1 flex-shrink-0" />
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
    </div>
  )
}

