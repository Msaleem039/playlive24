"use client"

import { useState } from "react"
import { SummaryCard, DataTable, DateFilter } from "@/components/dashboardagent"
import { Coins, TrendingUp, TrendingDown } from "lucide-react"

export default function ChipSummaryView() {
  const [fromDate, setFromDate] = useState("11/10/2025")
  const [toDate, setToDate] = useState("11/10/2025")

  const handleSubmit = () => {
    console.log("Submit clicked", { fromDate, toDate })
  }

  const handleReset = () => {
    setFromDate("11/10/2025")
    setToDate("11/10/2025")
  }

  return (
    <div className="bg-gray-100">
      {/* Date Filter Section */}
      <DateFilter
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <SummaryCard title="TOTAL CHIPS ISSUED" value="0" color="green" />
          <SummaryCard title="TOTAL CHIPS REDEEMED" value="0" color="red" />
          <SummaryCard title="OUTSTANDING CHIPS" value="0" color="blue" />
          <SummaryCard title="CHIP VALUE" value="0" color="black" />
        </div>

        {/* Chip Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <DataTable
            title="CHIP ISSUANCE"
            columns={[
              { key: 'user', label: 'User', align: 'left' },
              { key: 'amount', label: 'Amount', align: 'right' },
              { key: 'date', label: 'Date', align: 'left' }
            ]}
            data={[]}
          />
          <DataTable
            title="CHIP REDEMPTION"
            columns={[
              { key: 'user', label: 'User', align: 'left' },
              { key: 'amount', label: 'Amount', align: 'right' },
              { key: 'date', label: 'Date', align: 'left' }
            ]}
            data={[]}
          />
        </div>

        {/* Chip Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-[#00A66E]" />
            <h2 className="text-lg font-semibold text-gray-900">Chip Overview</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Active Chip Holders</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Pending Redemptions</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
