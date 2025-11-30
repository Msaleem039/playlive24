"use client"

import { useState } from "react"
import { Eye, CheckCircle, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
import { 
  useGetPendingSettlementsQuery, 
  useGetSettlementDetailsQuery,
  useGetSettlementBetsQuery,
  useManualSettlementMutation 
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#00A66E] text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Settlement Details</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-[#00A66E]" />
            </div>
          ) : details ? (
            <>
              {/* Match Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-lg mb-3">Match Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Match ID:</span>
                    <span className="ml-2 font-medium">{details.match_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Event:</span>
                    <span className="ml-2 font-medium">{details.match?.eventName || details.match?.ename || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Home Team:</span>
                    <span className="ml-2 font-medium">{details.match?.homeTeam || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Away Team:</span>
                    <span className="ml-2 font-medium">{details.match?.awayTeam || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium">{details.match?.status || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Bet Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-lg mb-3">Bet Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Bet Name:</span>
                    <span className="ml-2 font-medium">{details.bet_info?.betName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Market:</span>
                    <span className="ml-2 font-medium">{details.bet_info?.marketName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">GType:</span>
                    <span className="ml-2 font-medium">{details.bet_info?.gtype || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Status Counts */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
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
                    <span className="font-bold text-lg">₹{details.total_pending_amount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600">Total Bets:</span>
                    <span className="font-bold">{details.total_bets || 0}</span>
                  </div>
                </div>
              </div>

              {/* Manual Settlement */}
              {details.status_counts?.PENDING > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-lg mb-3">Manual Settlement</h3>
                  <div className="flex gap-4 items-end">
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
                      className="bg-[#00A66E] hover:bg-[#008a5a] text-white px-6 py-2 disabled:opacity-50"
                    >
                      {isSettling ? "Settling..." : "Settle Now"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Bets Table */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <h3 className="font-semibold text-lg p-4 bg-gray-100">Bets List</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Odds</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Bet Name</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {details.bets && details.bets.length > 0 ? (
                        details.bets.map((bet: any, index: number) => (
                          <tr key={bet.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{bet.user?.name || bet.userId || "N/A"}</td>
                            <td className="px-4 py-3 text-sm">₹{bet.amount?.toLocaleString() || 0}</td>
                            <td className="px-4 py-3 text-sm">{bet.odds || "N/A"}</td>
                            <td className="px-4 py-3 text-sm">{bet.betName || "N/A"}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                bet.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                bet.status === "WON" ? "bg-green-100 text-green-800" :
                                bet.status === "LOST" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {bet.status || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {bet.createdAt ? new Date(bet.createdAt).toLocaleString() : "N/A"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            No bets found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No details available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SettlementManagementView() {
  const { data: pendingData, isLoading, refetch } = useGetPendingSettlementsQuery({})
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

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
  }

  const settlements = (pendingData as any) || []

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#00A66E] text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Pending Settlements</h1>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Purple Bar */}
      {/* <div className="bg-purple-600 h-2"></div> */}

      {/* Data Table */}
      <div className="bg-white mx-4 sm:mx-6 mt-4 shadow-sm rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-[#00A66E]" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Settlement ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Match
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Event Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Bet Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Market
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Pending Bets
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {settlements.length > 0 ? (
                    settlements.map((settlement: any, index: number) => (
                      <tr key={settlement.settlement_id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {settlement.settlement_id}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {settlement.match?.homeTeam || "N/A"} vs {settlement.match?.awayTeam || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {settlement.match?.eventName || settlement.match?.ename || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {settlement.first_bet?.betName || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {settlement.first_bet?.marketName || "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                            {settlement.pending_bets_count || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                          Rs{settlement.total_bet_amount?.toLocaleString() || 0}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleViewDetails(settlement.settlement_id)}
                            className="inline-flex items-center gap-1 bg-[#00A66E] hover:bg-[#008a5a] text-white px-3 py-1 rounded text-xs font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No pending settlements found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {settlements.length > 0 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-700">
                    Total Count: {settlements.length}
                  </span>
                </div>
              </div>
            )}
          </>
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

