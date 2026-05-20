'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { useLazyGetUserQuery } from '@/app/services/Api'

interface ClientAccountStatementModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  username: string
}

export default function ClientAccountStatementModal({
  isOpen,
  onClose,
  userId,
  username
}: ClientAccountStatementModalProps) {
  const [showCashEntry, setShowCashEntry] = useState(true)
  const [showMarketPnl, setShowMarketPnl] = useState(true)
  const [showMarketCommission, setShowMarketCommission] = useState(false)
  const [showSessionPnl, setShowSessionPnl] = useState(false)
  const [showTossPnl, setShowTossPnl] = useState(false)
  const [betsPopoverIdx, setBetsPopoverIdx] = useState<number | null>(null)
  const [portalMounted, setPortalMounted] = useState(false)

  useEffect(() => {
    setPortalMounted(true)
  }, [])

  // Use lazy query for manual triggering
  const [triggerQuery, { data: statementData, isLoading, error, reset }] = useLazyGetUserQuery()

  // Build query params for statement (userId passed to fetch specific user's statement)
  const queryParams = useMemo(() => {
    if (!userId) return null
    
    const params: any = {
      type: 'statement',
      userId,
      showCashEntry: showCashEntry.toString(),
      showMarketPnl: showMarketPnl.toString(),
      showMarketCommission: showMarketCommission.toString(),
      showSessionPnl: showSessionPnl.toString(),
      showTossPnl: showTossPnl.toString()
    }
    return params
  }, [userId, showCashEntry, showMarketPnl, showMarketCommission, showSessionPnl, showTossPnl])

  // Track previous userId to detect changes
  const prevUserIdRef = useRef<string | null>(null)

  // Trigger query when modal opens or userId/filters change
  useEffect(() => {
    if (isOpen && userId && queryParams) {
      // If userId changed, reset first to clear old data
      if (prevUserIdRef.current !== null && prevUserIdRef.current !== userId) {
        reset()
      }
      prevUserIdRef.current = userId
      
      // Trigger query with fresh params
      triggerQuery(queryParams, true) // forceRefetch = true to bypass cache
    }
  }, [isOpen, userId, queryParams, triggerQuery, reset])

  // Reset data when modal closes or userId changes
  useEffect(() => {
    if (!isOpen) {
      reset()
      prevUserIdRef.current = null
    }
  }, [isOpen, reset])

  // Extract user info, cash history, and statement/bet history from response
  // Supports new format: { success, user: { id, openingBalance }, statement, pagination }
  // API returns array of [{ success, user, statement, pagination }, ...] - find the one matching userId
  const { userInfo, cashTransactions, statementTransactions } = useMemo(() => {
    if (!statementData || !userId) return { userInfo: null, cashTransactions: [], statementTransactions: [] }
    
    // New format: array of [{ success, user, statement, pagination }] - find matching user
    const items = Array.isArray(statementData) ? statementData : (statementData?.data && Array.isArray(statementData.data) ? statementData.data : [statementData])
    const resolved = items.find((item: any) => (item?.user?.id ?? item?.data?.user?.id) === userId)
    const data = resolved?.data || resolved
    
    if (resolved?.success && resolved?.user && Array.isArray(resolved?.statement)) {
      const u = resolved.user
      if (u.id !== userId) return { userInfo: null, cashTransactions: [], statementTransactions: [] }

      const sortByNewestDate = (a: any, b: any) => {
        const aDate = new Date(a?.latestSettledAt ?? a?.date ?? a?.createdAt ?? 0).getTime()
        const bDate = new Date(b?.latestSettledAt ?? b?.date ?? b?.createdAt ?? 0).getTime()
        return bDate - aDate
      }
      const statementRows = (Array.isArray(resolved.statement) ? [...resolved.statement] : []).sort(sortByNewestDate)
      const cashRows = (Array.isArray(resolved.transactions) ? [...resolved.transactions] : []).sort(sortByNewestDate)

      return {
        userInfo: {
          id: u.id,
          name: u.name || username,
          username: u.username || username,
          openingBalance: u.openingBalance,
          balance: u.balance ?? u.openingBalance,
          availableBalance: u.availableBalance ?? u.balance ?? u.openingBalance
        },
        cashTransactions: cashRows,
        statementTransactions: statementRows
      }
    }
    
    // Legacy: array of user objects
    if (Array.isArray(statementData) && statementData.length > 0) {
      const userData = statementData.find((u: any) => u.id === userId) || statementData[0]
      if (userData.id !== userId) return { userInfo: null, cashTransactions: [], statementTransactions: [] }
      return {
        userInfo: userData,
        cashTransactions: [],
        statementTransactions: userData.transactions || []
      }
    }
    
    // Legacy: statementData.data
    if (statementData.data) {
      const d = statementData.data
      if (Array.isArray(d)) {
        const userData = d.find((u: any) => u.id === userId) || d[0]
        if (userData?.id !== userId) return { userInfo: null, cashTransactions: [], statementTransactions: [] }
        return {
          userInfo: userData,
          cashTransactions: [],
          statementTransactions: userData.transactions || []
        }
      }
      if (d.user && d.statement) {
        if (d.user.id !== userId) return { userInfo: null, cashTransactions: [], statementTransactions: [] }
        return {
          userInfo: {
            ...d.user,
            balance: d.user.balance ?? d.user.openingBalance,
            availableBalance: d.user.availableBalance ?? d.user.balance ?? d.user.openingBalance
          },
          cashTransactions: Array.isArray(d.transactions) ? d.transactions : [],
          statementTransactions: d.statement
        }
      }
      
      if (d.id === userId) {
        return {
          userInfo: d,
          cashTransactions: [],
          statementTransactions: d.transactions || []
        }
      }
    }
    
    // Legacy: single user object
    if (statementData.transactions && statementData.id === userId) {
      return {
        userInfo: statementData,
        cashTransactions: [],
        statementTransactions: statementData.transactions
      }
    }
    
      return { userInfo: null, cashTransactions: [], statementTransactions: [] }
  }, [statementData, userId, username])

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return ''
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return ''
    return numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Derive type from description: "Match Odds" -> MATCH, "Normal" -> SESSION
  const getStatementType = (description: string) => {
    const d = (description || '').toLowerCase()
    if (d.includes('match odds') || d.includes('match com')) return 'MATCH'
    if (d.includes('normal') || d.includes('fancy') || d.includes('session')) return 'SESSION'
    return d.includes('match') ? 'MATCH' : 'SESSION'
  }

  /** cashIn, Cash In, cash_in → CASHIN */
  const normalizeTypeKey = (raw: string | undefined | null) =>
    String(raw ?? '')
      .replace(/[\s_-]+/g, '')
      .toUpperCase()

  /** TOPUP / TOPDOWN / cash types / description — not waiting on decisionRun */
  const isCashTransferTransaction = (transaction: any) => {
    const tt = String(transaction?.transferType ?? '').toUpperCase()
    if (tt === 'TOPUP' || tt === 'TOPDOWN') return true
    const key = normalizeTypeKey(transaction?.type)
    if (key === 'CASHIN' || key === 'CASHOUT') return true
    const d = String(transaction?.description ?? '').toLowerCase()
    if (d.includes('cash in') || d.includes('cash out')) return true
    return false
  }

  const inferCashTypeLabel = (transaction: any) => {
    if (transaction?.type) return String(transaction.type)
    const tt = String(transaction?.transferType ?? '').toUpperCase()
    if (tt === 'TOPUP') return 'cashIn'
    if (tt === 'TOPDOWN') return 'cashOut'
    const dl = String(transaction?.description ?? '').toLowerCase()
    if (dl.includes('cash in')) return 'cashIn'
    if (dl.includes('cash out')) return 'cashOut'
    return '-'
  }

  const resolveStatementTypeVal = (transaction: any) => {
    if (transaction?.type) return String(transaction.type)
    const tt = String(transaction?.transferType ?? '').toUpperCase()
    if (tt === 'TOPUP') return 'cashIn'
    if (tt === 'TOPDOWN') return 'cashOut'
    const dl = String(transaction?.description ?? '').toLowerCase()
    if (dl.includes('cash in')) return 'cashIn'
    if (dl.includes('cash out')) return 'cashOut'
    return getStatementType(transaction?.description || '')
  }

  const getTypeColor = (
    type: string | undefined,
    transferType?: string,
    description?: string
  ) => {
    const tt = String(transferType ?? '').toUpperCase()
    if (tt === 'TOPUP') return 'bg-[#170C79] text-white'
    if (tt === 'TOPDOWN') return 'bg-[#FF4B4B] text-white'

    let key = normalizeTypeKey(type)
    if (!key) {
      const dl = String(description ?? '').toLowerCase()
      if (dl.includes('cash in')) key = 'CASHIN'
      else if (dl.includes('cash out')) key = 'CASHOUT'
    }

    if (key === 'MATCH') return 'bg-green-600 text-white'
    if (key === 'SESSION') return 'bg-amber-800 text-white'
    if (key === 'CASHIN') return 'bg-[#170C79] text-white'
    if (key === 'CASHOUT') return 'bg-[#FF4B4B] text-white'
    return 'bg-gray-600 text-white'
  }

  const getStatusColor = (status: string) => {
    const statusUpper = status?.toUpperCase() || ''
    if (statusUpper === 'WON') return 'bg-green-100 text-green-700'
    if (statusUpper === 'LOST') return 'bg-red-100 text-red-700'
    if (statusUpper === 'PENDING') return 'bg-yellow-100 text-yellow-700'
    if (statusUpper === 'TOPUP') return 'bg-[#170C79] text-white'
    if (statusUpper === 'TOPDOWN') return 'bg-[#FF4B4B] text-white'
    return 'bg-gray-100 text-gray-700'
  }

  const getBetTypeColor = (betType: string) => {
    const betTypeUpper = betType?.toUpperCase() || ''
    if (betTypeUpper === 'BACK') return 'bg-blue-100 text-blue-700'
    if (betTypeUpper === 'LAY') return 'bg-pink-100 text-pink-700'
    return 'bg-gray-100 text-gray-700'
  }

  const getNetWinLossValue = (transaction: any) => {
    // Wallet cash rows: do not use generic `amount` as a positive bet win (often withdrawal size or balance).
    if (isCashTransferTransaction(transaction)) {
      const debit = Number(transaction?.debit)
      const credit = Number(transaction?.credit)
      if (Number.isFinite(debit) && debit > 0) return -Math.abs(debit)
      if (Number.isFinite(credit) && credit > 0) return Math.abs(credit)

      const netPnl = Number(transaction?.netPnl)
      if (Number.isFinite(netPnl) && netPnl !== 0) return netPnl

      const netWl = Number(transaction?.netWinLoss)
      if (Number.isFinite(netWl) && netWl !== 0) return netWl

      const tt = String(transaction?.transferType ?? '').toUpperCase()
      const key = normalizeTypeKey(transaction?.type)
      const desc = String(transaction?.description ?? '').toLowerCase()
      const isOut =
        tt === 'TOPDOWN' || key === 'CASHOUT' || desc.includes('cash out')
      const isIn = tt === 'TOPUP' || key === 'CASHIN' || desc.includes('cash in')

      const rawAmt = Number(transaction?.amount)
      if (Number.isFinite(rawAmt) && rawAmt !== 0) {
        if (isOut) return -Math.abs(rawAmt)
        if (isIn) return Math.abs(rawAmt)
      }

      return 0
    }

    const winBets = Array.isArray(transaction?.winBets) ? transaction.winBets : []
    const winBetsAmount = winBets.reduce((sum: number, bet: any) => {
      const amount = Number(bet?.amount)
      return Number.isFinite(amount) ? sum + amount : sum
    }, 0)

    const lossBets = Array.isArray(transaction?.lossBets) ? transaction.lossBets : []
    const lossBetsAmount = lossBets.reduce((sum: number, bet: any) => {
      const amount = Number(bet?.amount)
      return Number.isFinite(amount) ? sum + amount : sum
    }, 0)

    // If summary arrays are present, trust them first.
    if (lossBetsAmount > 0) return -lossBetsAmount
    if (winBetsAmount > 0) return winBetsAmount

    const win = Number(transaction?.win)
    if (Number.isFinite(win) && win > 0) return win

    const loss = Number(transaction?.loss)
    if (Number.isFinite(loss) && loss > 0) return -loss

    const bets = Array.isArray(transaction?.bets) ? transaction.bets : []
    const betPnlTotal = bets.reduce((sum: number, bet: any) => {
      const pnl = Number(bet?.pnl)
      return Number.isFinite(pnl) ? sum + pnl : sum
    }, 0)
    if (betPnlTotal !== 0) return betPnlTotal

    const primaryCandidates = [transaction?.netWinLoss, transaction?.netPnl, transaction?.amount]
    for (const candidate of primaryCandidates) {
      const value = Number(candidate)
      if (Number.isFinite(value) && value !== 0) return value
    }

    return 0
  }

  const isTransactionPending = (transaction: any) => {
    if (isCashTransferTransaction(transaction)) {
      const result = String(transaction?.result || '').toLowerCase()
      const status = String(transaction?.status || '').toLowerCase()
      return result === 'pending' || status === 'pending'
    }

    const result = String(transaction?.result || '').toLowerCase()
    const status = String(transaction?.status || '').toLowerCase()
    if (result === 'pending' || status === 'pending') return true
    if (transaction?.decisionRun === null || transaction?.decisionRun === undefined) return true

    const bets = Array.isArray(transaction?.bets) ? transaction.bets : []
    if (bets.length > 0) {
      return bets.every((bet: any) => String(bet?.status || '').toUpperCase() === 'PENDING')
    }

    return false
  }

  if (!isOpen || !portalMounted) return null

  return createPortal(
    <div className="fixed inset-0 bg-gray-500/50 z-[100] flex items-start sm:items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-full sm:max-w-6xl max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col min-h-0 overflow-hidden my-auto">
        {/* Header — always visible above scrollable table */}
        <div className="bg-black text-white px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 flex items-center justify-between flex-shrink-0 rounded-t-lg">
          <h2 className="text-xs sm:text-sm md:text-base font-bold">Client Account Statement</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 p-1 text-white hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Filters - match screenshot layout */}
        <div className="p-2 sm:p-3 md:p-4 border-b bg-gray-50 overflow-x-auto flex-shrink-0">
          <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 items-center min-w-max">
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showCashEntry && showMarketPnl}
                onChange={(e) => { setShowCashEntry(e.target.checked); setShowMarketPnl(e.target.checked) }}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Show Cash Entry &amp; Market Profit &amp; Loss</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showCashEntry}
                onChange={(e) => setShowCashEntry(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Show Cash Entry</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showMarketCommission}
                onChange={(e) => setShowMarketCommission(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Market Commision</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showSessionPnl}
                onChange={(e) => setShowSessionPnl(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Session Profit &amp; Loss</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showTossPnl}
                onChange={(e) => setShowTossPnl(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Toss Profit &amp; Loss</span>
            </label>
            <label className="flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showMarketPnl}
                onChange={(e) => setShowMarketPnl(e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 text-[#00A66E] border-gray-300 rounded focus:ring-[#00A66E]"
              />
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">Market Profit &amp; Loss</span>
            </label>
          </div>
        </div>

        {/* User Info */}
        {userInfo && (
          <div className="p-2 sm:p-3 md:p-4 bg-gray-50 border-b flex-shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs md:text-sm">
              <div className="truncate">
                <span className="text-gray-600">Name:</span>
                <span className="ml-1 sm:ml-2 font-bold truncate block">{userInfo.name || username}</span>
              </div>
              <div className="truncate">
                <span className="text-gray-600">User:</span>
                <span className="ml-1 sm:ml-2 font-bold truncate block">{userInfo.username || username}</span>
              </div>
              <div className="truncate">
                <span className="text-gray-600">Opening Balance:</span>
                <span className="ml-1 sm:ml-2 font-bold truncate block">{formatCurrency(userInfo.openingBalance ?? userInfo.balance)}</span>
              </div>
              <div className="truncate">
                <span className="text-gray-600">Balance:</span>
                <span className="ml-1 sm:ml-2 font-bold truncate block">{formatCurrency(userInfo.balance ?? userInfo.availableBalance)}</span>
              </div>
              <div className="truncate">
                <span className="text-gray-600">Available Balance:</span>
                <span className="ml-1 sm:ml-2 font-bold truncate block">{formatCurrency(userInfo.availableBalance ?? userInfo.balance)}</span>
              </div>
            </div>
          </div>
        )}

        {/* One scroll area for Transaction History + Statement (single screen, single scrollbar) */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto overscroll-contain border-t border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 sm:py-8 md:py-12">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 animate-spin text-[#00A66E]" />
              <span className="ml-2 sm:ml-3 text-[10px] sm:text-xs md:text-sm text-gray-600">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-6 sm:py-8 md:py-12">
              <div className="text-center">
                <p className="text-red-600 mb-2 text-xs sm:text-sm md:text-base">Error loading statement</p>
                <button
                  onClick={() => queryParams && triggerQuery(queryParams)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base bg-[#00A66E] text-white rounded hover:bg-[#00b97b]"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              {cashTransactions.length > 0 && (
                <div className="border-b border-gray-200">
                  <div className="px-2 sm:px-3 md:px-4 py-2 bg-gray-100 text-[10px] sm:text-xs md:text-sm font-bold text-gray-700 border-b border-gray-200">
                    Transaction History
                  </div>
                  <table className="w-full text-[10px] sm:text-xs md:text-sm min-w-[520px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-bold text-gray-700">Date</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-bold text-gray-700">Type</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 text-left font-bold text-gray-700">Description</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 text-right font-bold text-gray-700">Credit</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 text-right font-bold text-gray-700">Debit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {cashTransactions.map((transaction: any, idx: number) => (
                        <tr key={transaction.id || idx} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-3 md:px-4 py-2 text-gray-900 whitespace-nowrap">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-2 sm:px-3 md:px-4 py-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${getTypeColor(
                                transaction.type,
                                transaction.transferType,
                                transaction.description
                              )}`}
                            >
                              {inferCashTypeLabel(transaction)}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 md:px-4 py-2 text-gray-700">
                            {transaction.description || '-'}
                          </td>
                          <td className={`px-2 sm:px-3 md:px-4 py-2 text-right font-bold whitespace-nowrap ${
                            Number(transaction.credit) > 0 ? 'text-[#170C79]' : 'text-gray-500'
                          }`}>
                            {Number(transaction.credit) > 0 ? formatCurrency(transaction.credit) : '-'}
                          </td>
                          <td className={`px-2 sm:px-3 md:px-4 py-2 text-right font-bold whitespace-nowrap ${
                            Number(transaction.debit) > 0 ? 'text-[#FF4B4B]' : 'text-gray-500'
                          }`}>
                            {Number(transaction.debit) > 0 ? formatCurrency(transaction.debit) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div>
                <div className="px-2 sm:px-3 md:px-4 py-2 bg-gray-100 text-[10px] sm:text-xs md:text-sm font-bold text-gray-700 border-b border-gray-200">
                  Statement &amp; market history
                </div>
                <table className="w-full text-[10px] sm:text-xs md:text-sm min-w-[640px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left font-bold text-gray-700">Date</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left font-bold text-gray-700">Type</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left font-bold text-gray-700">Description</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left font-bold text-gray-700">Win / Loss</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right font-bold text-gray-700">Decision Run</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right font-bold text-gray-700">Running Balance</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center font-bold text-gray-700">Bets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {statementTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      statementTransactions.map((transaction: any, idx: number) => {
                        const balance = transaction.runningBalance ?? transaction.balance
                        const dateVal = transaction.latestSettledAt ?? transaction.date ?? transaction.createdAt
                        const typeVal = resolveStatementTypeVal(transaction)
                        const transferTypeUpper = String(transaction.transferType ?? '').toUpperCase()
                        const typeKey = normalizeTypeKey(typeVal)

                        return (
                          <tr key={transaction.marketId + '-' + transaction.selectionId + '-' + idx || idx} className="hover:bg-gray-50">
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-900 whitespace-nowrap">
                              {formatDate(dateVal)}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                              <span
                                className={`px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold ${getTypeColor(
                                  typeVal,
                                  transaction.transferType,
                                  transaction.description
                                )}`}
                              >
                                {typeVal || '-'}
                              </span>
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-700 max-w-[120px] sm:max-w-[200px] truncate" title={transaction.description || '-'}>
                              {transaction.description || transaction.desc || '-'}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                              {(() => {
                                const netWinLoss = getNetWinLossValue(transaction)
                                const descLower = String(transaction.description || '')
                                const isCashIn =
                                  transferTypeUpper === 'TOPUP' ||
                                  typeKey === 'CASHIN' ||
                                  /cash\s*in/i.test(descLower)
                                const isCashOut =
                                  transferTypeUpper === 'TOPDOWN' ||
                                  typeKey === 'CASHOUT' ||
                                  /cash\s*out/i.test(descLower)

                                if (netWinLoss === 0 && isCashTransferTransaction(transaction)) {
                                  const debit = Number(transaction.debit)
                                  const credit = Number(transaction.credit)
                                  if (isCashOut && debit > 0) {
                                    return (
                                      <span className="font-bold text-[#FF4B4B] whitespace-nowrap">
                                        {formatCurrency(debit)}
                                      </span>
                                    )
                                  }
                                  if (isCashIn && credit > 0) {
                                    return (
                                      <span className="font-bold text-[#170C79] whitespace-nowrap">
                                        {formatCurrency(credit)}
                                      </span>
                                    )
                                  }
                                }

                                if (netWinLoss === 0 && isTransactionPending(transaction)) {
                                  return <span className="font-semibold text-amber-600 whitespace-nowrap">Pending</span>
                                }
                                // Cash out must never show as "Win:" (API may send positive amount / balance in amount)
                                if (isCashOut && netWinLoss > 0) {
                                  const debit = Number(transaction.debit)
                                  const displayAmt = Number.isFinite(debit) && debit > 0 ? debit : Math.abs(netWinLoss)
                                  return (
                                    <span className="font-bold text-[#FF4B4B] whitespace-nowrap">
                                      {formatCurrency(displayAmt)}
                                    </span>
                                  )
                                }
                                if (netWinLoss > 0) {
                                  if (isCashIn) {
                                    return (
                                      <span className="font-bold text-[#170C79] whitespace-nowrap">
                                        {formatCurrency(Math.abs(netWinLoss))}
                                      </span>
                                    )
                                  }
                                  return (
                                    <span className="font-bold text-green-600 whitespace-nowrap">
                                      Win: {formatCurrency(Math.abs(netWinLoss))}
                                    </span>
                                  )
                                }
                                if (netWinLoss < 0) {
                                  if (isCashOut) {
                                    return (
                                      <span className="font-bold text-[#FF4B4B] whitespace-nowrap">
                                        {formatCurrency(Math.abs(netWinLoss))}
                                      </span>
                                    )
                                  }
                                  return (
                                    <span className="font-bold text-red-600 whitespace-nowrap">
                                      Loss: {formatCurrency(Math.abs(netWinLoss))}
                                    </span>
                                  )
                                }
                                return <span className="text-gray-500">-</span>
                              })()}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right font-bold whitespace-nowrap text-blue-600">
                              {transaction.decisionRun}
                            </td>
                            <td className={`px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right font-bold whitespace-nowrap ${
                              typeof balance === 'number' && balance < 0 ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {balance === null || balance === undefined || balance === '' ? '-' : formatCurrency(balance)}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center">
                              <button
                                type="button"
                                onClick={() => setBetsPopoverIdx(betsPopoverIdx === idx ? null : idx)}
                                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[9px] sm:text-[10px] font-bold rounded transition-colors"
                              >
                                Bets
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Bets detail modal - shows all bets for this marketId */}
        {betsPopoverIdx !== null && statementTransactions[betsPopoverIdx] && (
          <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4" onClick={() => setBetsPopoverIdx(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">
                  Bets for Market ID: {statementTransactions[betsPopoverIdx]?.marketId || '—'}
                </h3>
                <button onClick={() => setBetsPopoverIdx(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {(statementTransactions[betsPopoverIdx]?.bets || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No bets for this entry</p>
                ) : (
                  <div className="space-y-3">
                    {(statementTransactions[betsPopoverIdx]?.bets || []).map((bet: any, bi: number) => (
                      <div key={bet.id || bi} className="text-xs p-2 bg-gray-50 rounded border border-gray-100">
                        <span className={`px-2 py-0.5 rounded font-bold ${getBetTypeColor(bet.betType)}`}>{bet.betType}</span>
                        <div className="mt-1.5 grid grid-cols-2 gap-1 text-gray-700">
                          <span className="col-span-2">Bet Name: {bet.betName || '-'}</span>
                          <span className="col-span-2">Time: {formatDate(bet.time)}</span>
                          <span>Odds: {bet.odds}</span>
                          <span>Stake: {formatCurrency(bet.stake)}</span>
                          <span>P/L: <span className={bet.pnl >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{formatCurrency(bet.pnl)}</span></span>
                          <span>Status: {bet.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

