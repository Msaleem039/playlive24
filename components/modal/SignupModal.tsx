"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { User, Phone, Lock, Eye, EyeOff, X, AlertCircle } from "lucide-react"
import { Input } from "@/components/input"
import { Button } from "@/components/utils/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRegisterMutation } from "@/app/services/Api"
import { setCredentials } from "@/app/store/slices/authSlice"
import { useDispatch } from "react-redux"
import Cookies from "js-cookie"

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin?: () => void
}

enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN", 
  AGENT = "AGENT",
  CLIENT = "CLIENT"
}

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }: SignupModalProps) {
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const dispatch = useDispatch()
  
  const [register, { isLoading }] = useRegisterMutation()

  const getDashboardPath = (role: string) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return "/super-admin"
      case UserRole.ADMIN:
        return "/admin"
      case UserRole.AGENT:
        return "/agent-dashboard"
      case UserRole.CLIENT:
        return "/dashboard"
      default:
        return "/dashboard"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      const result = await register({ 
        username, 
        phone, 
        password,
        role: UserRole.CLIENT // Default role for new registrations
      }).unwrap()
      
      // Check if we have the required data (accessToken and user)
      if (result.accessToken && result.user) {
        // Store user data and token in Redux
        dispatch(setCredentials({
          user: result.user,
          token: result.accessToken
        }))

        try {
          // Set cookies with proper attributes so they're available for middleware
          Cookies.set("token", result.accessToken, { path: '/', sameSite: 'lax' })
          Cookies.set("auth_user", JSON.stringify(result.user), { path: '/', sameSite: 'lax' })
          if (typeof window !== "undefined") {
            window.localStorage.setItem("auth_user", JSON.stringify(result.user))
          }
        } catch (storageError) {
          console.warn("Failed to store auth credentials", storageError)
        }
        
        // Redirect based on user role using Next.js router for smooth navigation
        const dashboardPath = getDashboardPath(result.user.role)
        
        // Use router.push for client-side navigation (no full page reload)
        setTimeout(() => {
          router.push(dashboardPath)
        }, 50)
      } else {
        setError("Invalid response from server")
      }
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err.data?.message || err.message || "Registration failed. Please try again.")
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
      <div className="absolute inset-0 bg-black/20 backdrop-blur-xl">
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
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 bg-[#30967c] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,102,0.5)]"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-2xl font-extrabold text-white tracking-wide"
              >
                PL7
              </motion.div>
            </motion.div>

            <h1 className="text-3xl font-extrabold text-[#30967c] mb-2">
              Create Account 
            </h1>
            <p className="text-white/60">Join PlayLive7 today</p>
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

          {/* Registration Form */}
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
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
              <Input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#30967c] hover:bg-[#2a7f6a] text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-8">
            <p className="text-white/60">
              Already have an account?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-[#30967c] hover:text-[#2a7f6a] font-semibold transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

