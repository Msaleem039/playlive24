"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import MatchCard from "./MatchCard"
import { CricketMatch } from "@/lib/types/cricket"

interface SportsSectionProps {
  sport: string
  matches: CricketMatch[]
  showViewMore?: boolean
}

export default function SportsSection({ sport, matches, showViewMore = true }: SportsSectionProps) {
  const [showAll, setShowAll] = useState(false)
  const displayMatches = showAll ? matches : matches.slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
    >
      {/* Header */}
      <div className="bg-[#00A66E] text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{sport}</h3>
          <div className="flex items-center gap-2">
            <button className="bg-white/20 text-white text-xs px-2 py-1 rounded hover:bg-white/30 transition-colors">
              BM
            </button>
            <button className="bg-white/20 text-white text-xs px-2 py-1 rounded hover:bg-white/30 transition-colors">
              F
            </button>
            <button className="bg-white/20 text-white text-xs px-2 py-1 rounded hover:bg-white/30 transition-colors">
              F
            </button>
          </div>
        </div>
      </div>

      {/* Matches List */}
      <div className="divide-y divide-gray-200">
        {displayMatches.length > 0 ? (
          displayMatches.map((match, index) => (
            <MatchCard key={match.match_id} match={match} sport={sport} />
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            No matches available
          </div>
        )}
      </div>

      {/* View More Button */}
      {showViewMore && matches.length > 5 && (
        <div className="p-4 text-right">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[#00A66E] hover:text-[#008a5a] font-medium text-sm transition-colors"
          >
            {showAll ? "Show Less" : "View More..."}
          </button>
        </div>
      )}
    </motion.div>
  )
}
