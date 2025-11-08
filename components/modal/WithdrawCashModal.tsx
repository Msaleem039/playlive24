"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/input"
import { useTopDownBalanceMutation } from "@/app/services/Api"
import { useDispatch, useSelector } from "react-redux"
import { api } from "@/app/services/Api"
import { setCredentials, selectCurrentToken, selectCurrentUser } from "@/app/store/slices/authSlice"
import { toast } from "sonner"
import Cookies from "js-cookie"

interface WithdrawCashModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
  userId?: string
  onSubmit?: (data: { amount: string; remarks: string }) => void
}

export default function WithdrawCashModal({
  isOpen,
  onClose,
  username,
  userId,
  onSubmit,
}: WithdrawCashModalProps) {
  const [amount, setAmount] = useState("")
  const [remarks, setRemarks] = useState("")
  const [error, setError] = useState<string | null>(null)
  const dispatch = useDispatch()
  const token = useSelector(selectCurrentToken)
  const authUser = useSelector(selectCurrentUser)
  const [topDownBalance, { isLoading }] = useTopDownBalanceMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!amount.trim()) {
      setError("Please enter an amount")
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (!userId) {
      setError("User ID is required")
      return
    }

    try {
      console.log("Withdraw API call - userId:", userId, "amount:", amountNum, "remarks:", remarks)
      
      // Call the API with the payload including userId
      const result = await topDownBalance({
        userId: userId!,
        balance: amountNum,
        remarks: remarks || "",
      }).unwrap()

      console.log("Withdraw API success:", result)

      // 🔥 Update current user's balance instantly (optimistic update)
      // When withdrawing from a child, parent's balance increases
      if (authUser) {
        const currentBalance = authUser.balance ?? authUser.walletBalance ?? authUser.availableBalance ?? authUser.available_balance ?? authUser.chips ?? 0
        const newBalance = currentBalance + amountNum
        
        const updatedUser = {
          ...authUser,
          balance: newBalance,
          // Also update other possible balance fields
          walletBalance: newBalance,
          availableBalance: newBalance,
          available_balance: newBalance,
        }

        // Update Redux state immediately
        dispatch(setCredentials({
          user: updatedUser,
          token: token || Cookies.get("token") || ""
        }))
        
        // Update cookies and localStorage
        try {
          Cookies.set("auth_user", JSON.stringify(updatedUser), { path: '/', sameSite: 'lax' })
          if (typeof window !== "undefined") {
            window.localStorage.setItem("auth_user", JSON.stringify(updatedUser))
          }
          console.log("Updated parent balance from", currentBalance, "to", newBalance)
        } catch (storageError) {
          console.warn("Failed to update stored auth", storageError)
        }
      }

      // Check if result contains updated user data (parent account) - use API response if available
      const updatedUserFromApi = result?.user || result?.parentUser || result?.parent || result?.updatedUser
      if (updatedUserFromApi) {
        // API response has updated user data, use it instead (more accurate)
        dispatch(setCredentials({
          user: updatedUserFromApi,
          token: token || Cookies.get("token") || ""
        }))
        
        try {
          Cookies.set("auth_user", JSON.stringify(updatedUserFromApi), { path: '/', sameSite: 'lax' })
          if (typeof window !== "undefined") {
            window.localStorage.setItem("auth_user", JSON.stringify(updatedUserFromApi))
          }
          console.log("Updated parent balance from API response:", updatedUserFromApi.balance)
        } catch (storageError) {
          console.warn("Failed to update stored auth", storageError)
        }
      }

      // Invalidate user query cache to refresh user list
      dispatch(api.util.invalidateTags(['User']))

      // Show success toast
      toast.success(`Successfully withdrew ${amountNum.toFixed(2)} from ${username}`, {
        description: remarks || "Withdrawal completed successfully"
      })

      // Call the optional onSubmit callback if provided
      if (onSubmit) {
        await onSubmit({ amount, remarks })
      }

      // Reset form
      setAmount("")
      setRemarks("")
      setError(null)
      onClose()
    } catch (error: any) {
      console.error("Error submitting withdraw:", error)
      console.error("Error details:", {
        status: error?.status,
        data: error?.data,
        message: error?.message,
        error: error?.error,
      })
      
      // Better error message extraction
      const errorMessage = 
        error?.data?.message || 
        error?.data?.error || 
        error?.error?.data?.message ||
        error?.message || 
        "Failed to withdraw cash. Please try again."
      
      setError(errorMessage)
      
      // Show error toast
      toast.error("Withdrawal Failed", {
        description: errorMessage
      })
    }
  }

  const handleClose = () => {
    setAmount("")
    setRemarks("")
    onClose()
  }

  const fullTitle = `Withdraw Cash - ${username}`

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
              <h2 className="text-white font-bold text-lg">{fullTitle}</h2>
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

              {/* Amount Field */}
              <div className="px-6 py-4 border-b border-dashed border-gray-300">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-bold text-gray-900 whitespace-nowrap min-w-[80px]">
                    Amount
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount"
                    className="flex-1 border-gray-300 rounded-md"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Remarks Field */}
              <div className="px-6 py-4 border-b border-dashed border-gray-300">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-bold text-gray-900 whitespace-nowrap min-w-[80px]">
                    Remarks
                  </label>
                  <Input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Remarks"
                    className="flex-1 border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 bg-[#E74C3C] hover:bg-[#C0392B] text-white font-semibold rounded-md transition-colors"
                  disabled={isLoading}
                >
                  No
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2ECC71] hover:bg-[#27AE60] text-white font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !amount.trim() || !userId}
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

