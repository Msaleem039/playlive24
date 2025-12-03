"use client"

import { useState, useMemo } from "react"
import { 
  Eye, 
  X, 
  RefreshCw, 
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Users,
  FileText,
  Calendar,
  ChevronRight,
  Download
} from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
import { 
  useGetPendingSettlementsQuery, 
  useGetSettlementDetailsQuery,
  useGetSettlementBetsQuery,
  useManualSettlementMutation ,
  useGetAllSettlementReportQuery,
  useReverseSettlementMutation
} from "@/app/services/Api"
import { toast } from "sonner"

interface SettlementDetailsModalProps {
  settlementId: string
  isOpen: boolean
  onClose: () => void
  onSettle: () => void
}

function SettlementDetailsModal({ settlementId, isOpen, onClose, onSettle }: SettlementDetailsModalProps) {
  const { data: detailsData, isLoading, refetch } = useGetSettlementDetailsQuery(settlementId, {
    skip: !isOpen || !settlementId
  })
  const [manualSettlement, { isLoading: isSettling }] = useManualSettlementMutation()
  const [winner, setWinner] = useState("")

  const handleManualSettlement = async () => {
    if (!winner.trim()) {
      toast.error("Please enter the winner/result")
      return
    }

    try {
      await manualSettlement({
        settlement_id: settlementId,
        winner: winner.trim()
      }).unwrap()
      toast.success("Settlement completed successfully")
      onSettle()
      onClose()
    } catch (error: any) {
      toast.error(error?.data?.error || error?.data?.message || "Failed to settle")
    }
  }

  if (!isOpen) return null

  const details = detailsData as any

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#00A66E] text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Settlement Details</h2>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-10 h-10 animate-spin text-[#00A66E]" />
            </div>
          ) : details ? (
            <div className="space-y-6">
              {/* Match Info Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h3 className="font-semibold text-lg mb-3">Match Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">Match ID:</span>
                    <span className="ml-2 font-medium">{details.match_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Event:</span>
                    <span className="ml-2 font-medium">{details.match?.eventName || details.match?.ename || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Home Team:</span>
                    <span className="ml-2 font-medium">{details.match?.homeTeam || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Away Team:</span>
                    <span className="ml-2 font-medium">{details.match?.awayTeam || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Status:</span>
                    <span className="ml-2 font-medium">{details.match?.status || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Bet Info Card */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h3 className="font-semibold text-lg mb-3">Bet Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">Bet Name:</span>
                    <span className="ml-2 font-medium">{details.bet_info?.betName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Market:</span>
                    <span className="ml-2 font-medium">{details.bet_info?.marketName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">GType:</span>
                    <span className="ml-2 font-medium">{details.bet_info?.gtype || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Status Summary */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <h3 className="font-semibold text-lg mb-3">Status Summary</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{details.status_counts?.PENDING || 0}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{details.status_counts?.WON || 0}</div>
                    <div className="text-sm text-gray-600">Won</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{details.status_counts?.LOST || 0}</div>
                    <div className="text-sm text-gray-600">Lost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{details.status_counts?.CANCELLED || 0}</div>
                    <div className="text-sm text-gray-600">Cancelled</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Pending Amount:</span>
                    <span className="font-bold text-lg">Rs{details.total_pending_amount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600">Total Bets:</span>
                    <span className="font-bold">{details.total_bets || 0}</span>
                  </div>
                </div>
              </div>

              {/* Manual Settlement */}
              {details.status_counts?.PENDING > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-lg mb-3">Manual Settlement</h3>
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Winner/Result
                      </label>
                      <Input
                        type="text"
                        value={winner}
                        onChange={(e) => setWinner(e.target.value)}
                        placeholder="Enter winner (e.g., Team A, Team B, Draw)"
                        className="w-full"
                      />
                    </div>
                    <Button
                      onClick={handleManualSettlement}
                      disabled={isSettling || !winner.trim()}
                      className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-6 py-2 disabled:opacity-50"
                    >
                      {isSettling ? "Settling..." : "Settle Now"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Bets Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <h3 className="font-semibold text-lg p-4 bg-gray-100">Bets List ({details.bets?.length || 0})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Odds</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Bet Name</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {details.bets && details.bets.length > 0 ? (
                        details.bets.map((bet: any, index: number) => (
                          <tr key={bet.id || index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {bet.user?.name || bet.userId || "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              Rs{bet.amount?.toLocaleString() || 0}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {bet.odds || "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {bet.betName || "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                bet.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                bet.status === "WON" ? "bg-green-100 text-green-800" :
                                bet.status === "LOST" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {bet.status || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {bet.createdAt ? new Date(bet.createdAt).toLocaleString() : "N/A"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <FileText className="w-12 h-12 text-gray-400 mb-3" />
                              <p className="text-gray-500 font-medium">No bets found</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No details available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SettlementAdminPanel() {
  const [activeTab, setActiveTab] = useState<"pending" | "results">("pending")
  const { data: pendingData, isLoading, refetch } = useGetPendingSettlementsQuery({}, { skip: activeTab !== "pending" })
  const { data: resultsData, isLoading: isLoadingResults, refetch: refetchResults } = useGetAllSettlementReportQuery({}, { skip: activeTab !== "results" })
  const [reverseSettlement, { isLoading: isReversing }] = useReverseSettlementMutation()
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [searchTerm] = useState("")
  // const [filterStatus, setFilterStatus] = useState<string>("all")

  const handleViewDetails = (settlementId: string) => {
    setSelectedSettlementId(settlementId)
    setIsDetailsModalOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false)
    setSelectedSettlementId(null)
  }

  const handleSettle = () => {
    refetch()
    if (activeTab === "results") {
      refetchResults()
    }
  }

  const handleReverseSettlement = async (settlementId: string) => {
    try {
      const res: any = await reverseSettlement({ settlement_id: settlementId }).unwrap()

      // Backend might return a 200 with success=false, so check payload explicitly
      if (res?.success === false || res?.error) {
        toast.error(res?.error || res?.message || "Failed to reverse settlement")
        return
      }

      toast.success(res?.message || "Settlement reversed successfully")
      // Refresh both pending and results, since reversing will affect both lists
      refetch()
      refetchResults()
    } catch (error: any) {
      toast.error(error?.data?.error || error?.data?.message || "Failed to reverse settlement")
    }
  }

  const settlements = (pendingData as any) || []
  const results = (resultsData as any)?.results || []

  // Calculate statistics for pending settlements
  const pendingStats = useMemo(() => {
    const totalPending = settlements.length
    const totalBets = settlements.reduce((sum: number, s: any) => sum + (s.pending_bets_count || 0), 0)
    const totalAmount = settlements.reduce((sum: number, s: any) => sum + (s.total_bet_amount || 0), 0)
    const avgAmount = totalPending > 0 ? totalAmount / totalPending : 0

    return {
      totalPending,
      totalBets,
      totalAmount,
      avgAmount
    }
  }, [settlements])

  // Calculate statistics for results
  const resultsStats = useMemo(() => {
    const totalResults = results.length
    const totalAmount = results.reduce((sum: number, r: any) => sum + (r.amount || 0), 0)
    const totalProfitLoss = results.reduce((sum: number, r: any) => sum + (r.profitLoss || 0), 0)
    const wonCount = results.filter((r: any) => r.status === "WON").length
    const lostCount = results.filter((r: any) => r.status === "LOST").length

    return {
      totalResults,
      totalAmount,
      totalProfitLoss,
      wonCount,
      lostCount
    }
  }, [results])

  // Use the appropriate stats based on active tab

  // Filter settlements
  const filteredSettlements = useMemo(() => {
    return settlements.filter((settlement: any) => {
      const matchesSearch = 
        settlement.settlement_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        settlement.match?.homeTeam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        settlement.match?.awayTeam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        settlement.match?.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        settlement.first_bet?.betName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
  }, [settlements, searchTerm])

  // Filter results
  const filteredResults = useMemo(() => {
    return results.filter((result: any) => {
      const matchesSearch = 
        result.settlement_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.match?.homeTeam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.match?.awayTeam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.match?.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.betName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
  }, [results, searchTerm])

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#00A66E] text-white px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-lg font-bold">Settlement Admin Panel</h1>
          <button
            onClick={() => {
              if (activeTab === "pending") {
                refetch()
              } else {
                refetchResults()
              }
            }}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-sm font-semibold transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Purple Bar */}
      {/* <div className="bg-purple-600 h-2"></div> */}

      {/* Stats pills (also act as tab selectors) */}
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-2">
          {/* Pending Settlement stat */}
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`flex-1 rounded-lg border text-center px-4 py-3 transition-all ${
              activeTab === "pending"
                ? "bg-white text-[#00A66E] border-white shadow"
                : "bg-transparent text-white border-white/50"
            }`}
            style={{ backgroundColor: activeTab === "pending" ? "#ffffff" : "#00A66E" }}
          >
            <div className="text-sm font-semibold">Pending Settlement</div>
            <div className="mt-1 text-2xl font-bold">
              {pendingStats.totalPending}
            </div>
          </button>

          {/* Result Stats stat */}
          <button
            type="button"
            onClick={() => setActiveTab("results")}
            className={`flex-1 rounded-lg border text-center px-4 py-3 transition-all ${
              activeTab === "results"
                ? "bg-white text-[#00A66E] border-white shadow"
                : "bg-transparent text-white border-white/50"
            }`}
            style={{ backgroundColor: activeTab === "results" ? "#ffffff" : "#00A66E" }}
          >
            <div className="text-sm font-semibold">Result Stats</div>
            <div className="mt-1 text-2xl font-bold">
              {resultsStats.totalResults}
            </div>
          </button>
        </div>

        {/* Settlements Table */}
        <div className="bg-white mx-4 sm:mx-6 shadow-sm rounded-lg overflow-hidden">

          {activeTab === "pending" ? (
            isLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-10 h-10 animate-spin text-[#00A66E]" />
              </div>
            ) : filteredSettlements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Settlement ID
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Match
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Bet Info
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Pending Bets
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSettlements.map((settlement: any, index: number) => (
                    <tr 
                      key={settlement.settlement_id || index} 
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-semibold text-gray-900">
                          {settlement.settlement_id}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {settlement.match?.homeTeam || "N/A"} vs {settlement.match?.awayTeam || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {settlement.match?.eventName || settlement.match?.ename || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {settlement.first_bet?.betName || "N/A"} ({settlement.first_bet?.marketName || "N/A"})
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {settlement.pending_bets_count || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-green-600">
                          Rs{settlement.total_bet_amount?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewDetails(settlement.settlement_id)}
                          className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Settlement ID
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Match
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Bet Info
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Pending Bets
                      </th>
                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No Record Found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          ) : (
            isLoadingResults ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-10 h-10 animate-spin text-[#00A66E]" />
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Settlement ID
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Match
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Bet Name
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Market
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Odds
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Win Amount
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Loss Amount
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        P/L
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredResults.map((result: any, index: number) => (
                      <tr 
                        key={result.id || index} 
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-semibold text-gray-900">
                            {result.settlement_id}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.user?.name || result.user?.username || "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.match?.homeTeam || "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.betName || "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.marketName || "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-gray-900">
                            Rs{result.amount?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {result.odds || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result.status === "WON" ? "bg-green-100 text-green-800" :
                            result.status === "LOST" ? "bg-red-100 text-red-800" :
                            result.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {result.status || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-green-600">
                            Rs{result.winAmount?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-red-600">
                            Rs{result.lossAmount?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className={`text-sm font-semibold ${
                            (result.profitLoss || 0) >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            Rs{result.profitLoss?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.createdAt ? new Date(result.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleReverseSettlement(result.settlement_id)}
                            disabled={isReversing}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-semibold"
                          >
                            {isReversing ? "Reversing..." : "Reverse"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Settlement ID
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Match
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Bet Name
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Market
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Odds
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Win Amount
                      </th>
                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Loss Amount
                      </th>
                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        P/L
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                        No Record Found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Pagination */}
        {((activeTab === "pending" && filteredSettlements.length > 0) || (activeTab === "results" && filteredResults.length > 0)) && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                Total Counts: {activeTab === "pending" ? filteredSettlements.length : filteredResults.length}
              </span>
            </div>
            <div className="flex gap-2">
              <Button className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 text-sm rounded">
                « Pre
              </Button>
              <Button className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-3 py-1 text-sm rounded">
                1
              </Button>
              <Button className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 text-sm rounded">
                Next »
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Settlement Details Modal */}
      {selectedSettlementId && (
        <SettlementDetailsModal
          settlementId={selectedSettlementId}
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetails}
          onSettle={handleSettle}
        />
      )}
    </div>
  )
}

