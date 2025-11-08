"use client"

import { useState } from "react"
import { SummaryCard, DataTable, DateFilter } from "@/components/dashboardagent"
import { Download, FileText } from "lucide-react"

export default function DetailReportView() {
  const [fromDate, setFromDate] = useState("11/10/2025")
  const [toDate, setToDate] = useState("11/10/2025")
  const [selectedReport, setSelectedReport] = useState("all")

  const reportTypes = ["All", "Financial", "User Activity", "Game Performance", "Transactions"]

  const handleSubmit = () => {
    console.log("Submit clicked", { fromDate, toDate, selectedReport })
  }

  const handleReset = () => {
    setFromDate("11/10/2025")
    setToDate("11/10/2025")
    setSelectedReport("all")
  }

  const handleExport = () => {
    console.log("Export report")
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
        {/* Report Type Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[#00A66E]" />
            <h2 className="text-lg font-semibold text-gray-900">Report Type</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {reportTypes.map((type) => (
              <button
                key={type.toLowerCase()}
                onClick={() => setSelectedReport(type.toLowerCase())}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedReport === type.toLowerCase()
                    ? "bg-[#00A66E] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <SummaryCard title="TOTAL TRANSACTIONS" value="0" color="green" />
          <SummaryCard title="TOTAL AMOUNT" value="0" color="blue" />
          <SummaryCard title="SUCCESSFUL" value="0" color="green" />
          <SummaryCard title="FAILED" value="0" color="red" />
        </div>

        {/* Report Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Detailed Report</h2>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-[#00A66E] hover:bg-[#00b97b] text-white font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          <div className="p-4">
            <DataTable
              title="REPORT DATA"
              columns={[
                { key: 'id', label: 'ID', align: 'left' },
                { key: 'date', label: 'Date', align: 'left' },
                { key: 'type', label: 'Type', align: 'left' },
                { key: 'amount', label: 'Amount', align: 'right' },
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
