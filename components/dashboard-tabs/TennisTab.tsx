"use client"

import { Zap } from "lucide-react"

export default function TennisTab() {
  return (
    <div className="bg-white">
      {/* Sport Header */}
      <div className="bg-[#00A66E] text-white px-4 py-3 font-bold flex items-center justify-between">
        <span className="text-lg sm:text-xl">Tennis</span>
      </div>

      {/* No Data Found */}
      <div className="flex items-center justify-center py-16 px-4">
        <div className="text-center">
          <Zap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No Tennis Matches</h3>
          <p className="text-sm sm:text-base text-gray-500 max-w-md">
            No tennis matches are currently available. Check back later for live matches and upcoming games.
          </p>
        </div>
      </div>
    </div>
  )
}