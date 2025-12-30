"use client"

import { useState, useEffect } from "react"
import { X, RefreshCw, CheckCircle, Target, Activity } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
import { useSettleFancyMutation } from "@/app/services/Api"
import { toast } from "sonner"

interface FancySettlementModalProps {
  match: any
  isOpen: boolean
  onClose: () => void
  onSettle: () => void
}

export function FancySettlementModal({ match, isOpen, onClose, onSettle }: FancySettlementModalProps) {
  const [settleFancy, { isLoading }] = useSettleFancyMutation()
  
  const selectedBet = match?.selectedBet
  const settlementId = selectedBet?.settlementId || ""
  
  // Extract selectionId from settlementId (format: "matchId_selectionId")
  const extractIdsFromSettlementId = (settlementId: string) => {
    if (!settlementId || !settlementId.includes("_")) return { selectionId: "" }
    const parts = settlementId.split("_")
    return {
      selectionId: parts[1] || ""
    }
  }

  const [eventId, setEventId] = useState(match?.eventId || "")
  const [selectionId, setSelectionId] = useState("")
  const [decisionRun, setDecisionRun] = useState("")
  const [isCancel, setIsCancel] = useState(false)
  const [marketId, setMarketId] = useState("")

  useEffect(() => {
    if (isOpen && match) {
      const bet = match?.selectedBet
      const settlementId = bet?.settlementId || ""
      const extracted = extractIdsFromSettlementId(settlementId)
      
      setEventId(match.eventId || "")
      setSelectionId(bet ? extracted.selectionId : "")
      setDecisionRun("")
      setIsCancel(false)
      setMarketId("")
    }
  }, [isOpen, match])

  const handleSettle = async () => {
    if (!eventId.trim() || !selectionId.trim()) {
      toast.error("Event ID and Selection ID are required")
      return
    }
    if (!isCancel && !decisionRun.trim()) {
      toast.error("Decision Run is required when not cancelling")
      return
    }

    try {
      await settleFancy({
        eventId: eventId.trim(),
        selectionId: selectionId.trim(),
        decisionRun: isCancel ? undefined : Number(decisionRun),
        isCancel,
        marketId: marketId.trim() || undefined
      }).unwrap()
      toast.success(isCancel ? "Fancy bets cancelled successfully" : "Fancy bets settled successfully")
      onSettle()
      onClose()
    } catch (error: any) {
      toast.error(error?.data?.error || error?.data?.message || "Failed to settle fancy bets")
    }
  }

  const marketData = match?.fancy

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Settle Fancy {match?.selectedBet ? "Bet" : "Bets"}
              </h2>
              <p className="text-sm text-white/80">{match?.matchTitle || match?.homeTeam || "Match"}</p>
              {match?.selectedBet && (
                <p className="text-xs text-white/60 mt-1">Bet ID: {match.selectedBet.id}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Bet/Market Information */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-200">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#00A66E]" />
              {match?.selectedBet ? "Bet Information" : "Market Information"}
            </h3>
            {match?.selectedBet ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Bet ID:</span>
                  <span className="ml-2 font-mono font-semibold">{match.selectedBet.id || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <span className="ml-2 font-semibold text-green-600">Rs{match.selectedBet.amount?.toLocaleString() || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Odds:</span>
                  <span className="ml-2 font-semibold">{match.selectedBet.odds || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Bet Type:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    match.selectedBet.betType === "BACK" ? "bg-green-100 text-green-800" :
                    match.selectedBet.betType === "LAY" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {match.selectedBet.betType || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Bet Name:</span>
                  <span className="ml-2 font-semibold">{match.selectedBet.betName || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Settlement ID:</span>
                  <span className="ml-2 font-mono text-xs">{match.selectedBet.settlementId || "N/A"}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Bets Count:</span>
                  <span className="ml-2 font-semibold">{marketData?.count || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="ml-2 font-semibold text-green-600">Rs{marketData?.totalAmount?.toLocaleString() || 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* Settlement Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="font-semibold text-lg mb-4">Settlement Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event ID <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  placeholder="Enter event ID"
                  className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selection ID <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={selectionId}
                  onChange={(e) => setSelectionId(e.target.value)}
                  placeholder="Enter selection ID"
                  className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Market ID <span className="text-gray-500">(Optional)</span>
                </label>
                <Input
                  type="text"
                  value={marketId}
                  onChange={(e) => setMarketId(e.target.value)}
                  placeholder="Enter market ID"
                  className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <input
                  type="checkbox"
                  id="isCancel"
                  checked={isCancel}
                  onChange={(e) => setIsCancel(e.target.checked)}
                  className="w-4 h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
                />
                <label htmlFor="isCancel" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Cancel/Refund all bets
                </label>
              </div>

              {!isCancel && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decision Run <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={decisionRun}
                    onChange={(e) => setDecisionRun(e.target.value)}
                    placeholder="Enter winning run value"
                    className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                    required={!isCancel}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    BACK wins if decisionRun &gt; betValue, LAY wins if decisionRun ≤ betValue
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2.5 rounded-lg"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSettle}
            disabled={isLoading || !eventId.trim() || !selectionId.trim() || (!isCancel && !decisionRun.trim())}
            className="px-6 py-2.5 rounded-lg text-white font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin inline" />
                Settling...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2 inline" />
                {isCancel ? "Cancel Bets" : "Settle Bets"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

