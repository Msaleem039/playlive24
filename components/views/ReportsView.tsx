"use client"

import { useState } from "react"
import { SummaryCard, DataTable, DateFilter } from "@/components/dashboardagent"
import { FileText, Download, Eye } from "lucide-react"

export default function ReportsView() {
  const [fromDate, setFromDate] = useState("11/10/2025")
  const [toDate, setToDate] = useState("11/10/2025")
  const [selectedReport, setSelectedReport] = useState("summary")

  const reports = [
    { id: "summary", name: "Summary Report", description: "Overview of all activities" },
    { id: "financial", name: "Financial Report", description: "Revenue and expenses" },
    { id: "users", name: "User Report", description: "User activity and statistics" },
    { id: "games", name: "Games Report", description: "Game performance metrics" }
  ]

  const handleSubmit = () => {
    console.log("Generate report", { fromDate, toDate, selectedReport })
  }

  const handleReset = () => {
    setFromDate("11/10/2025")
    setToDate("11/10/2025")
    setSelectedReport("summary")
  }

  const handleExport = (reportId: string) => {
    console.log("Export report", reportId)
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
        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`bg-white rounded-lg shadow-sm border-2 p-4 cursor-pointer transition-all ${
                selectedReport === report.id
                  ? "border-[#00A66E] bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <FileText className={`w-6 h-6 ${selectedReport === report.id ? "text-[#00A66E]" : "text-gray-600"}`} />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExport(report.id)
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{report.name}</h3>
              <p className="text-xs text-gray-600">{report.description}</p>
            </div>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <SummaryCard title="TOTAL REPORTS" value="0" color="green" />
          <SummaryCard title="GENERATED TODAY" value="0" color="blue" />
          <SummaryCard title="PENDING" value="0" color="yellow" />
          <SummaryCard title="EXPORTED" value="0" color="black" />
        </div>

        {/* Report Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#00A66E]" />
              <h2 className="text-lg font-semibold text-gray-900">
                {reports.find(r => r.id === selectedReport)?.name || "Report Details"}
              </h2>
            </div>
            <button
              onClick={() => handleExport(selectedReport)}
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
                { key: 'status', label: 'Status', align: 'center' },
                { key: 'actions', label: 'Actions', align: 'center' }
              ]}
              data={[]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
