"use client"

import { useState } from "react"
import { Calendar, Download } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"

export function AccountStatementView() {
  const [fromDate, setFromDate] = useState("04/10/2025")
  const [toDate, setToDate] = useState("11/10/2025")
  const [type, setType] = useState("All")

  const accountData = [
    {
      srNo: "1",
      description: "Closing Balance",
      credit: "",
      debit: "",
      commission: "0.00",
      points: "20,000.00",
      date: "",
      reference: ""
    },
    {
      srNo: "2",
      description: "Cash Deposit [Settlement]",
      credit: "15,000.00",
      debit: "0.00",
      commission: "0.00",
      points: "5,000.00",
      date: "08-10-2025 10:20:27 am",
      reference: "Parent"
    }
  ]

  const handleLoad = () => {
    console.log("Load clicked", { fromDate, toDate, type })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#00A66E] text-white px-4 py-3">
        <h1 className="text-lg font-bold">Account Statement</h1>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 sm:p-6 shadow-sm">
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

      {/* Data Table */}
      <div className="bg-white mx-4 sm:mx-6 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Sr No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Discription
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Credit
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Debit
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accountData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.srNo}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.description}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                    {row.credit}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                    {row.debit}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                    {row.commission}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                    {row.points}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.date}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.reference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-700">Total Counts: 1</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Items per page:</span>
              <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                <option value={25}>25</option>
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 text-sm">
              &lt;&lt; Pre
            </Button>
            <Button className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-3 py-1 text-sm">
              1
            </Button>
            <Button className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 text-sm">
              Next &gt;&gt;
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
