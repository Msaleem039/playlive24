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
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Logo from "./utils/Logo"
import { useDispatch, useSelector } from "react-redux"
import { logout as logoutThunk, selectCurrentUser } from "@/app/store/slices/authSlice"
import { useGetWalletQuery, useChangePasswordMutation } from "@/app/services/Api"
import Cookies from "js-cookie"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import ChangePasswordModal from "./modal/ChangePasswordModal"

interface DashboardTopBarProps {
  onSidebarOpen: () => void
}

export default function DashboardTopBar({ onSidebarOpen }: DashboardTopBarProps) {
  const router = useRouter()
  const dispatch = useDispatch<any>()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isBalanceMenuOpen, setIsBalanceMenuOpen] = useState(false)
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const balanceMenuRef = useRef<HTMLDivElement | null>(null)

  const authUser = useSelector(selectCurrentUser)
  const [changePassword] = useChangePasswordMutation()

  // Fetch wallet data (balance, liability, availableBalance)
  const { data: walletData, refetch: refetchWallet } = useGetWalletQuery(undefined, {
    skip: !authUser, // Skip if user is not logged in
    pollingInterval: 30000, // Poll every 30 seconds to keep balance updated
  })

  // Track if component has mounted to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

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
    
    // During SSR or before mount, use authUser data only to prevent hydration mismatch
    // After mount, prioritize wallet data if available, otherwise fall back to authUser fields
    const balanceValue = normalizeNumber(
      isMounted && walletData?.balance !== undefined
        ? walletData.balance
        : authUser?.balance ??
          authUser?.walletBalance ??
          authUser?.availableBalance ??
          authUser?.available_balance ??
          authUser?.chips ??
          0
    )
    
    const liabilityValue = normalizeNumber(
      isMounted && walletData?.liability !== undefined
        ? walletData.liability
        : authUser?.liability ??
          authUser?.exposure ??
          authUser?.currentExposure ??
          authUser?.totalExposure ??
          0
    )
    
    const availableBalanceValue = normalizeNumber(
      isMounted && walletData?.availableBalance !== undefined
        ? walletData.availableBalance
        : authUser?.availableBalance ??
          authUser?.available_balance ??
          (balanceValue - liabilityValue)
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
      liability: liabilityValue ? formatMoney(liabilityValue) : null,
      availableBalance: availableBalanceValue ? formatMoney(availableBalanceValue) : null,
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
  }, [authUser, walletData, isMounted])

  const dropdownItems = useMemo(() => {
    const role = userInfo.role

    if (role === "CLIENT") {
      return [
        { label: "Change Password", href: "/client/change-password", icon: Lock },
        { label: "Account Statement", href: "/client/account-statement", icon: FileText },
        // { label: "Profit Loss", href: "/client/profit-loss", icon: BarChart2 },
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

  useEffect(() => {
    if (!isBalanceMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (balanceMenuRef.current && !balanceMenuRef.current.contains(event.target as Node)) {
        setIsBalanceMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isBalanceMenuOpen])

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
    setIsBalanceMenuOpen(false)
    router.push("/login")
  }

  return (
    <div className="bg-[#334443]">
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 h-10 sm:h-12 flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1">
          <button
            aria-label="Open sidebar"
            onClick={onSidebarOpen}
            className="text-emerald-400 rounded p-1.5 sm:p-2 flex-shrink-0"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          {/* Logo - Hidden on small screens (sm and below), shown from md breakpoint */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="hidden md:block text-lg md:text-xl lg:text-2xl xl:text-3xl font-extrabold text-white tracking-wide flex-shrink-0"
          >
            <Logo/>
          </motion.div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
        <div className="relative" ref={balanceMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsBalanceMenuOpen((prev) => !prev)
              setIsUserMenuOpen(false)
            }}
            className="flex items-center gap-1 sm:gap-1.5 bg-[#00A66E] text-black px-1.5 sm:px-2 md:px-2.5 py-1 sm:py-1.5 rounded-full shadow-sm min-w-[70px] sm:min-w-[85px] md:min-w-[100px] lg:min-w-[120px] justify-center hover:bg-[#00b97b] transition"
          >
            <Coins className="w-3 h-3 sm:w-3.5 sm:h-4 text-[#FFD949] flex-shrink-0" />
            <div className="leading-tight text-left min-w-0">
              <div className="text-xs sm:text-sm font-medium truncate">{userInfo.balance}</div>
            </div>
            <ChevronDown
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform flex-shrink-0 ${isBalanceMenuOpen ? "rotate-180" : "rotate-0"}`}
            />
          </button>

          <AnimatePresence>
            {isBalanceMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 sm:w-52 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50"
              >
                <div className="px-3 sm:px-4 py-3 text-gray-700 space-y-1">
                  {userInfo.balance && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-500 text-sm">Main Balance</span>
                      <span className="text-sm font-semibold text-gray-900">{userInfo.balance}</span>
                    </div>
                  )}
                  {userInfo.liability && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-500 text-sm">Liability</span>
                      <span className="text-sm font-semibold text-gray-900">{userInfo.liability}</span>
                    </div>
                  )}
                  {userInfo.availableBalance && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-500 text-sm">P/L</span>
                      <span className="text-sm font-semibold text-green-600">{userInfo.availableBalance}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    refetchWallet()
                    setIsBalanceMenuOpen(false)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-[#f4f7f6] border-t border-gray-200 transition"
                  title="Refresh balance"
                >
                  <RefreshCw className="w-4 h-4 text-[#00A66E]" />
                  Refresh Balance
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                setIsUserMenuOpen((prev) => !prev)
                setIsBalanceMenuOpen(false)
              }}
              className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-[#00A66E] px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 rounded-full text-black font-semibold shadow-sm hover:bg-[#00b97b] transition min-w-0"
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[120px] md:max-w-[150px] lg:max-w-none">{userInfo.name}</span>
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
                  className="absolute right-0 mt-2 w-52 sm:w-56 md:w-64 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50"
                >
                  <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 text-[10px] sm:text-xs font-semibold text-gray-700 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1 xs:gap-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <ClockIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                      <span className="truncate">{userInfo.timezone}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] sm:text-[10px] md:text-[11px] text-gray-600">
                      <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00A66E] flex-shrink-0" />
                      <span>{userInfo.roleLabel}</span>
                    </div>
                  </div>

                  <div className="py-1 text-xs sm:text-sm text-gray-700">
                    {dropdownItems.map(({ label, href, icon: Icon }) => {
                      if (label === "Change Password") {
                        return (
                          <button
                            key={label}
                            onClick={() => {
                              setIsChangePasswordModalOpen(true)
                              setIsUserMenuOpen(false)
                            }}
                            className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-[#f4f7f6] transition text-left"
                          >
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00A66E] flex-shrink-0" />
                            <span className="text-[11px] sm:text-xs md:text-sm">{label}</span>
                          </button>
                        )
                      }
                      return (
                        <Link
                          key={label}
                          href={href}
                          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-[#f4f7f6] transition"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00A66E] flex-shrink-0" />
                          <span className="text-[11px] sm:text-xs md:text-sm">{label}</span>
                        </Link>
                      )
                    })}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 text-left text-[#8B1A3A] hover:bg-[#fce8ee] transition"
                    >
                      <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-[11px] sm:text-xs md:text-sm">Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        username={userInfo.name}
        onSubmit={handleChangePassword}
      />
    </div>
  )
}

