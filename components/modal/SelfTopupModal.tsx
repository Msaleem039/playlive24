"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { Input } from "@/components/input"

interface SelfTopupModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: { amount: number; remarks: string }) => Promise<void>
  isSubmitting?: boolean
}

export default function SelfTopupModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: SelfTopupModalProps) {
  const [amount, setAmount] = useState("")
  const [remarks, setRemarks] = useState("")
  const [error, setError] = useState<string | null>(null)

  const resetState = () => {
    setAmount("")
    setRemarks("")
    setError(null)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!amount.trim()) {
      setError("Please enter an amount")
      return
    }

    const parsedAmount = parseFloat(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than zero")
      return
    }

    try {
      await onSubmit({
        amount: parsedAmount,
        remarks: remarks.trim(),
      })
      resetState()
    } catch {
      // parent handles toast/error display, but keep message for UX
      setError("Unable to process request. Please try again.")
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <div className="bg-[#006C4E] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white text-sm uppercase tracking-wide">Super Admin</p>
                <h2 className="text-white font-bold text-lg">Self Top Up</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-white">
              {error && (
                <div className="px-6 pt-4">
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
                    {error}
                  </div>
                </div>
              )}

              <div className="px-6 py-4 border-b border-dashed border-gray-200">
                <label className="text-sm font-semibold text-gray-800 mb-2 block">Amount</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full"
                  disabled={isSubmitting}
                />
              </div>

              <div className="px-6 py-4 border-b border-dashed border-gray-200">
                <label className="text-sm font-semibold text-gray-800 mb-2 block">Remarks (optional)</label>
                <Input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add a note"
                  className="w-full"
                  disabled={isSubmitting}
                />
              </div>

              <div className="px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 rounded-md bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-[#00A66E] text-white font-semibold hover:bg-[#008a5a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Confirm"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

