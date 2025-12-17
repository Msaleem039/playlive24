"use client"

import { useState, useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { SettlementAdminPanel } from "@/components/dashboardagent/SettlementAdminPanel"
import { setCredentials, selectCurrentUser, logout as logoutThunk } from "@/app/store/slices/authSlice"
import Loader from "@/components/utils/Loader"
import { 
  Menu, 
  User, 
  ChevronDown, 
  LogOut, 
  Lock,
  Shield,
  Coins
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import Logo from "@/components/utils/Logo"
import { useChangePasswordMutation } from "@/app/services/Api"
import ChangePasswordModal from "@/components/modal/ChangePasswordModal"
import { toast } from "sonner"

export default function SettlementAdminLayout() {
  const dispatch = useDispatch()
  const router = useRouter()
  const authUser = useSelector(selectCurrentUser)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [changePassword] = useChangePasswordMutation()

  useEffect(() => {
    // On mount, try to rehydrate auth state from cookie
    const token = Cookies.get("token")
    const userJson = Cookies.get("auth_user")
    
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

  // Prevent body scrolling when dashboard is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

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

  const formatMoney = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const userInfo = authUser ? {
    name: authUser?.username ?? authUser?.name ?? authUser?.email ?? "User",
    balance: formatMoney(authUser?.balance ?? authUser?.walletBalance ?? authUser?.availableBalance ?? 0),
    role: (authUser?.role as string) ?? "SETTLEMENT_ADMIN",
    roleLabel: ((authUser?.role as string) ?? "SETTLEMENT_ADMIN").replace(/_/g, " ").toLowerCase().replace(/(^|\s)\S/g, (t) => t.toUpperCase()),
  } : {
    name: "User",
    balance: formatMoney(0),
    role: "SETTLEMENT_ADMIN",
    roleLabel: "Settlement Admin",
  }

  const handleChangePassword = async (data: {
    currentPassword: string
    newPassword: string
  }) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
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

    ;(dispatch as any)(logoutThunk())
    setIsUserMenuOpen(false)
    router.push("/login")
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Simple Header - Fixed position, no navigation */}
      <div className="fixed top-0 left-0 right-0 z-30 flex-shrink-0 bg-gray-100">
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
              {/* Logo */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="hidden sm:block text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-wide flex-shrink-0"
              >
                <Logo/>
              </motion.div>
            </div>
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
              <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 bg-[#00A66E] text-black px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-0.5 xs:py-1 sm:py-1.5 rounded-full shadow-sm min-w-[75px] xs:min-w-[85px] sm:min-w-[100px] md:min-w-[120px] justify-center">
                <Coins className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-3.5 sm:h-4 text-[#FFD949] flex-shrink-0" />
                <div className="leading-tight text-left min-w-0">
                  <div className="text-[10px] xs:text-xs sm:text-sm font-medium truncate">{userInfo.balance}</div>
                </div>
              </div>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 bg-[#00A66E] px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 sm:py-1.5 rounded-full text-black font-semibold shadow-sm hover:bg-[#00b97b] transition text-[10px] xs:text-xs sm:text-sm min-w-0"
                >
                  <User className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate max-w-[60px] xs:max-w-[70px] sm:max-w-[90px] md:max-w-none">{userInfo.name}</span>
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
                      className="absolute right-0 mt-2 w-52 xs:w-56 sm:w-64 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-[60]"
                    >
                      <div className="px-3 xs:px-4 py-2 xs:py-3 bg-gray-100 text-[10px] xs:text-xs font-semibold text-gray-700 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1 xs:gap-0">
                        <div className="flex items-center gap-1.5 xs:gap-2">
                          <Shield className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-[#00A66E] flex-shrink-0" />
                          <span>{userInfo.roleLabel}</span>
                        </div>
                      </div>

                      <div className="py-1 text-xs xs:text-sm text-gray-700">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsChangePasswordModalOpen(true)
                            setIsUserMenuOpen(false)
                          }}
                          className="w-full flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-1.5 xs:py-2 text-left text-gray-700 hover:bg-[#f4f7f6] transition"
                        >
                          <Lock className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-[#00A66E] flex-shrink-0" />
                          <span className="text-[11px] xs:text-xs sm:text-sm">Change Password</span>
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
          <div className="animate-marquee text-[0.6rem] xs:text-[0.65rem] sm:text-[0.70rem] md:text-[0.75rem] text-white font-medium whitespace-nowrap">
            Welcome to Playlive7! If you have any queries, contact us +923216258560
          </div>
        </div>
      </div>

      {/* Spacer to push content below fixed header */}
      <div className="h-[50px] sm:h-[60px] flex-shrink-0" />

      {/* Main Content - Scrollable area */}
      <main ref={mainRef} className="flex-1 relative z-10 p-0 pt-0 overflow-x-hidden overflow-y-auto">
        <SettlementAdminPanel />
      </main>

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedTab="Home"
        onSelectTab={(tab) => {
          console.log('Sidebar tab selected:', tab)
        }}
      />

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
