"use client"

import { useState, useMemo, useEffect } from "react"
import { 
  Eye, 
  X, 
  RefreshCw, 
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  FileText,
  Search,
  Filter,
  BarChart3,
  Activity,
  Zap,
  Shield,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download as DownloadIcon,
  Play,
  Target,
  BookOpen,
  RotateCcw,
  Menu,
  TrendingUp,
  TrendingDown,
  Trash2
} from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
import { 
  useGetPendingSettlementsQuery, 
  useGetSettlementDetailsQuery,
  useGetSettlementBetsQuery,
  useManualSettlementMutation,
  useGetAllSettlementReportQuery,
  useGetSettlementHistoryQuery,
  useReverseSettlementMutation,
  useSettleFancyMutation,
  useSettleMatchOddsMutation,
  useSettleBookmakerMutation,
  useRollbackSettlementMutation,
  useDeleteBetMutation
} from "@/app/services/Api"
import { toast } from "sonner"

interface SettlementModalProps {
  match: any
  marketType: "fancy" | "matchOdds" | "bookmaker"
  isOpen: boolean
  onClose: () => void
  onSettle: () => void
}

function SettlementModal({ match, marketType, isOpen, onClose, onSettle }: SettlementModalProps) {
  const [settleFancy, { isLoading: isSettlingFancy }] = useSettleFancyMutation()
  const [settleMatchOdds, { isLoading: isSettlingMatchOdds }] = useSettleMatchOddsMutation()
  const [settleBookmaker, { isLoading: isSettlingBookmaker }] = useSettleBookmakerMutation()
  
  const selectedBet = match?.selectedBet
  const settlementId = selectedBet?.settlementId || ""
  
  // Extract marketId and selectionId from settlementId (format: "matchId_marketId" or "matchId_selectionId")
  const extractIdsFromSettlementId = (settlementId: string) => {
    if (!settlementId || !settlementId.includes("_")) return { marketId: "", selectionId: "" }
    const parts = settlementId.split("_")
    return {
      marketId: parts[1] || "",
      selectionId: parts[1] || ""
    }
  }

  const extractedIds = extractIdsFromSettlementId(settlementId)
  
  const [eventId, setEventId] = useState(match?.eventId || "")
  const [selectionId, setSelectionId] = useState(selectedBet && marketType === "fancy" ? extractedIds.selectionId : "")
  const [decisionRun, setDecisionRun] = useState("")
  const [isCancel, setIsCancel] = useState(false)
  const [marketId, setMarketId] = useState(selectedBet && (marketType === "matchOdds" || marketType === "bookmaker") ? extractedIds.marketId : "")
  const [winnerSelectionId, setWinnerSelectionId] = useState(selectedBet && (marketType === "matchOdds" || marketType === "bookmaker") ? extractedIds.selectionId : "")

  useEffect(() => {
    if (isOpen && match) {
      const bet = match?.selectedBet
      const settlementId = bet?.settlementId || ""
      const extracted = extractIdsFromSettlementId(settlementId)
      
      setEventId(match.eventId || "")
      if (bet && marketType === "fancy") {
        setSelectionId(extracted.selectionId)
      } else {
      setSelectionId("")
      }
      setDecisionRun("")
      setIsCancel(false)
      if (bet && (marketType === "matchOdds" || marketType === "bookmaker")) {
        setMarketId(extracted.marketId)
        setWinnerSelectionId(extracted.selectionId)
      } else {
        setMarketId("")
        setWinnerSelectionId("")
      }
    }
  }, [isOpen, match, marketType])

  const handleSettle = async () => {
    if (marketType === "fancy") {
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
    } else if (marketType === "matchOdds") {
      if (!eventId.trim() || !marketId.trim() || !winnerSelectionId.trim()) {
        toast.error("Event ID, Market ID, and Winner Selection ID are required")
      return
    }

    try {
        await settleMatchOdds({
          eventId: eventId.trim(),
          marketId: marketId.trim(),
          winnerSelectionId: winnerSelectionId.trim()
      }).unwrap()
        toast.success("Match odds bets settled successfully")
      onSettle()
      onClose()
    } catch (error: any) {
        toast.error(error?.data?.error || error?.data?.message || "Failed to settle match odds")
      }
    } else if (marketType === "bookmaker") {
      if (!eventId.trim() || !marketId.trim() || !winnerSelectionId.trim()) {
        toast.error("Event ID, Market ID, and Winner Selection ID are required")
        return
      }

      try {
        await settleBookmaker({
          eventId: eventId.trim(),
          marketId: marketId.trim(),
          winnerSelectionId: winnerSelectionId.trim()
        }).unwrap()
        toast.success("Bookmaker bets settled successfully")
        onSettle()
        onClose()
      } catch (error: any) {
        toast.error(error?.data?.error || error?.data?.message || "Failed to settle bookmaker bets")
      }
    }
  }

  const isLoading = isSettlingFancy || isSettlingMatchOdds || isSettlingBookmaker
  const marketData = marketType === "fancy" ? match?.fancy : 
                     marketType === "matchOdds" ? match?.matchOdds : 
                     match?.bookmaker

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className={`bg-gradient-to-r ${
          marketType === "fancy" ? "from-purple-600 to-purple-700" :
          marketType === "matchOdds" ? "from-blue-600 to-blue-700" :
          "from-green-600 to-green-700"
        } text-white px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              {marketType === "fancy" ? <Target className="w-5 h-5" /> :
               marketType === "matchOdds" ? <Play className="w-5 h-5" /> :
               <BookOpen className="w-5 h-5" />}
        </div>
                  <div>
              <h2 className="text-xl font-bold">
                Settle {marketType === "fancy" ? "Fancy" : marketType === "matchOdds" ? "Match Odds" : "Bookmaker"} {match?.selectedBet ? "Bet" : "Bets"}
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

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
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

              {marketType === "fancy" ? (
                <>
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
                </>
              ) : (
                <>
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
                      Winner Selection ID <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={winnerSelectionId}
                      onChange={(e) => setWinnerSelectionId(e.target.value)}
                      placeholder="Enter winner selection ID"
                      className="w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                      required
                    />
                  </div>
                </>
              )}
                </div>
              </div>
        </div>

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
            disabled={isLoading || !eventId.trim() || 
              (marketType === "fancy" ? (!selectionId.trim() || (!isCancel && !decisionRun.trim())) :
               (!marketId.trim() || !winnerSelectionId.trim()))}
            className={`px-6 py-2.5 rounded-lg text-white font-semibold ${
              marketType === "fancy" ? "bg-purple-600 hover:bg-purple-700" :
              marketType === "matchOdds" ? "bg-blue-600 hover:bg-blue-700" :
              "bg-green-600 hover:bg-green-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin inline" />
                Settling...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2 inline" />
                {marketType === "fancy" && isCancel ? "Cancel Bets" : "Settle Bets"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SettlementAdminPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeMarketTab, setActiveMarketTab] = useState<"all" | "fancy" | "matchOdds" | "bookmaker" | "results">("all")
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [selectedMarketType, setSelectedMarketType] = useState<"fancy" | "matchOdds" | "bookmaker" | null>(null)
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  // Date filters for settlement history
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString()
  })
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString()
  })

  const { data: pendingData, isLoading, refetch } = useGetPendingSettlementsQuery({}, { 
    pollingInterval: 30000
  })
  const { data: resultsData, isLoading: isLoadingResults, refetch: refetchResults } = useGetAllSettlementReportQuery({})
  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } = useGetSettlementHistoryQuery({
    startDate,
    endDate,
    limit: 100,
    offset: 0
  })
  const [rollbackSettlement, { isLoading: isRollingBack }] = useRollbackSettlementMutation()
  const [deleteBet, { isLoading: isDeletingBet }] = useDeleteBetMutation()

  // Transform API response
  const matches = useMemo(() => {
    if (!pendingData) return []
    const response = pendingData as any
    if (response.data && Array.isArray(response.data)) {
      return response.data
    }
    return Array.isArray(response) ? response : []
  }, [pendingData])

  // Filter matches by market type
  const filteredMatches = useMemo(() => {
    let filtered = matches.filter((match: any) => {
      const matchId = match.matchId || ""
      const matchTitle = match.matchTitle || ""
      const homeTeam = match.homeTeam || ""
      const awayTeam = match.awayTeam || ""
      const eventId = match.eventId || ""
      const searchLower = searchTerm.toLowerCase()
      
      const matchesSearch = 
        matchId.toLowerCase().includes(searchLower) ||
        matchTitle.toLowerCase().includes(searchLower) ||
        homeTeam.toLowerCase().includes(searchLower) ||
        awayTeam.toLowerCase().includes(searchLower) ||
        eventId.toLowerCase().includes(searchLower)
      
      if (activeMarketTab === "fancy") {
        return matchesSearch && (match.fancy?.count || 0) > 0
      }
      if (activeMarketTab === "matchOdds") {
        return matchesSearch && (match.matchOdds?.count || 0) > 0
      }
      if (activeMarketTab === "bookmaker") {
        return matchesSearch && (match.bookmaker?.count || 0) > 0
      }
      return matchesSearch
    })
    return filtered
  }, [matches, activeMarketTab, searchTerm])

  // Calculate stats
  const stats = useMemo(() => {
    const response = pendingData as any
    const totalMatches = response?.totalMatches || matches.length
    const totalPendingBets = response?.totalPendingBets || 0
    const totalAmount = matches.reduce((sum: number, match: any) => {
      return sum + (match.matchOdds?.totalAmount || 0) + (match.fancy?.totalAmount || 0) + (match.bookmaker?.totalAmount || 0)
    }, 0)
    
    const fancyMatches = matches.filter((m: any) => (m.fancy?.count || 0) > 0).length
    const matchOddsMatches = matches.filter((m: any) => (m.matchOdds?.count || 0) > 0).length
    const bookmakerMatches = matches.filter((m: any) => (m.bookmaker?.count || 0) > 0).length

    return {
      totalMatches,
      totalPendingBets,
      totalAmount,
      fancyMatches,
      matchOddsMatches,
      bookmakerMatches
    }
  }, [matches, pendingData])

  const handleMatchClick = (match: any, marketType: "fancy" | "matchOdds" | "bookmaker") => {
    setSelectedMatch(match)
    setSelectedMarketType(marketType)
    setIsSettlementModalOpen(true)
  }

  const handleCloseSettlementModal = () => {
    setIsSettlementModalOpen(false)
    setSelectedMarketType(null)
    // Clear selectedBet but keep the match selected
    if (selectedMatch) {
      const { selectedBet, ...matchWithoutBet } = selectedMatch
      setSelectedMatch(matchWithoutBet)
    }
  }

  const handleSettle = () => {
    refetch()
      refetchResults()
  }

  const handleRollback = async (settlementId: string) => {
    if (!confirm("Are you sure you want to rollback this settlement?")) {
        return
      }
    try {
      await rollbackSettlement({ settlementId }).unwrap()
      toast.success("Settlement rolled back successfully")
      refetch()
      refetchResults()
      refetchHistory()
    } catch (error: any) {
      toast.error(error?.data?.error || error?.data?.message || "Failed to rollback settlement")
    }
  }

  const handleDeleteBet = async (betId: string, settlementId?: string) => {
    // Use betId if available, otherwise use settlementId
    const idToDelete = betId || settlementId
    if (!idToDelete) {
      toast.error("Bet ID or Settlement ID is required")
      return
    }

    if (!confirm(`Are you sure you want to delete this bet? The refund amount will be processed.`)) {
      return
    }

    try {
      const result = await deleteBet(idToDelete).unwrap()
      toast.success(result?.message || "Bet deleted successfully", {
        description: result?.data?.refundAmount 
          ? `Refund amount: Rs${result.data.refundAmount.toLocaleString()}` 
          : undefined
      })
      refetch()
      refetchResults()
      refetchHistory()
      // If we're viewing a match detail, refresh the selected match
      if (selectedMatch) {
        refetch()
      }
    } catch (error: any) {
      toast.error(error?.data?.error || error?.data?.message || "Failed to delete bet")
    }
  }

  // Get bets for selected match and market type
  const getMarketBets = (match: any, marketType: "fancy" | "matchOdds" | "bookmaker") => {
    if (marketType === "fancy") return match.fancy?.bets || []
    if (marketType === "matchOdds") return match.matchOdds?.bets || []
    return match.bookmaker?.bets || []
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col border-r border-gray-200`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-lg font-bold text-[#00A66E]">Settlement</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-2 space-y-1">
            <button
              onClick={() => {
                setActiveMarketTab("all")
                setSelectedMatch(null)
                setPage(1)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeMarketTab === "all"
                  ? "bg-[#00A66E] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <BarChart3 className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">All Markets</span>}
            </button>

            <button
              onClick={() => {
                setActiveMarketTab("matchOdds")
                setSelectedMatch(null)
                setPage(1)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeMarketTab === "matchOdds"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Play className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">Match Odds</span>
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                    {stats.matchOddsMatches}
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveMarketTab("fancy")
                setSelectedMatch(null)
                setPage(1)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeMarketTab === "fancy"
                  ? "bg-purple-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Target className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">Fancy</span>
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                    {stats.fancyMatches}
                  </span>
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setActiveMarketTab("bookmaker")
                setSelectedMatch(null)
                setPage(1)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeMarketTab === "bookmaker"
                  ? "bg-green-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <BookOpen className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">Bookmaker</span>
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                    {stats.bookmakerMatches}
                  </span>
                </div>
              )}
            </button>

            <div className="border-t border-gray-200 my-2"></div>

            <button
              onClick={() => {
                setActiveMarketTab("results")
                setSelectedMatch(null)
                setPage(1)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeMarketTab === "results"
                  ? "bg-gray-800 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FileText className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Results</span>}
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Matches:</span>
                <span className="font-semibold">{stats.totalMatches}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Bets:</span>
                <span className="font-semibold">{stats.totalPendingBets}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold text-green-600">Rs{stats.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
        <div className="bg-gradient-to-r from-[#00A66E] to-[#00C97A] text-white shadow-lg">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Settlement Admin Panel</h1>
                <p className="text-sm text-white/80">Manage and monitor all settlements</p>
              </div>
              <div className="flex items-center gap-2">
          <button
            onClick={() => {
                    if (activeMarketTab === "results") {
                refetchResults()
                refetchHistory()
                    } else {
                      refetch()
              }
            }}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
            </div>
      </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Matches List - hidden on Results tab */}
          {!selectedMatch && activeMarketTab !== "results" && (
            <div className="flex-1 overflow-y-auto p-6">
              {/* Search */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search matches by ID, title, teams, event..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setPage(1)
                    }}
                    className="pl-10 w-full border-gray-300 focus:border-[#00A66E] focus:ring-[#00A66E]"
                  />
            </div>
        </div>

              {/* Matches Table */}
              {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-10 h-10 animate-spin text-[#00A66E]" />
              </div>
              ) : filteredMatches.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Match ID</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Event ID</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Match Title</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Home Team</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Match Odds</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Total Amount</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                        {filteredMatches.map((match: any, index: number) => {
                          const matchOddsCount = match.matchOdds?.count || 0
                          const matchOddsAmount = match.matchOdds?.totalAmount || 0
                          const fancyCount = match.fancy?.count || 0
                          const fancyAmount = match.fancy?.totalAmount || 0
                          const bookmakerCount = match.bookmaker?.count || 0
                          const bookmakerAmount = match.bookmaker?.totalAmount || 0
                          const totalAmount = matchOddsAmount + fancyAmount + bookmakerAmount

                    return (
                      <tr 
                              key={match.matchId || index} 
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => {
                                if (activeMarketTab === "matchOdds" && matchOddsCount > 0) {
                                  setSelectedMatch({ ...match, activeMarket: "matchOdds" })
                                } else if (activeMarketTab === "fancy" && fancyCount > 0) {
                                  setSelectedMatch({ ...match, activeMarket: "fancy" })
                                } else if (activeMarketTab === "bookmaker" && bookmakerCount > 0) {
                                  setSelectedMatch({ ...match, activeMarket: "bookmaker" })
                                } else if (activeMarketTab === "all") {
                                  setSelectedMatch({ ...match, activeMarket: "all" })
                                }
                              }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                {match.matchId || "N/A"}
                        </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                {match.eventId || "N/A"}
                        </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {match.matchTitle || `${match.homeTeam || "N/A"} vs ${match.awayTeam || "N/A"}`}
                        </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {match.homeTeam || "N/A"}
                        </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {matchOddsCount > 0 ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-sm font-semibold text-blue-600">{matchOddsCount} bets</span>
                                    <span className="text-xs text-gray-600">Rs{matchOddsAmount.toLocaleString()}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="text-sm font-bold text-green-600">
                                  Rs{totalAmount.toLocaleString()}
                          </span>
                        </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (activeMarketTab === "matchOdds" && matchOddsCount > 0) {
                                      setSelectedMatch({ ...match, activeMarket: "matchOdds" })
                                    } else if (activeMarketTab === "fancy" && fancyCount > 0) {
                                      setSelectedMatch({ ...match, activeMarket: "fancy" })
                                    } else if (activeMarketTab === "bookmaker" && bookmakerCount > 0) {
                                      setSelectedMatch({ ...match, activeMarket: "bookmaker" })
                                    } else if (activeMarketTab === "all") {
                                      setSelectedMatch({ ...match, activeMarket: "all" })
                                    }
                                  }}
                                  className="text-[#00A66E] hover:text-[#00C97A] font-medium text-sm"
                                >
                            View Details
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
                  </div>
            </div>
            ) : (
                <div className="text-center py-20">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium text-lg">No matches found</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter</p>
                </div>
              )}
            </div>
          )}

          {/* Match Details View */}
          {selectedMatch && activeMarketTab !== "results" && (
            <div className="flex-1 overflow-y-auto p-6 border-l border-gray-200 bg-white">
              <div className="mb-6">
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Matches</span>
          </button>
                <div className="bg-gradient-to-r from-[#00A66E] to-[#00C97A] text-white rounded-lg p-4 mb-4">
                  <h2 className="text-xl font-bold mb-2">{selectedMatch.matchTitle || `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`}</h2>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Match ID: {selectedMatch.matchId}</span>
                    {selectedMatch.eventId && <span>Event ID: {selectedMatch.eventId}</span>}
                  </div>
                </div>
              </div>

              {/* Market Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                {selectedMatch.matchOdds?.count > 0 && (
          <button
                    onClick={() => setSelectedMatch({ ...selectedMatch, activeMarket: "matchOdds" })}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                      selectedMatch.activeMarket === "matchOdds"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Match Odds ({selectedMatch.matchOdds.count})
          </button>
                )}
                {selectedMatch.fancy?.count > 0 && (
                  <button
                    onClick={() => setSelectedMatch({ ...selectedMatch, activeMarket: "fancy" })}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                      selectedMatch.activeMarket === "fancy"
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Fancy ({selectedMatch.fancy.count})
                  </button>
                )}
                {selectedMatch.bookmaker?.count > 0 && (
                  <button
                    onClick={() => setSelectedMatch({ ...selectedMatch, activeMarket: "bookmaker" })}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                      selectedMatch.activeMarket === "bookmaker"
                        ? "border-green-600 text-green-600"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Bookmaker ({selectedMatch.bookmaker.count})
                  </button>
                )}
        </div>

              {/* Bets Table */}
              {selectedMatch.activeMarket && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-lg">
                      {selectedMatch.activeMarket === "matchOdds" ? "Match Odds" :
                       selectedMatch.activeMarket === "fancy" ? "Fancy" :
                       "Bookmaker"} Bets
                    </h3>
                  </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Bet ID</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Odds</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Bet Type</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Bet Name</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Settlement ID</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Delete</th>
                    </tr>
                  </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getMarketBets(selectedMatch, selectedMatch.activeMarket as "fancy" | "matchOdds" | "bookmaker").length > 0 ? (
                          getMarketBets(selectedMatch, selectedMatch.activeMarket as "fancy" | "matchOdds" | "bookmaker").map((bet: any, index: number) => (
                            <tr key={bet.id || index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                {bet.id || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                Rs{bet.amount?.toLocaleString() || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {bet.odds || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  bet.betType === "BACK" ? "bg-green-100 text-green-800" :
                                  bet.betType === "LAY" ? "bg-red-100 text-red-800" :
                                  "bg-gray-100 text-gray-800"
                                }`}>
                                  {bet.betType || "N/A"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {bet.betName || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                {bet.settlementId || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {bet.createdAt ? new Date(bet.createdAt).toLocaleString() : "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <Button
                                  onClick={() => {
                                    const marketType = selectedMatch.activeMarket as "fancy" | "matchOdds" | "bookmaker"
                                    handleMatchClick({ ...selectedMatch, selectedBet: bet }, marketType)
                                  }}
                                  className={`${
                                    selectedMatch.activeMarket === "matchOdds" ? "bg-blue-600 hover:bg-blue-700" :
                                    selectedMatch.activeMarket === "fancy" ? "bg-purple-600 hover:bg-purple-700" :
                                    "bg-green-600 hover:bg-green-700"
                                  } text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5`}
                                >
                                  <Zap className="w-3 h-3" />
                                  Settle
                                </Button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <Button
                                  onClick={() => handleDeleteBet(bet.id, bet.settlementId)}
                                  disabled={isDeletingBet}
                                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                  title="Delete bet and refund amount"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={9} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center">
                                <FileText className="w-12 h-12 text-gray-400 mb-3" />
                                <p className="text-gray-500 font-medium">No bets found for this market</p>
                              </div>
                      </td>
                    </tr>
                        )}
                  </tbody>
                </table>
              </div>
                </div>
              )}
            </div>
          )}

          {/* Results View */}
          {activeMarketTab === "results" && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Date Filters */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                      <Input
                        type="datetime-local"
                        value={startDate ? new Date(startDate).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setStartDate(new Date(e.target.value).toISOString())}
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                      <Input
                        type="datetime-local"
                        value={endDate ? new Date(endDate).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setEndDate(new Date(e.target.value).toISOString())}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => refetchHistory()}
                        className="bg-[#00A66E] hover:bg-[#00C97A] text-white"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </div>
                
                {(isLoadingResults || isLoadingHistory) ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-10 h-10 animate-spin text-[#00A66E]" />
              </div>
                ) : (() => {
                  // Flatten history data: extract all bets from all settlements
                  const historyBets: any[] = []
                  if (historyData?.data && Array.isArray(historyData.data)) {
                    historyData.data.forEach((settlement: any) => {
                      if (settlement.bets && Array.isArray(settlement.bets)) {
                        settlement.bets.forEach((bet: any) => {
                          historyBets.push({
                            ...bet,
                            settlementId: settlement.settlementId || settlement.id,
                            marketType: settlement.marketType,
                            match: settlement.match,
                            isRollback: settlement.isRollback
                          })
                        })
                      }
                    })
                  }
                  
                  // Also include results from the old endpoint for backward compatibility
                  const oldResults = (resultsData as any)?.results || []
                  const allResults = [...historyBets, ...oldResults]
                  
                  return allResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Settlement ID</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Match</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Bet Name</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Market</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Odds</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Win</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Loss</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">P/L</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                        {allResults.map((result: any, index: number) => (
                          <tr key={result.id || index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-semibold text-gray-900">
                            {result.settlementId || result.settlement_id || "N/A"}
                          </span>
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.userName || result.user?.name || result.user?.username || "N/A"}
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.match?.homeTeam || result.match?.eventName || "N/A"}
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {result.betName || "N/A"}
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.marketType || result.marketName || "N/A"}
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-gray-900">
                            Rs{result.amount?.toLocaleString() || 0}
                          </span>
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {result.odds || "N/A"}
                          </span>
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            result.status === "WON" ? "bg-green-100 text-green-800" :
                            result.status === "LOST" ? "bg-red-100 text-red-800" :
                            result.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                            result.isRollback ? "bg-orange-100 text-orange-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {result.isRollback ? "ROLLED BACK" : (result.status || "N/A")}
                          </span>
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-green-600">
                            Rs{(result.pnl > 0 ? result.pnl : result.winAmount || 0)?.toLocaleString() || 0}
                          </span>
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-red-600">
                            Rs{(result.pnl < 0 ? Math.abs(result.pnl) : result.lossAmount || 0)?.toLocaleString() || 0}
                          </span>
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className={`text-sm font-bold ${
                            (result.pnl || result.profitLoss || 0) >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                                {(result.pnl || result.profitLoss || 0) >= 0 ? "+" : ""}Rs{(result.pnl || result.profitLoss || 0)?.toLocaleString() || 0}
                          </span>
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.settledAt || result.createdAt ? new Date(result.settledAt || result.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Button
                                onClick={() => handleRollback(result.settlementId || result.settlement_id)}
                                disabled={isRollingBack || result.isRollback}
                                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                              >
                                <RotateCcw className="w-3 h-3" />
                                {result.isRollback ? "Rolled Back" : "Rollback"}
                              </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
                  <div className="px-6 py-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium text-lg">No results found</p>
              </div>
                )
                })()}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Settlement Modal */}
      {selectedMatch && selectedMarketType && (
        <SettlementModal
          match={selectedMatch}
          marketType={selectedMarketType}
          isOpen={isSettlementModalOpen}
          onClose={handleCloseSettlementModal}
        onSettle={handleSettle}
      />
      )}
    </div>
  )
}
