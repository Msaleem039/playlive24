"use client"

import { useState } from "react"
import { X, Eye, EyeOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/input"

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
  onSubmit: (data: { password: string; confirmPassword: string }) => Promise<void> | void
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  username,
  onSubmit,
}: ChangePasswordModalProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match")
      return
    }

    setIsLoading(true)
    try {
      await onSubmit({ password, confirmPassword })
      setPassword("")
      setConfirmPassword("")
      onClose()
    } catch {
      setError("Failed to change password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setPassword("")
    setConfirmPassword("")
    setError(null)
    onClose()
  }

  const fullTitle = `Change Password for ${username}`

  if (!isOpen) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#2ECC71] px-6 py-4 flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">{fullTitle}</h2>
            <button 
              onClick={handleClose} 
              className="text-white/90 hover:text-white p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="px-6 pt-4">
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
                    {error}
                  </div>
                </div>
              )}

              {/* New Password */}
              <div className="px-6 py-4 border-b border-dashed border-gray-300">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-bold min-w-[140px] text-gray-900">New Password</label>

                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter New Password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="px-6 py-4 border-b border-dashed border-gray-300">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-bold min-w-[140px] text-gray-900">Confirm Password</label>

                  <div className="relative flex-1">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="px-6 py-4">
                <button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword}
                  className="w-full px-6 py-2 bg-[#2ECC71] hover:bg-[#27AE60] text-white font-semibold rounded-md disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : "Submit"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
    </AnimatePresence>
  )
}
