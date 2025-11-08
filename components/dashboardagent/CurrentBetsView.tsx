"use client"

import { useState } from "react"
import { ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/utils/button"
import { Input } from "@/components/input"

export function CurrentBetsView() {
  const [betType, setBetType] = useState("MATCH")
  const [searchTerm, setSearchTerm] = useState("")

  const handleLoad = () => {
    console.log("Load clicked", { betType, searchTerm })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#00A66E] text-white px-4 py-3">
        <h1 className="text-lg font-bold">Current Bets</h1>
      </div>

      {/* Filter Section */}
      <div className="bg-purple-600 px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-white font-medium">Choose Type</span>
          <div className="relative">
            <select
              value={betType}
              onChange={(e) => setBetType(e.target.value)}
              className="appearance-none bg-white rounded px-3 py-2 pr-8 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-white focus:border-transparent"
            >
              <option value="MATCH">MATCH</option>
              <option value="LIVE">LIVE</option>
              <option value="FUTURE">FUTURE</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white px-4 py-4">
        <div className="relative">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search By UserName"
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
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  No Record Found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
