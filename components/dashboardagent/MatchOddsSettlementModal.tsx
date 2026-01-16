"use client"

import { useState, useEffect, useMemo } from "react"
import { X, RefreshCw, CheckCircle, Play, Activity } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
// WARNING: This modal component is currently NOT USED anywhere in the codebase.
// The MatchOddsSettlementScreen component handles all Match Odds settlements.
// If you need to use this modal, ensure it's NOT used together with MatchOddsSettlementScreen
// to avoid duplicate API calls to POST /admin/settlement/match-odds
//
// NOTE: This component ONLY uses Match Odds settlement endpoint
// Endpoint: POST /admin/settlement/match-odds
// DO NOT import or use any fancy settlement APIs here
import { useSettleMatchOddsMutation } from "@/app/services/Api"
import { toast } from "sonner"

interface MatchOddsSettlementModalProps {
  match: any
  isOpen: boolean
  onClose: () => void
  onSettle: () => void
}

export function MatchOddsSettlementModal({ match, isOpen, onClose, onSettle }: MatchOddsSettlementModalProps) {
  const [settleMatchOdds, { isLoading }] = useSettleMatchOddsMutation()
  
  // Extract marketId from first bet's settlementId (format: "matchId_marketId")
  const extractMarketId = () => {
    const bets = match?.matchOdds?.bets || []
    if (bets.length > 0 && bets[0].settlementId) {
      const parts = bets[0].settlementId.split("_")
      return parts[1] || ""
    }
    return ""
  }

  const [eventId, setEventId] = useState(match?.eventId || "")
  const [marketId, setMarketId] = useState("")
  const [winnerSelectionId, setWinnerSelectionId] = useState("")

  // Get runners from match data - ensure we get all runners
  const runners = useMemo(() => {
    // Try multiple paths to get runners data
    let matchRunners: any[] = []
    
    // First try: match.matchOdds.runners (primary source)
    if (match?.matchOdds?.runners && Array.isArray(match.matchOdds.runners)) {
      matchRunners = [...match.matchOdds.runners] // Create a copy
    } 
    // Second try: match.runners (fallback)
    else if (match?.runners && Array.isArray(match.runners)) {
      matchRunners = [...match.runners] // Create a copy
    }
    
    // Debug: Log to see what we're getting
    if (isOpen) {
      console.log('[MatchOddsSettlementModal] ===== RUNNERS DEBUG START =====')
      console.log('[MatchOddsSettlementModal] Full match object:', JSON.parse(JSON.stringify(match)))
      console.log('[MatchOddsSettlementModal] match.matchOdds:', match?.matchOdds)
      console.log('[MatchOddsSettlementModal] match.matchOdds?.runners:', match?.matchOdds?.runners)
      console.log('[MatchOddsSettlementModal] match.matchOdds?.runners type:', typeof match?.matchOdds?.runners)
      console.log('[MatchOddsSettlementModal] match.matchOdds?.runners isArray:', Array.isArray(match?.matchOdds?.runners))
      console.log('[MatchOddsSettlementModal] Raw matchRunners length:', matchRunners.length)
      console.log('[MatchOddsSettlementModal] Raw matchRunners:', JSON.parse(JSON.stringify(matchRunners)))
      matchRunners.forEach((r, i) => {
        console.log(`[MatchOddsSettlementModal] Runner ${i}:`, {
          raw: r,
          selectionId: r?.selectionId,
          selectionIdType: typeof r?.selectionId,
          name: r?.name,
          runnerName: r?.runnerName,
          keys: r ? Object.keys(r) : 'null'
        })
      })
    }
    
    // Return all valid runners - be very permissive with validation
    // Only filter out truly invalid entries (null, undefined, or missing selectionId entirely)
    const validRunners = matchRunners.filter((runner: any, index: number) => {
      // Very permissive check: just ensure runner exists and has some form of selectionId
      const hasSelectionId = runner != null && 
                            runner !== undefined &&
                            (runner.selectionId !== null && runner.selectionId !== undefined)
      
      if (!hasSelectionId && isOpen) {
        console.warn(`[MatchOddsSettlementModal] ❌ Invalid runner filtered out at index ${index}:`, {
          runner,
          selectionId: runner?.selectionId,
          selectionIdType: typeof runner?.selectionId,
          isNull: runner?.selectionId === null,
          isUndefined: runner?.selectionId === undefined
        })
      }
      if (isOpen && hasSelectionId) {
        console.log(`[MatchOddsSettlementModal] ✅ Valid runner at index ${index}:`, {
          selectionId: runner.selectionId,
          selectionIdType: typeof runner.selectionId,
          name: runner.name || runner.runnerName || 'No name',
          fullRunner: runner
        })
      }
      return hasSelectionId
    })
    
    // Deduplicate by selectionId (keep first occurrence)
    // Convert all selectionIds to strings for consistent comparison
    const seenSelectionIds = new Set<string>()
    const uniqueRunners = validRunners.filter((runner: any) => {
      const selectionId = String(runner.selectionId)
      if (seenSelectionIds.has(selectionId)) {
        if (isOpen) {
          console.warn(`[MatchOddsSettlementModal] 🔄 Duplicate runner filtered out (selectionId: ${selectionId}):`, runner)
        }
        return false
      }
      seenSelectionIds.add(selectionId)
      return true
    })
    
    if (isOpen) {
      console.log('[MatchOddsSettlementModal] Valid runners count (before dedup):', validRunners.length)
      console.log('[MatchOddsSettlementModal] Unique runners count (after dedup):', uniqueRunners.length)
      console.log('[MatchOddsSettlementModal] Final unique runners:', uniqueRunners.map((r, i) => 
        `${i + 1}. ${r.name || r.runnerName || 'Unknown'} (ID: ${r.selectionId})`
      ))
      console.log('[MatchOddsSettlementModal] ===== RUNNERS DEBUG END =====')
    }
    
    return uniqueRunners
  }, [match?.matchOdds?.runners, match?.runners, match, isOpen])

  useEffect(() => {
    if (isOpen && match) {
      setEventId(match.eventId || "")
      setMarketId(extractMarketId())
      // Set default to first runner's selectionId if available
      if (runners.length > 0 && runners[0].selectionId) {
        setWinnerSelectionId(String(runners[0].selectionId))
      } else {
        setWinnerSelectionId("")
      }
    }
  }, [isOpen, match, runners])

  const handleSettle = async () => {
    if (!eventId.trim() || !marketId.trim() || !winnerSelectionId.trim()) {
      toast.error("Event ID, Market ID, and Winner Selection are required")
      return
    }
    
    const betCount = match?.matchOdds?.count || 0
    const totalAmount = match?.matchOdds?.totalAmount || 0
    const confirmMessage = `This will settle ALL ${betCount} Match Odds bet(s) for this market (Total: Rs${totalAmount.toLocaleString()}).\n\nFancy and Bookmaker bets will NOT be affected.\n\nContinue?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const payload = {
        eventId: eventId.trim(),
        marketId: marketId.trim(),
        winnerSelectionId: winnerSelectionId.trim()
      }
      
      // WARNING: This calls POST /admin/settlement/match-odds
      // Ensure this modal is NOT used together with MatchOddsSettlementScreen
      // to avoid duplicate API calls for the same settlement
      await settleMatchOdds(payload).unwrap()
      toast.success(`Match odds bets settled successfully. ${betCount} bet(s) processed.`)
      onSettle()
      onClose()
    } catch (error: any) {
      console.error('[Match Odds Settlement] Error:', error)
      toast.error(error?.data?.error || error?.data?.message || "Failed to settle match odds")
    }
  }

  const marketData = match?.matchOdds

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Settle Match Odds</h2>
              <p className="text-sm text-white/80">{match?.matchTitle || `${match?.homeTeam || ""} vs ${match?.awayTeam || ""}` || "Match"}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Market Information */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-200">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#00A66E]" />
              Market Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Bets Count:</span>
                <span className="ml-2 font-semibold">{marketData?.count || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Amount:</span>
                <span className="ml-2 font-semibold text-green-600">Rs{marketData?.totalAmount?.toLocaleString() || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Match ID:</span>
                <span className="ml-2 font-mono text-xs">{match?.matchId || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-600">Event ID:</span>
                <span className="ml-2 font-mono text-xs">{match?.eventId || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Settlement Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="font-semibold text-lg mb-4">Settlement Details</h3>
{/*             
            {selectedBet && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ <strong>Important:</strong> This will attempt to settle bet ID <strong>{selectedBet.id}</strong>. 
                  If the backend doesn't support single bet settlement, <strong>ALL match odds bets in this market will be settled</strong>.
                </p>
              </div>
            )} */}
            
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
                  Market ID <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={marketId}
                  onChange={(e) => setMarketId(e.target.value)}
                  placeholder="Enter market ID"
                  className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Winner Selection <span className="text-red-500">*</span>
                  {runners && runners.length > 0 && (
                    <span className="ml-2 text-xs text-gray-500 font-normal">({runners.length} options available)</span>
                  )}
                </label>
                {runners && runners.length > 0 ? (
                  <div className="relative">
                    <select
                      value={winnerSelectionId}
                      onChange={(e) => setWinnerSelectionId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A66E] focus:border-[#00A66E] bg-white text-sm text-gray-900 appearance-none cursor-pointer"
                      required
                      style={{ 
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="" disabled>-- Select winner --</option>
                      {runners.map((runner: any, index: number) => {
                        if (!runner || !runner.selectionId) {
                          console.warn(`[MatchOddsSettlementModal] Skipping invalid runner at index ${index}:`, runner)
                          return null
                        }
                        const displayName = runner.name || runner.runnerName || `Selection ${runner.selectionId}`
                        const selectionId = String(runner.selectionId)
                        console.log(`[MatchOddsSettlementModal] Rendering option ${index + 1}:`, { displayName, selectionId })
                        return (
                          <option 
                            key={`runner-opt-${runner.selectionId}-${index}`} 
                            value={selectionId}
                          >
                            {displayName} (ID: {runner.selectionId})
                          </option>
                        )
                      })}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {runners.length} runner{runners.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                ) : (
                  <div>
                    <Input
                      type="text"
                      value={winnerSelectionId}
                      onChange={(e) => setWinnerSelectionId(e.target.value)}
                      placeholder="Enter winner selection ID"
                      className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">No runners available. Please enter selection ID manually.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center gap-3">
          <Button
            onClick={onClose}
            className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2.5 rounded-lg"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSettle}
            disabled={isLoading || !eventId.trim() || !marketId.trim() || !winnerSelectionId.trim()}
            className="px-6 py-2.5 rounded-lg text-white font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin inline" />
                Settling...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2 inline" />
                Settle All Bets
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

