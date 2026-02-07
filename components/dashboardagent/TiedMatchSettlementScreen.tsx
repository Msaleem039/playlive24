"use client"

import { useState, useEffect, useMemo } from "react"
import { RefreshCw, Link2, Search, ChevronLeft, Zap, CheckCircle } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
// NOTE: This component ONLY uses Tied Match settlement endpoints
// Endpoints: 
//   - GET /admin/settlement/pending/tied-match (for pending markets)
//   - POST /admin/settlement/tied-match (for settlement)
//   - POST /admin/settlement/cancel-bets (for cancellation)
import { useGetPendingTiedMatchMarketsQuery, useSettleTiedMatchMutation, useCancelBetsMutation } from "@/app/services/Api"
import { toast } from "sonner"

export function TiedMatchSettlementScreen() {
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Settlement form state
  const [eventId, setEventId] = useState("")
  const [marketId, setMarketId] = useState("")
  const [winnerSelectionId, setWinnerSelectionId] = useState("")
  const [isCancel, setIsCancel] = useState(false)
  
  const [settleTiedMatch, { isLoading: isSettling }] = useSettleTiedMatchMutation()
  const [cancelBets, { isLoading: isCancelling }] = useCancelBetsMutation()

  const { data: pendingData, isLoading, refetch } = useGetPendingTiedMatchMarketsQuery({}, { 
    pollingInterval: 30000
  })

  const matches = useMemo(() => {
    if (!pendingData) return []
    const response = pendingData as any
    // Handle the tied match endpoint response structure
    // Response format: { success: true, marketType: "tied-match", data: [...], totalMatches: number, totalPendingBets: number }
    const data = response.data && Array.isArray(response.data) ? response.data : []
    return data
  }, [pendingData])

  const filteredMatches = useMemo(() => {
    return matches.filter((match: any) => {
      const matchTitle = match.matchTitle || ""
      const homeTeam = match.homeTeam || ""
      const awayTeam = match.awayTeam || ""
      const eventId = match.eventId || ""
      const searchLower = searchTerm.toLowerCase()
      
      return (
        matchTitle.toLowerCase().includes(searchLower) ||
        homeTeam.toLowerCase().includes(searchLower) ||
        awayTeam.toLowerCase().includes(searchLower) ||
        eventId.toLowerCase().includes(searchLower)
      )
    })
  }, [matches, searchTerm])

  // Extract marketId from bets
  const extractMarketId = (match: any) => {
    const bets = match?.bets || []
    
    // Helper function to validate market ID format - accepts both integers and decimals
    const isValidMarketId = (id: string): boolean => {
      if (!id || typeof id !== 'string') return false
      const trimmed = id.trim()
      return trimmed.length > 0 && !isNaN(Number(trimmed)) && isFinite(Number(trimmed))
    }
    
    // Priority 1: Check bet.marketId directly
    if (bets.length > 0 && bets[0].marketId) {
      const marketId = String(bets[0].marketId).trim()
      if (isValidMarketId(marketId)) {
        return marketId
      }
    }
    
    // Priority 2: Check all bets for marketId
    for (const bet of bets) {
      if (bet.marketId) {
        const marketId = String(bet.marketId).trim()
        if (isValidMarketId(marketId)) {
          return marketId
        }
      }
    }
    
    return ""
  }

  // Get runners from match data
  const runners = useMemo(() => {
    if (!selectedMatch?.runners) {
      return []
    }
    
    const matchRunners = selectedMatch.runners
    
    if (!Array.isArray(matchRunners)) {
      return []
    }
    
    // Filter valid runners
    const validRunners = matchRunners.filter((runner: any) => 
      runner != null && 
      runner !== undefined &&
      runner.selectionId != null && 
      runner.selectionId !== undefined
    )
    
    // Deduplicate by selectionId
    const seenSelectionIds = new Set<string>()
    const uniqueRunners = validRunners.filter((runner: any) => {
      const selectionId = String(runner.selectionId)
      if (seenSelectionIds.has(selectionId)) {
        return false
      }
      seenSelectionIds.add(selectionId)
      return true
    })
    
    return uniqueRunners
  }, [selectedMatch?.runners])

  // Initialize form when match is selected
  useEffect(() => {
    if (selectedMatch) {
      // Extract eventId
      const extractedEventId = selectedMatch.eventId || ""
      setEventId(String(extractedEventId))
      
      // Extract marketId
      const extractedMarketId = extractMarketId(selectedMatch)
      setMarketId(extractedMarketId)
      
      // Set default to first runner's selectionId if available
      if (runners.length > 0 && runners[0].selectionId) {
        setWinnerSelectionId(String(runners[0].selectionId))
      } else {
        setWinnerSelectionId("")
      }
      setIsCancel(false)
    }
  }, [selectedMatch, runners])

  // Group bets by settlementId
  const groupedSettlements = useMemo(() => {
    if (!selectedMatch?.bets) return []
    
    const bets = selectedMatch.bets
    const grouped: Record<string, any> = {}
    
    bets.forEach((bet: any) => {
      const settlementId = bet.settlementId || 'unknown'
      if (!grouped[settlementId]) {
        grouped[settlementId] = {
          settlementId,
          betName: bet.betName || 'Unknown',
          count: 0,
          totalAmount: 0,
          bets: []
        }
      }
      grouped[settlementId].count += 1
      grouped[settlementId].totalAmount += bet.amount || 0
      grouped[settlementId].bets.push(bet)
    })
    
    return Object.values(grouped)
  }, [selectedMatch])

  const handleSettle = async () => {
    if (!eventId.trim() || !marketId.trim() || !winnerSelectionId.trim()) {
      toast.error("Event ID, Market ID, and Winner Selection are required")
      return
    }
    
    // Validate marketId is a valid number
    const marketIdNum = marketId.trim()
    if (!marketIdNum || isNaN(Number(marketIdNum)) || !isFinite(Number(marketIdNum))) {
      toast.error("Market ID must be a valid number")
      return
    }
    
    // Validate eventId is a valid number
    const eventIdNum = eventId.trim()
    if (!/^\d+$/.test(eventIdNum)) {
      toast.error("Event ID must be a valid number")
      return
    }
    
    // Validate winnerSelectionId is a valid number
    const winnerSelectionIdNum = winnerSelectionId.trim()
    if (!/^\d+$/.test(winnerSelectionIdNum)) {
      toast.error("Winner Selection ID must be a valid number")
      return
    }
    
    const bets = selectedMatch?.bets || []
    const betCount = bets.length
    const totalAmount = selectedMatch?.totalAmount || 0
    
    // Collect betIds from all bets
    const betData = bets.map((bet: any) => ({
      betId: bet.betId || bet.id,
      selectionId: bet.selectionId || null
    })).filter((item: any) => item.betId != null)
    
    const betIds = betData.map((item: any) => item.betId)
    
    if (isCancel) {
      // Use cancelBets endpoint
      if (betIds.length === 0) {
        toast.error("No bet IDs found to cancel")
        return
      }
      
      // Extract unique selectionIds from bets
      const selectionIds = [...new Set(betData.map((item: any) => item.selectionId).filter((id: any) => id != null))]
      
      if (selectionIds.length === 0) {
        toast.error("No selection IDs found in bets. Cannot cancel bets without selection IDs.")
        return
      }
      
      // If bets have different selectionIds, we need to group them and cancel separately
      if (selectionIds.length > 1) {
        toast.error(`Bets have different selection IDs (${selectionIds.join(', ')}). Please cancel bets with the same selection ID together.`)
        return
      }
      
      // All bets have the same selectionId, use it
      const betSelectionId = String(selectionIds[0])
      
      const confirmMessage = `Cancelling ${betIds.length} Tied Match bet(s) for Selection ID ${betSelectionId} - Total: Rs${totalAmount.toLocaleString()}`
      
      toast.info(confirmMessage, {
        duration: 3000,
      })

      try {
        const payload = {
          eventId: eventIdNum,
          marketId: marketIdNum,
          selectionId: betSelectionId,
          betIds: betIds
        }
        
        await cancelBets(payload).unwrap()
        toast.success(`Tied Match bets cancelled successfully. ${betIds.length} bet(s) cancelled.`)
        refetch()
        setSelectedMatch(null)
      } catch (error: any) {
        toast.error(error?.data?.error || error?.data?.message || "Failed to cancel tied match bets")
      }
    } else {
      // Use regular settlement
      const confirmMessage = `Settling ${betCount} Tied Match bet(s) for this market - Total: Rs${totalAmount.toLocaleString()}`
      
      toast.info(confirmMessage, {
        duration: 3000,
      })

      // Ensure all values are valid numbers
      if (isNaN(Number(eventIdNum)) || isNaN(Number(marketIdNum)) || isNaN(Number(winnerSelectionIdNum))) {
        toast.error("Invalid ID format. Please ensure all IDs are valid numbers.")
        return
      }
      
      const finalPayload = {
        eventId: eventIdNum,
        marketId: marketIdNum,
        winnerSelectionId: winnerSelectionIdNum
      }

      try {
        console.log('🔵 [Tied Match Settlement] ========== SENDING SETTLEMENT REQUEST ==========', {
          endpoint: '/admin/settlement/tied-match',
          payload: finalPayload,
          payloadTypes: {
            eventId: typeof finalPayload.eventId,
            marketId: typeof finalPayload.marketId,
            winnerSelectionId: typeof finalPayload.winnerSelectionId
          },
          payloadStringified: JSON.stringify(finalPayload)
        })
        
        await settleTiedMatch(finalPayload).unwrap()
        toast.success(`Tied Match bets settled successfully. ${betCount} bet(s) processed.`)
        refetch()
        setSelectedMatch(null)
      } catch (error: any) {
        console.error('❌ [Tied Match Settlement] Error details:', {
          error,
          errorData: error?.data,
          errorMessage: error?.message,
          errorResponse: error?.data?.error || error?.data?.message,
          payloadSent: finalPayload
        })
        
        const errorMessage = 
          error?.data?.error || 
          error?.data?.message || 
          error?.message || 
          'Failed to settle tied match'
        
        toast.error(errorMessage)
      }
    }
  }

  // Render selected match view
  if (selectedMatch) {
    return (
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        <button
          onClick={() => setSelectedMatch(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 md:mb-4 text-sm md:text-base"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Matches</span>
        </button>
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg p-3 md:p-4 mb-3 md:mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
            <span className="text-xl md:text-2xl font-bold truncate">{selectedMatch.homeTeam || "Team 1"}</span>
            <span className="text-base md:text-lg">vs</span>
            <span className="text-xl md:text-2xl font-bold truncate">{selectedMatch.awayTeam || "Team 2"}</span>
          </div>
          {selectedMatch.matchTitle && (
            <p className="text-xs md:text-sm text-white/80 mb-2 truncate">{selectedMatch.matchTitle}</p>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs md:text-sm">
            {selectedMatch.eventId && <span className="truncate">Event ID: {selectedMatch.eventId}</span>}
          </div>
        </div>

        {/* Tied Match Settlements Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 md:mb-6">
          <div className="bg-gray-50 px-3 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <h3 className="font-semibold text-base md:text-lg">Tied Match Settlements</h3>
          </div>
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-bold text-gray-700 uppercase">Selection</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-center text-xs font-bold text-gray-700 uppercase">Bets Count</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-right text-xs font-bold text-gray-700 uppercase">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedSettlements.length > 0 ? (
                    groupedSettlements.map((group: any, index: number) => (
                      <tr key={group.settlementId || index} className="hover:bg-gray-50">
                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-semibold">
                          {group.betName || group.settlementId || "N/A"}
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-center">
                          <span className="text-xs md:text-sm font-semibold text-orange-600">
                            {group.count} {group.count === 1 ? 'bet' : 'bets'}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-right">
                          <span className="text-xs md:text-sm font-bold text-green-600">
                            Rs{group.totalAmount?.toLocaleString() || 0}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-3 md:px-6 py-8 md:py-12 text-center">
                        <p className="text-gray-500 font-medium text-sm md:text-base">No tied match bets found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Settlement Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-3 md:px-6 py-3 md:py-4">
            <h3 className="font-semibold text-base md:text-lg flex items-center gap-2">
              <Zap className="w-4 h-4 md:w-5 md:h-5" />
              Settlement Details
            </h3>
          </div>
          <div className="p-3 md:p-6 space-y-3 md:space-y-4">
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
                <span className="ml-2 text-xs text-gray-500 font-normal">(Accepts both integer and decimal values, e.g., 7519538977640 or 1.252991818)</span>
              </label>
              <Input
                type="text"
                value={marketId}
                onChange={(e) => setMarketId(e.target.value)}
                placeholder="Enter market ID (e.g., 1.252991818 or 7519538977640)"
                className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                required
              />
              {marketId && (
                <div className="mt-1">
                  <p className="text-xs text-gray-500">
                    Market ID: {marketId} ({marketId.length} {marketId.includes('.') ? 'characters' : 'digits'})
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isCancel ? "Selection ID" : "Winner Selection"} <span className="text-red-500">*</span>
                {runners && runners.length > 0 && !isCancel && (
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
                        return null
                      }
                      
                      const displayName = runner.name || runner.runnerName || `Selection ${runner.selectionId}`
                      const selectionId = String(runner.selectionId)
                      return (
                        <option 
                          key={`runner-${runner.selectionId}-${index}`} 
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

            <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-3 pt-3 md:pt-4 border-t border-gray-200">
              <Button
                onClick={() => setSelectedMatch(null)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm md:text-base w-full sm:w-auto"
                disabled={isSettling || isCancelling}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSettle}
                disabled={(isSettling || isCancelling) || !eventId.trim() || !marketId.trim() || !winnerSelectionId.trim()}
                className="px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-white font-semibold bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base w-full sm:w-auto"
              >
                {(isSettling || isCancelling) ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Settling...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {isCancel ? "Cancel Bets" : "Settle All Bets"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default view when no match is selected
  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-6">
      {/* Screen Header - Tied Match Only */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg p-3 md:p-4 mb-4 md:mb-6 shadow-md">
        <div className="flex items-center gap-2 md:gap-3">
          <Link2 className="w-5 h-5 md:w-6 md:h-6" />
          <div>
            <h2 className="text-lg md:text-xl font-bold">Tied Match Settlement</h2>
            <p className="text-xs md:text-sm text-white/80">Only matches with Tied Match bets are shown</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 md:p-4 mb-4 md:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
          <Input
            type="text"
            placeholder="Search Tied Match matches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 md:pl-10 w-full text-sm md:text-base"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 md:py-20">
          <RefreshCw className="w-8 h-8 md:w-10 md:h-10 animate-spin text-[#00A66E]" />
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-orange-50 px-3 md:px-6 py-2 md:py-3 border-b border-orange-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm md:text-base font-semibold text-orange-900">
                Tied Match Pending Settlements
              </h3>
              <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                {filteredMatches.length} {filteredMatches.length === 1 ? 'match' : 'matches'}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-bold text-orange-900 uppercase">Event ID</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs font-bold text-orange-900 uppercase">Match Title</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-center text-xs font-bold text-orange-900 uppercase">Tied Match Bets</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-right text-xs font-bold text-orange-900 uppercase">Amount</th>
                    <th className="px-3 md:px-6 py-2 md:py-4 text-center text-xs font-bold text-orange-900 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMatches.map((match: any, index: number) => (
                    <tr key={match.eventId || index} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-mono">{match.eventId || "N/A"}</td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
                        {match.matchTitle || `${match.homeTeam || "N/A"} vs ${match.awayTeam || "N/A"}`}
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs md:text-sm font-semibold">
                          <Link2 className="w-3 h-3" />
                          {match.bets?.length || 0} Tied Match bet{(match.bets?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-right">
                        <span className="text-xs md:text-sm font-bold text-green-600">
                          Rs{(match.totalAmount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-center">
                        <Button
                          onClick={() => setSelectedMatch(match)}
                          className="text-[#00A66E] hover:text-[#00C97A] font-medium text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <Link2 className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tied Match Pending</h3>
          <p className="text-gray-500 text-sm">There are no matches with Tied Match bets requiring settlement.</p>
        </div>
      )}
    </div>
  )
}



