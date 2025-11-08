"use client"

import { useState } from "react"
import { 
  SummaryCard, 
  DataTable, 
  DateFilter, 
  SportsSelector
} from "@/components/dashboardagent"

export function MyReportView() {
  const [fromDate, setFromDate] = useState("11/10/2025")
  const [toDate, setToDate] = useState("11/10/2025")
  const [selectedSport, setSelectedSport] = useState("")

  const userCountData = [
    { role: "Client", count: 2 },
    { role: "Total Active Client", count: 0 }
  ]

  const sportsOptions = [
    "Cricket",
    "Soccer", 
    "Tennis",
    "Horse Racing",
    "Basketball"
  ]

  const handleSubmit = () => {
    console.log("Submit clicked", { fromDate, toDate })
  }

  const handleReset = () => {
    setFromDate("11/10/2025")
    setToDate("11/10/2025")
    setSelectedSport("")
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
        {/* Summary Cards - Top Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <SummaryCard title="TOTAL DEPOSIT" value="0" color="green" />
          <SummaryCard title="TOTAL WITHDRAW" value="0" color="red" />
          <SummaryCard title="CLIENT BALANCE" value="0" color="green" />
          <SummaryCard title="TOTAL EXPOSURE" value="0" color="black" />
        </div>

        {/* Summary Cards - Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <DataTable
            title="USER COUNT"
            columns={[
              { key: 'role', label: 'Role', align: 'left' },
              { key: 'count', label: 'Count', align: 'right' }
            ]}
            data={userCountData}
          />
          <DataTable
            title="TOP 5 WINNING PLAYER"
            columns={[
              { key: 'player', label: 'Player', align: 'left' },
              { key: 'amount', label: 'Amount', align: 'right' }
            ]}
            data={[]}
          />
          <DataTable
            title="TOP 5 LOSING PLAYER"
            columns={[
              { key: 'player', label: 'Player', align: 'left' },
              { key: 'amount', label: 'Amount', align: 'right' }
            ]}
            data={[]}
          />
        </div>

        {/* Summary Cards - Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <SportsSelector
            selectedSport={selectedSport}
            onSportChange={setSelectedSport}
            sports={sportsOptions}
          />
          <DataTable
            title="TOP 5 WINNING MARKETS"
            columns={[
              { key: 'sports', label: 'Sports', align: 'left' },
              { key: 'market', label: 'Market', align: 'left' },
              { key: 'amount', label: 'Amount', align: 'right' }
            ]}
            data={[]}
          />
          <DataTable
            title="TOP 5 LOSING MARKETS"
            columns={[
              { key: 'sports', label: 'Sports', align: 'left' },
              { key: 'market', label: 'Market', align: 'left' },
              { key: 'amount', label: 'Amount', align: 'right' }
            ]}
            data={[]}
          />
        </div>
      </div>
    </div>
  )
}
