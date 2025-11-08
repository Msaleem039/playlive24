"use client"

import { useState, useEffect } from "react"
import { Tv, Clock, Pin, Trophy } from "lucide-react"
import { CricketMatch } from "@/lib/types/cricket"

interface MatchRowProps {
  match: CricketMatch
  onMatchClick?: (matchId: number) => void
}

export default function MatchRow({ 
  match, 
  onMatchClick 
}: MatchRowProps) {
  const [dateStr, setDateStr] = useState("")
  const [timeStr, setTimeStr] = useState("")

  useEffect(() => {
    // Format date and time on client side only to avoid hydration issues
    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString)
        const day = date.getDate().toString().padStart(2, '0')
        const month = date.toLocaleDateString('en-GB', { month: 'short' })
        return `${day} ${month}`
      } catch {
        return dateString.split(' ')[0] // Fallback to just the date part
      }
    }

    const formatTime = (dateString: string) => {
      try {
        const date = new Date(dateString)
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
      } catch {
        return dateString.split(' ')[1]?.substring(0, 5) || '00:00' // Fallback
      }
    }

    setDateStr(formatDate(match.date_start_ist))
    setTimeStr(formatTime(match.date_start_ist))
  }, [match.date_start_ist])
  
  // Determine status
  const isLive = match.status === 1
  const isCompleted = match.status === 2
  const isUpcoming = match.status === 3
  
  // Get status display
  const getStatusDisplay = () => {
    if (isLive) return { text: "Live Now", color: "text-red-600", dot: "bg-red-500" }
    if (isCompleted) return { text: match.status_str, color: "text-green-600", dot: "bg-green-500" }
    if (isUpcoming) return { text: "Upcoming", color: "text-blue-600", dot: "bg-blue-500" }
    return { text: match.status_str, color: "text-gray-600", dot: "bg-gray-500" }
  }
  
  const statusDisplay = getStatusDisplay()

  return (
    <div 
      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer"
      onClick={() => onMatchClick?.(match.match_id)}
    >
      {/* Left Side - Date, Time, Teams, Status */}
      <div className="flex items-center gap-3 flex-1">
        <div className="text-sm text-gray-600">
          {dateStr && timeStr ? `${dateStr} ${timeStr}` : 'Loading...'}
        </div>
        <div className="text-sm font-semibold text-gray-900">
          {match.short_title}
        </div>
        <div className="text-xs text-gray-500">
          {(match as any)?.competition?.title ?? '-'}
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 ${statusDisplay.dot} rounded-full`}></div>
          <span className={`text-sm font-semibold ${statusDisplay.color}`}>
            {statusDisplay.text}
          </span>
        </div>
      </div>
      
      {/* Center - Scores if available */}
      {(((match as any)?.teama?.scores) || ((match as any)?.teamb?.scores)) && (
        <div className="flex items-center gap-2 text-sm">
          <div className="text-gray-700">
            {(match as any)?.teama?.scores || "-"}
          </div>
          <span className="text-gray-400">vs</span>
          <div className="text-gray-700">
            {(match as any)?.teamb?.scores || "-"}
          </div>
        </div>
      )}
      
      {/* Right Side - Action Icons and Format */}
      <div className="flex items-center gap-3">
        {/* Format Badge */}
        <div className="bg-[#00A66E] text-white px-2 py-1 rounded text-xs font-medium">
          {match.format_str}
        </div>
        
        {/* Action Icons */}
        <div className="flex items-center gap-1">
          <button 
            className="w-8 h-8 bg-black text-white rounded flex items-center justify-center hover:bg-gray-800"
            onClick={(e) => {
              e.stopPropagation()
              // Handle TV action
            }}
          >
            <Tv className="w-4 h-4" />
          </button>
          <button 
            className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700"
            onClick={(e) => {
              e.stopPropagation()
              // Handle BM action
            }}
          >
            <span className="text-xs font-bold">BM</span>
          </button>
          <button 
            className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700"
            onClick={(e) => {
              e.stopPropagation()
              // Handle Clock action
            }}
          >
            <Clock className="w-4 h-4" />
          </button>
          <button 
            className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700"
            onClick={(e) => {
              e.stopPropagation()
              // Handle Favorite action
            }}
          >
            <span className="text-xs font-bold">F</span>
          </button>
        </div>
        
        {/* Pin Icon */}
        <button 
          className="text-gray-400 hover:text-gray-600"
          onClick={(e) => {
            e.stopPropagation()
            // Handle pin action
          }}
        >
          <Pin className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
