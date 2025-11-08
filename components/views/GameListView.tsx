"use client"

import { useState } from "react"
import { DataTable } from "@/components/dashboardagent"
import { Search, Filter } from "lucide-react"

export default function GameListView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = ["All", "Aviator", "Indian Poker", "Casino", "Evolution"]

  return (
    <div className="bg-gray-100">
      <div className="p-4 sm:p-6">
        {/* Header with Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A66E] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A66E] focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat.toLowerCase()} value={cat.toLowerCase()}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Game List Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Game List</h2>
          </div>
          <div className="p-4">
            <DataTable
              title="GAMES"
              columns={[
                { key: 'name', label: 'Game Name', align: 'left' },
                { key: 'category', label: 'Category', align: 'left' },
                { key: 'status', label: 'Status', align: 'center' },
                { key: 'players', label: 'Active Players', align: 'right' },
                { key: 'revenue', label: 'Revenue', align: 'right' }
              ]}
              data={[]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
