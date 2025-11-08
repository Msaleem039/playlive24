import React from 'react'
import { ChevronDown } from 'lucide-react'

interface SportsSelectorProps {
  selectedSport: string
  onSportChange: (sport: string) => void
  sports: string[]
  className?: string
}

export function SportsSelector({ 
  selectedSport, 
  onSportChange, 
  sports,
  className = ""
}: SportsSelectorProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className="bg-black text-white px-4 py-2">
        <h3 className="font-semibold text-sm">SPORTS GAMEPLAY DETAILS</h3>
      </div>
      <div className="p-4">
        <div className="relative">
          <select
            value={selectedSport}
            onChange={(e) => onSportChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A66E]"
          >
            <option value="">Select Sports</option>
            {sports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  )
}
