"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { User, Lock, Eye, EyeOff, X, AlertCircle } from "lucide-react"
import { Input } from "@/components/input"
import { Button } from "@/components/utils/button"
import { useRouter } from "next/navigation"
import { useLoginMutation } from "@/app/services/Api"
import { setCredentials } from "@/app/store/slices/authSlice"
import { useDispatch } from "react-redux"
import Cookies from "js-cookie"
import { SpinnerCircular } from "spinners-react"
import { toast } from "sonner"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignup?: () => void
}

enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN", 
  AGENT = "AGENT",
  CLIENT = "CLIENT",
  SETTLEMENT_ADMIN = "SETTLEMENT_ADMIN"
}

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }: LoginModalProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const dispatch = useDispatch()
  
  const [login, { isLoading }] = useLoginMutation()

  const resolveRole = (role: unknown) => {
    if (!role) return undefined
    if (typeof role === "string") return role
    if (typeof role === "object") {
      const roleObj = role as Record<string, unknown>
      return (
        (typeof roleObj.role === "string" && roleObj.role) ||
        (typeof roleObj.name === "string" && roleObj.name) ||
        (typeof roleObj.roleName === "string" && roleObj.roleName) ||
        (typeof roleObj.role_name === "string" && roleObj.role_name) ||
        (typeof roleObj.slug === "string" && roleObj.slug)
      )
    }
    return undefined
  }

  const getDashboardPath = (rawRole: unknown) => {
    const resolvedRole = resolveRole(rawRole)
    const normalizedRole = resolvedRole
      ? resolvedRole.toUpperCase().replace(/[-\s]+/g, "_")
      : undefined

    switch (normalizedRole) {
      case UserRole.SUPER_ADMIN:
        return "/super-admin"
      case UserRole.ADMIN:
        return "/admin"
      case UserRole.AGENT:
        return "/agent-dashboard"
      case UserRole.CLIENT:
        return "/dashboard"
      case UserRole.SETTLEMENT_ADMIN:
        return "/adminpanel/settlement-admin"
      default:
        return "/dashboard"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      // console.log("Attempting login with:", { username, passwordProvided: Boolean(password) })
      const result = await login({ username, password }).unwrap()
      // console.log("Login API response:", result)
      
      // Check if we have the required data (accessToken and user)
      if (result.accessToken && result.user) {
        // console.log("Login successful, storing credentials and redirecting...")
        // console.log("User data from API:", result.user)
        // console.log("Balance from API:", result.user.balance)
        
        // Store user data and token in Redux FIRST
        dispatch(setCredentials({
          user: result.user,
          token: result.accessToken
        }))

        try {
          // Set cookies with proper attributes so they're available for middleware
          // IMPORTANT: Always update cookies with fresh data from API
          Cookies.set("token", result.accessToken, { path: '/', sameSite: 'lax' })
          Cookies.set("auth_user", JSON.stringify(result.user), { path: '/', sameSite: 'lax' })
          if (typeof window !== "undefined") {
            window.localStorage.setItem("auth_user", JSON.stringify(result.user))
            // Store email in sessionStorage for periodic refresh (cleared on browser close)
            if (result.user?.username) {
              sessionStorage.setItem("user_name", result.user.username)
            }
            // console.log("Stored user in localStorage:", JSON.parse(window.localStorage.getItem("auth_user") || "{}"))
          }
          // console.log("Stored user in cookie:", JSON.parse(Cookies.get("auth_user") || "{}"))
        } catch (storageError) {
          console.warn("Failed to store auth credentials", storageError)
        }
        
        // Show success toast
        toast.success("Login Successful", {
          description: `Welcome back, ${result.user?.username || result.user?.email || 'User'}!`
        })
        
        // Redirect based on user role using Next.js router for smooth navigation
        const resolvedRole = resolveRole(result.user.role)
        const normalizedRole = typeof resolvedRole === 'string'
          ? resolvedRole.toUpperCase().replace(/[-\s]+/g, "_")
          : undefined
        
        let redirectPath = "/dashboard"
        
        // Direct role-based redirects
        if (normalizedRole === UserRole.SUPER_ADMIN) {
          redirectPath = "/super-admin/select"
        } else if (normalizedRole === UserRole.SETTLEMENT_ADMIN) {
          redirectPath = "/adminpanel/settlement-admin"
        } else {
          redirectPath = getDashboardPath(result.user.role)
        }
        
        console.log("Redirecting to:", redirectPath)
        
        // Use router.push for client-side navigation (no full page reload)
        // Small delay ensures cookies are set before navigation
        setTimeout(() => {
          router.push(redirectPath)
        }, 50)
      } else {
        console.error("Invalid response structure:", result)
        setError("Invalid response from server")
      }
    } catch (err: any) {
      console.error("Login error details:", err)
      console.error("Error data:", err.data)
      console.error("Error message:", err.message)
      
      // Check if the error actually contains successful data
      if (err.data && err.data.accessToken && err.data.user) {
        console.log("Error contains valid data, proceeding with login...")
        
        // Store user data and token in Redux
        dispatch(setCredentials({
          user: err.data.user,
          token: err.data.accessToken
        }))

        try {
          // Set cookies with proper attributes so they're available for middleware
          Cookies.set("token", err.data.accessToken, { path: '/', sameSite: 'lax' })
          Cookies.set("auth_user", JSON.stringify(err.data.user), { path: '/', sameSite: 'lax' })
          if (typeof window !== "undefined") {
            window.localStorage.setItem("auth_user", JSON.stringify(err.data.user))
          }
        } catch (storageError) {
          console.warn("Failed to store auth credentials", storageError)
        }
        
        // Show success toast
        toast.success("Login Successful", {
          description: `Welcome back, ${err.data.user?.username || err.data.user?.email || 'User'}!`
        })
        
        // Redirect based on user role using Next.js router for smooth navigation
        const resolvedRole = resolveRole(err.data.user.role)
        const normalizedRole = typeof resolvedRole === 'string'
          ? resolvedRole.toUpperCase().replace(/[-\s]+/g, "_")
          : undefined
        
        let redirectPath = "/dashboard"
        
        // For SUPER_ADMIN, redirect to selection page
        if (normalizedRole === UserRole.SUPER_ADMIN) {
          redirectPath = "/super-admin/select"
        } else {
          redirectPath = getDashboardPath(err.data.user.role)
        }
        
        // Use router.push for client-side navigation (no full page reload)
        setTimeout(() => {
          router.push(redirectPath)
          router.refresh() // Force Next.js to revalidate and read cookies
        }, 50)
      } else {
        const errorMsg = err.data?.message || err.message || "Login failed. Please try again."
        setError(errorMsg)
        toast.error("Login Failed", {
          description: errorMsg
        })
      }
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Enhanced Blurred Background */}
      <div className="absolute inset-0  backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-[#0f0f0f]/20 to-[#111]/20" />
        
        {/* Animated Pattern Background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2330967c%22%20fill-opacity%3D%220.08%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
      </div>

      {/* Modal Content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Transparent Glassmorphic Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-[0_0_30px_rgba(0,255,102,0.15)] relative"
        >
          {/* Cross Button with Blink Animation */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
            animate={{ 
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-6 h-6" />
          </motion.button>

          {/* Logo Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-4xl font-black uppercase tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-[#41D2FF] via-[#7FEAFF] to-[#FFD836] drop-shadow-[0_0_25px_rgba(126,234,255,0.35)]"
            >
              PlayLive7
            </motion.h1>
            <p className="mt-4 text-white/70 text-sm tracking-[0.35em] uppercase">
              Login Portal
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-12 h-14 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/15 focus:border-[#30967c]/50 transition-all duration-300"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 h-14 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/15 focus:border-[#30967c]/50 transition-all duration-300"
                required
              />
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </motion.button>
            </div>

            {/* Submit Button */}
            {isLoading ? (
              <div className="flex justify-center items-center h-14">
                <SpinnerCircular
                  size={40}
                  color="#30967c"
                  secondaryColor="#FFD949"
                />
              </div>
            ) : (
              <Button
                type="submit"
                className="w-full h-14 bg-[#30967c] hover:bg-[#2a7f6a] text-white font-semibold rounded-xl transition-all duration-300"
              >
                Sign In
              </Button>
            )}
          </form>

          {/* Sign Up Link */}
          {/* <div className="text-center mt-8">
            <p className="text-white/60">
              Don't have an account?{" "}
              <button
                onClick={onSwitchToSignup}
                className="text-[#30967c] hover:text-[#2a7f6a] font-semibold transition-colors"
              >
                Sign up
              </button>
            </p>
          </div> */}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

