"use client"

import { useState, useMemo } from "react"
import { Calendar, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"
import { useGetAccountStatementQuery } from "@/app/services/Api"

export function AccountStatementView() {
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [type, setType] = useState("All")

  // Fetch account statement
  const { data: accountData, isLoading, error, refetch } = useGetAccountStatementQuery(
    {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      type: type !== "All" ? type : undefined
    },
    { skip: false }
  )

  // Extract data from response
  const statementData = useMemo(() => {
    if (!accountData) return null
    return {
      openingBalance: accountData.openingBalance || 0,
      closingBalance: accountData.closingBalance || 0,
      total: accountData.total || 0,
      transactions: accountData.transactions || []
    }
  }, [accountData])

  // Filter transactions by type
  const filteredTransactions = useMemo(() => {
    if (!statementData) return []
    if (type === "All") return statementData.transactions
    return statementData.transactions.filter((t: any) => 
      t.type?.toUpperCase() === type.toUpperCase()
    )
  }, [statementData, type])

  const handleLoad = () => {
    refetch()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return ''
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return ''
    return numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-black text-white px-4 py-1">
        <h1 className="text-base font-normal">Account Statement</h1>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 sm:p-6 shadow-sm border-b">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* From Date */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Choose from Date</label>
            <div className="relative">
              <Input
                type="text"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40 pr-8"
                placeholder="04/10/2025"
              />
              <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* To Date */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Choose to Date</label>
            <div className="relative">
              <Input
                type="text"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-40 pr-8"
                placeholder="11/10/2025"
              />
              <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A66E] focus:border-transparent"
            >
              <option value="All">All</option>
              <option value="Deposit">Deposit</option>
              <option value="Withdraw">Withdraw</option>
              <option value="Commission">Commission</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleLoad}
              className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-4 py-2"
            >
              Load
            </Button>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Balance Summary */}
      {statementData && (
        <div className="bg-gray-50 px-4 py-3 border-b flex gap-6 text-sm">
          <div>
            <span className="text-gray-600 font-medium">Opening Balance: </span>
            <span className="font-bold text-gray-900">Rs {formatCurrency(statementData.openingBalance)}</span>
          </div>
          <div>
            <span className="text-gray-600 font-medium">Closing Balance: </span>
            <span className="font-bold text-gray-900">Rs {formatCurrency(statementData.closingBalance)}</span>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white mx-0 sm:mx-0 shadow-sm rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Sr No.
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Credit
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Debit
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#00A66E]" />
                    <p className="text-gray-500 mt-2">Loading account statement...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-red-500">
                    Error loading account statement. Please try again.
                  </td>
                </tr>
              ) : !statementData || filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {transaction.description || 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-green-600">
                      {transaction.credit > 0 ? `Rs ${formatCurrency(transaction.credit)}` : ''}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-red-600">
                      {transaction.debit > 0 ? `Rs ${formatCurrency(transaction.debit)}` : ''}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {transaction.commission > 0 ? `Rs ${formatCurrency(transaction.commission)}` : 'Rs 0.00'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 font-medium">
                      Rs {formatCurrency(transaction.balance)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        transaction.type === 'TOPUP' 
                          ? 'bg-green-100 text-green-800'
                          : transaction.type === 'WITHDRAW'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.type || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {statementData && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-700">
                Total Transactions: {statementData.total}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
