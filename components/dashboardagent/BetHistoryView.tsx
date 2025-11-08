"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"

export function BetHistoryView() {
  const [userName, setUserName] = useState("None")
  const [selectedSport, setSelectedSport] = useState("All")
  const [selectedMarket, setSelectedMarket] = useState("All")
  const [betType, setBetType] = useState("All")
  const [activeTab, setActiveTab] = useState("Current")

  const handleLoad = () => {
    console.log("Load clicked", { userName, selectedSport, selectedMarket, betType })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#00A66E] text-white px-4 py-3">
        <h1 className="text-lg font-bold">Bet History</h1>
      </div>

      {/* Filter Section */}
      <div className="bg-gray-600 px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* User Name */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-white text-sm font-medium whitespace-nowrap">User Name</label>
            <div className="relative">
              <Input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-32 pr-8"
                placeholder="None"
              />
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Select Sport */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-white text-sm font-medium whitespace-nowrap">Select Sport</label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A66E] focus:border-transparent"
            >
              <option value="All">All</option>
              <option value="Cricket">Cricket</option>
              <option value="Soccer">Soccer</option>
              <option value="Tennis">Tennis</option>
            </select>
          </div>

          {/* Select Market */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-white text-sm font-medium whitespace-nowrap">Select Makret</label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A66E] focus:border-transparent"
            >
              <option value="All">All</option>
              <option value="Match Winner">Match Winner</option>
              <option value="Over/Under">Over/Under</option>
            </select>
          </div>

          {/* Bet Type */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-white text-sm font-medium whitespace-nowrap">Bet-Type</label>
            <select
              value={betType}
              onChange={(e) => setBetType(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-[#00A66E] focus:border-transparent"
            >
              <option value="All">All</option>
              <option value="Single">Single</option>
              <option value="Multiple">Multiple</option>
            </select>
          </div>

          {/* Load Button */}
          <Button
            onClick={handleLoad}
            className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-4 py-2"
          >
            Load
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab("Current")}
            className={`px-6 py-3 font-semibold ${
              activeTab === "Current" 
                ? "bg-[#00A66E] text-white" 
                : "text-white hover:bg-gray-700"
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setActiveTab("Past")}
            className={`px-6 py-3 font-semibold ${
              activeTab === "Past" 
                ? "bg-[#00A66E] text-white" 
                : "text-white hover:bg-gray-700"
            }`}
          >
            Past
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white mx-4 sm:mx-6 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Match Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Market Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Selection Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Odds
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Stack
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Exposure
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Bet Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Ip Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                  No Record Found
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Items per page:</span>
              <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-1 text-sm">
              &lt;&lt;&lt; Pre
            </Button>
            <Button className="bg-[#00A66E] hover:bg-[#00A66E]/90 text-white px-3 py-1 text-sm">
              1
            </Button>
            <Button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-1 text-sm">
              Next &gt;&gt;&gt;
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
