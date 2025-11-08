"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/input"

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
  onSubmit: (data: { newPassword: string; confirmPassword: string }) => void
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  username,
  onSubmit,
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!newPassword.trim()) {
      setError("Please enter a new password")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    try {
      await onSubmit({ newPassword, confirmPassword })
      // Reset form
      setNewPassword("")
      setConfirmPassword("")
      setError(null)
      onClose()
    } catch (error) {
      console.error("Error changing password:", error)
      setError("Failed to change password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setNewPassword("")
    setConfirmPassword("")
    setError(null)
    onClose()
  }

  const fullTitle = `Change Password for ${username}`

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
          >
            {/* Header - Green Background */}
            <div className="bg-[#2ECC71] px-6 py-4 flex items-center justify-between">
              <h2 className="text-black font-bold text-lg">{fullTitle}</h2>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-white/20"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area - White Background */}
            <form onSubmit={handleSubmit} className="bg-white">
              {/* Error Message */}
              {error && (
                <div className="px-6 pt-4">
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
                    {error}
                  </div>
                </div>
              )}

              {/* New Password Field */}
              <div className="px-6 py-4 border-b border-dashed border-gray-300">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-bold text-gray-900 whitespace-nowrap min-w-[120px]">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter New Password"
                    className="flex-1 border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="px-6 py-4 border-b border-dashed border-gray-300">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-bold text-gray-900 whitespace-nowrap min-w-[120px]">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="flex-1 border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="px-6 py-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2ECC71] hover:bg-[#27AE60] text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  disabled={isLoading || !newPassword.trim() || !confirmPassword.trim()}
                >
                  {isLoading ? "Processing..." : "Submit"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


