"use client"
import { motion } from "framer-motion"
import { Tv, Trophy, Users, MapPin } from "lucide-react"
import { CricketMatch } from "@/lib/types/cricket"

interface MatchCardProps {
  match: CricketMatch
  sport: string
}

export default function MatchCard({ match }: MatchCardProps) {
  const formatMatchTime = (dateStart: string) => {
    if (!dateStart) return "--:--"
    const date = new Date(dateStart)
    const hours = date.getUTCHours().toString().padStart(2, '0')
    const minutes = date.getUTCMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const formatMatchDate = (dateStart: string) => {
    if (!dateStart) return "--"
    const date = new Date(dateStart)
    const month = date.getUTCMonth()
    const day = date.getUTCDate()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[month]} ${day}`
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return "text-green-600 bg-green-100" 
      case 2: return "text-gray-600 bg-gray-100" 
      case 3: return "text-blue-600 bg-blue-100" 
      default: return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-gray-200 py-4 hover:bg-gray-50 transition-colors px-4"
    >
      <div className="flex items-center justify-between">
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-600 font-medium">
              {formatMatchDate(match?.date_start)} {formatMatchTime(match?.date_start)}
            </span>

            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(match?.status)}`}>
              {match?.status_str}
            </span>

            {match?.status === 1 && (
              <div className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">Live Now</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-800 truncate">
              {match?.title}
            </span>
            {match?.commentary === 1 && <Tv className="w-4 h-4 text-blue-500" />}
          </div>

          {/* Teams */}
          <div className="flex items-center gap-4 text-sm mb-2">
            <div className="flex items-center gap-2">
              {match?.teama?.logo_url ? (
                <img
                  src={match.teama.logo_url}
                  alt={match.teama.name}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                  {match?.teama?.short_name?.charAt(0) || 'T'}
                </div>
              )}
              <span className="font-medium">{match?.teama?.short_name}</span>
              {match?.teama?.scores && (
                <span className="text-gray-600 font-semibold">{match?.teama?.scores}</span>
              )}
            </div>

            <span className="text-gray-400 font-bold">vs</span>

            <div className="flex items-center gap-2">
              {match?.teamb?.logo_url ? (
                <img
                  src={match.teamb.logo_url}
                  alt={match.teamb.name}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                  {match?.teamb?.short_name?.charAt(0) || 'T'}
                </div>
              )}
              <span className="font-medium">{match?.teamb?.short_name}</span>
              {match?.teamb?.scores && (
                <span className="text-gray-600 font-semibold">{match?.teamb?.scores}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>{match?.competition?.name || "--"}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{match?.venue?.name || "--"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{match?.format_str || "--"}</span>
            </div>
          </div>

          {match?.result && (
            <div className="text-sm text-[#00A66E] font-medium mt-2">
              {match?.result}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="flex flex-col items-end gap-2 ml-4">
          <div className="text-xs text-gray-500">ID: {match?.match_id}</div>
          <div className="text-xs text-gray-500">{match?.format_str}</div>

          {match?.status === 1 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Live fdfas</span>
            </div>
          )}

          {match?.commentary === 1 && (
            <div className="flex items-center gap-1 text-blue-600">
              <Tv className="w-3 h-3" />
              <span className="text-xs">Commentary</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
