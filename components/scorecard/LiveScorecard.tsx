'use client'

import { useMemo } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'

interface Batsman {
  player_id: number
  name: string
  img: string
  strike_status: number
  run: number
  ball: number
  fours: number
  sixes: number
  strike_rate: string
}

interface Team {
  fullName: string
  shortName: string
  flag: string
  score: string
  overs: string
}

interface Bowler {
  player_id: number
  name: string
  img: string
  run: number
  maiden: number
  over: string
  wicket: number
  economy: string
}

interface LastWicket {
  player: string
  run: number
  ball: number
}

interface Partnership {
  player_a: { ball: number; run: number }
  player_b: { ball: number; run: number }
  ball: number
  run: number
}

interface ScorecardData {
  batsman: Batsman[]
  team1: Team
  team2: Team
  bowler: Bowler
  lastBowler: any
  lastWicket: LastWicket
  partnership: Partnership
  sessionData: any
  lastAllOvers: any[]
  lastBalls: string[]
  currentInningscurrentBall: string
  needByBall: string
  needByOver: string
  matchType: string
  runRate: string | number
  targetRun: number
  eventId: string
  currentInnings: string | number
  currentBall: string
  matchName: string
}

interface LiveScorecardProps {
  data: ScorecardData | null
  isLoading?: boolean
  isMobile?: boolean
  matchDateTime?: string | null
}

export default function LiveScorecard({ data, isLoading, isMobile = false, matchDateTime }: LiveScorecardProps) {
  const [isMuted, setIsMuted] = useState(false)

  // Calculate trail (runs behind) and CRR
  const trail = useMemo(() => {
    if (!data || !data.team1 || !data.team2) return null
    
    const currentInnings = String(data.currentInnings || '1')
    const team1Score = parseInt(data.team1.score?.split('-')[0] || '0') || 0
    const team2Score = parseInt(data.team2.score?.split('-')[0] || '0') || 0
    
    if (currentInnings === '2' && data.team2.score && data.team2.score.trim() !== '') {
      // Team 2 is batting, calculate how many runs they trail by
      return team1Score - team2Score
    }
    return null
  }, [data])

  // Calculate CRR (Current Run Rate)
  const currentRunRate = useMemo(() => {
    if (!data) return null
    
    // If runRate is provided and valid
    if (data.runRate && (typeof data.runRate === 'number' ? data.runRate > 0 : parseFloat(String(data.runRate)) > 0)) {
      return typeof data.runRate === 'number' ? data.runRate.toFixed(2) : parseFloat(String(data.runRate)).toFixed(2)
    }
    
    // Calculate from current innings
    const currentInnings = String(data.currentInnings || '1')
    const battingTeam = currentInnings === '1' ? data.team1 : data.team2
    
    if (battingTeam?.score && battingTeam.score.trim() !== '' && battingTeam.overs && battingTeam.overs.trim() !== '') {
      const runs = parseInt(battingTeam.score.split('-')[0] || '0') || 0
      const overs = parseFloat(battingTeam.overs || '0') || 0
      if (overs > 0) {
        return (runs / overs).toFixed(2)
      }
    }
    
    return null
  }, [data])

  // Check if needByBall contains runs needed info or toss info
  const runsNeededInfo = useMemo(() => {
    if (!data?.needByBall) return null
    
    // Check if it's toss information
    
    
    // Try to extract runs needed
    const match = data.needByBall.match(/(\d+)\s+runs\s+in\s+(\d+)\s+balls\s+to\s+win/i)
    if (match) {
      return {
        runs: match[1],
        balls: match[2]
      }
    }
    
    return null
  }, [data])

  if (isLoading) {
    return (
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="animate-pulse space-y-2 p-3">
          <div className="h-6 bg-gray-700 rounded w-2/3"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-gray-800 border-b border-gray-700 p-4 text-center text-gray-400">
        Scorecard data not available
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border-b border-gray-700">
      {/* Match Header - Top Section */}
      <div className="bg-gray-800 px-2 sm:px-4 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-xs sm:text-sm font-medium truncate">{data.matchName}</h3>
            {matchDateTime && (
              <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5 truncate">{matchDateTime}</p>
            )}
          </div>
          <div className="ml-2 flex-shrink-0">
            <span className="bg-green-500 text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
              INPLAY
            </span>
          </div>
        </div>
      </div>

      {/* Scorecard Details - Bottom Section */}
      <div className="bg-gray-800 px-2 sm:px-4 py-2">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Side - Scores and Stats in one line */}
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            {/* Team Scores */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Team 1 Score */}
              <div className="text-white text-xs sm:text-sm font-semibold">
                <span>{data.team1.shortName}</span>
                <span className="ml-1">{data.team1.score}</span>
                <span className="text-gray-400 ml-1">({data.team1.overs})</span>
              </div>

              {/* Team 2 Score */}
              <div className="text-white text-xs sm:text-sm">
                {data.team2.score && data.team2.score.trim() !== '' ? (
                  <>
                    <span className="font-semibold">{data.team2.shortName}</span>
                    <span className="ml-1">{data.team2.score}</span>
                    {data.team2.overs && data.team2.overs.trim() !== '' && (
                      <span className="text-gray-400 ml-1">({data.team2.overs})</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="font-semibold">{data.team2.shortName}</span>
                    <span className="text-gray-400 ml-1 italic">Yet to bat</span>
                  </>
                )}
              </div>
            </div>

            {/* CRR in one line */}
            {currentRunRate && (
              <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                <span className="text-gray-300">CRR</span>
                <span className="text-green-400 font-semibold">: {currentRunRate}</span>
              </div>
            )}

            {/* Trail in one line */}
            {trail !== null && (
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-green-400">
                <span className="text-gray-300">{data.team2.shortName} trail</span>
                <span className="font-semibold">by {trail} runs</span>
              </div>
            )}

            {/* Runs Needed in one line */}
            {runsNeededInfo && (
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-green-400">
                <span className="text-gray-300">{data.team2.shortName} needs</span>
                <span className="font-semibold">{runsNeededInfo.runs} runs in {runsNeededInfo.balls} balls to win</span>
              </div>
            )}
          </div>

          {/* Right Side - Last Balls and Mute */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Last Balls */}
            {data.lastBalls && data.lastBalls.length > 0 && (
              <div className="flex gap-1">
                {data.lastBalls.map((ball, idx) => {
                  // Handle wicket indicators (WW, W, etc.)
                  const isWicket = ball.toUpperCase().includes('W')
                  const ballValue = ball.replace(/W/gi, '')
                  const isZero = ballValue === '0' || ballValue === '0.0' || ballValue === ''
                  
                  return (
                    <div
                      key={idx}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
                        isWicket
                          ? 'bg-red-500 text-white'
                          : isZero
                          ? 'bg-gray-600 text-gray-300'
                          : ballValue === '4' || ballValue === '6'
                          ? 'bg-yellow-400 text-gray-900'
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      {isWicket ? 'WW' : ball}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Mute Icon */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-gray-400 hover:text-white transition-colors p-1 flex-shrink-0"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Batsman and Bowler Info - Compact one line */}
        {(data.batsman?.length > 0 || (data.bowler && data.bowler.player_id)) && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
              {/* Batsman */}
              {data.batsman && data.batsman.length > 0 && (
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="text-gray-400 font-semibold">BATTING</span>
                  {data.batsman.map((batsman, idx) => (
                    <div key={batsman.player_id || idx} className="text-white flex items-center gap-1">
                      <span className="font-medium">{batsman.name}</span>
                      {batsman.strike_status === 1 && <span className="text-green-400">*</span>}
                      <span className="text-gray-400">
                        {batsman.run}({batsman.ball})
                      </span>
                      {batsman.strike_rate && parseFloat(String(batsman.strike_rate)) > 0 && (
                        <span className="text-gray-500">SR: {batsman.strike_rate}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Bowler */}
              {data.bowler && data.bowler.player_id && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-semibold">BOWLING</span>
                  <div className="text-white flex items-center gap-1">
                    <span className="font-medium">{data.bowler.name}</span>
                    <span className="text-gray-400">
                      {data.bowler.over} ov, {data.bowler.run}-{data.bowler.wicket}
                    </span>
                    {data.bowler.economy && (
                      <span className="text-gray-500">({data.bowler.economy})</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
