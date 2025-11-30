"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"

export function SettlementSummaryView() {
  const [searchTerm, setSearchTerm] = useState("")

  const settlementData = [
    {
      srNo: "1",
      name: "Online70",
      description: "Settlement",
      amount: "15,000.00",
      remarks: "Settlement",
      date: "08-10-2025 10:20:27 am"
    },
    {
      srNo: "2",
      name: "Online70",
      description: "Settlement",
      amount: "5,000.00",
      remarks: "Settlement",
      date: "18-09-2025 8:53:12 pm"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#00A66E] text-white px-4 py-3">
        <h1 className="text-lg font-bold">Settlement Summary</h1>
      </div>

      {/* Purple Bar */}
      {/* <div className="bg-purple-600 h-2"></div> */}

      {/* Search Section */}
      <div className="bg-white px-4 py-4">
        <div className="relative">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Username Search"
            className="w-full pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settlementData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.srNo}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-purple-600">
                    {row.description}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                    {row.amount}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-purple-600">
                    {row.remarks}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">Total Counts: {settlementData.length}</span>
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
      </div>
    </div>
  )
}
