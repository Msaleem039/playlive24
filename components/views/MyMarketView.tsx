"use client"

import { useState } from "react"
import { SummaryCard, DataTable, DateFilter } from "@/components/dashboardagent"

export default function MyMarketView() {
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
          <SummaryCard title="TOTAL MARKET" value="0" color="green" />
          <SummaryCard title="ACTIVE MARKET" value="0" color="blue" />
          <SummaryCard title="SETTLED MARKET" value="0" color="green" />
          <SummaryCard title="TOTAL VOLUME" value="0" color="black" />
        </div>

        {/* Market List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Market Overview</h2>
          </div>
          <div className="p-4">
            <DataTable
              title="MARKET LIST"
              columns={[
                { key: 'market', label: 'Market', align: 'left' },
                { key: 'sport', label: 'Sport', align: 'left' },
                { key: 'volume', label: 'Volume', align: 'right' },
                { key: 'status', label: 'Status', align: 'center' }
              ]}
              data={[]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
