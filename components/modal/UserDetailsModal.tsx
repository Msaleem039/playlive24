"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/input"

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
  initialData?: {
    name?: string
    exposure?: string
    userStatus?: "Active" | "Inactive"
    fancyBetStatus?: "Active" | "Inactive"
    marketBetStatus?: "Active" | "Inactive"
    casinoBetStatus?: "Active" | "Inactive"
  }
  onSubmit: (data: {
    name: string
    exposure: string
    userStatus: "Active" | "Inactive"
    fancyBetStatus: "Active" | "Inactive"
    marketBetStatus: "Active" | "Inactive"
    casinoBetStatus: "Active" | "Inactive"
  }) => void
}

export default function UserDetailsModal({
  isOpen,
  onClose,
  username,
  initialData,
  onSubmit,
}: UserDetailsModalProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [exposure, setExposure] = useState(initialData?.exposure || "")
  const [userStatus, setUserStatus] = useState<"Active" | "Inactive">(
    initialData?.userStatus || "Active"
  )
  const [fancyBetStatus, setFancyBetStatus] = useState<"Active" | "Inactive">(
    initialData?.fancyBetStatus || "Active"
  )
  const [marketBetStatus, setMarketBetStatus] = useState<"Active" | "Inactive">(
    initialData?.marketBetStatus || "Active"
  )
  const [casinoBetStatus, setCasinoBetStatus] = useState<"Active" | "Inactive">(
    initialData?.casinoBetStatus || "Active"
  )
  const [isLoading, setIsLoading] = useState(false)

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "")
      setExposure(initialData.exposure || "")
      setUserStatus(initialData.userStatus || "Active")
      setFancyBetStatus(initialData.fancyBetStatus || "Active")
      setMarketBetStatus(initialData.marketBetStatus || "Active")
      setCasinoBetStatus(initialData.casinoBetStatus || "Active")
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!exposure.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await onSubmit({
        name: name || initialData?.name || "",
        exposure,
        userStatus,
        fancyBetStatus,
        marketBetStatus,
        casinoBetStatus,
      })
      onClose()
    } catch (error) {
      console.error("Error updating user details:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    // Reset to initial values
    if (initialData) {
      setName(initialData.name || "")
      setExposure(initialData.exposure || "")
      setUserStatus(initialData.userStatus || "Active")
      setFancyBetStatus(initialData.fancyBetStatus || "Active")
      setMarketBetStatus(initialData.marketBetStatus || "Active")
      setCasinoBetStatus(initialData.casinoBetStatus || "Active")
    }
    onClose()
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
            className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow-xl overflow-hidden"
          >
            {/* Header - Green Background */}
            <div className="bg-[#2ECC71] px-4 py-3 flex items-center justify-between">
              <h2 className="text-white font-bold text-base">User Details</h2>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-white/20"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area - White Background */}
            <form onSubmit={handleSubmit} className="bg-white">
              <div className="px-4 py-3 space-y-3">
                {/* Exposure Field - Single field at top */}
                <div className="p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Exposure
                  </label>
                  <Input
                    type="number"
                    value={exposure}
                    onChange={(e) => setExposure(e.target.value)}
                    placeholder="Exposure"
                    className="mt-1 border-gray-300 rounded-md"
                    required
                    min="0"
                  />
                </div>

                {/* Status Sections - 2x2 Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* User Status */}
                  <div className="p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      User Status
                    </label>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="userStatus"
                          value="Active"
                          checked={userStatus === "Active"}
                          onChange={() => setUserStatus("Active")}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="userStatus"
                          value="Inactive"
                          checked={userStatus === "Inactive"}
                          onChange={() => setUserStatus("Inactive")}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">Inactive</span>
                      </label>
                    </div>
                  </div>

                  {/* Market Bet Status */}
                  <div className="p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Market Bet Status
                    </label>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="marketBetStatus"
                          value="Active"
                          checked={marketBetStatus === "Active"}
                          onChange={() => setMarketBetStatus("Active")}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="marketBetStatus"
                          value="Inactive"
                          checked={marketBetStatus === "Inactive"}
                          onChange={() => setMarketBetStatus("Inactive")}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">Inactive</span>
                      </label>
                    </div>
                  </div>

                  {/* Fancy Bet Status */}
                  <div className="p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Fancy Bet Status
                    </label>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="fancyBetStatus"
                          value="Active"
                          checked={fancyBetStatus === "Active"}
                          onChange={() => setFancyBetStatus("Active")}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="fancyBetStatus"
                          value="Inactive"
                          checked={fancyBetStatus === "Inactive"}
                          onChange={() => setFancyBetStatus("Inactive")}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">Inactive</span>
                      </label>
                    </div>
                  </div>

                  {/* Casino Bet Status */}
                  <div className="p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Casino Bet Status
                    </label>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="casinoBetStatus"
                          value="Active"
                          checked={casinoBetStatus === "Active"}
                          onChange={() => setCasinoBetStatus("Active")}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="casinoBetStatus"
                          value="Inactive"
                          checked={casinoBetStatus === "Inactive"}
                          onChange={() => setCasinoBetStatus("Inactive")}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="px-4 py-3 flex justify-end border-t border-gray-100">
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#2ECC71] hover:bg-[#27AE60] text-white font-semibold text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !exposure.trim()}
                >
                  {isLoading ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


