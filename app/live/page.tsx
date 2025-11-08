'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCricketLiveUpdates } from '@/app/hooks/useWebSocket'
import { useGetCricketMatchesQuery } from '@/app/services/CricketApi'
import ConnectionIndicator from '@/components/utils/ConnectionIndicator'
import MatchRow from '@/components/dashboardagent/MatchRow'
import { Trophy, RefreshCw, Wifi, Clock, Activity } from 'lucide-react'

export default function LiveCricketPage() {
  const [statusFilter, setStatusFilter] = useState<number | undefined>(1)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // ✅ Build WebSocket URL with namespace `/entitysport`
  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL
      ? `${process.env.NEXT_PUBLIC_SOCKET_URL}/entitysport`
      : 'http://localhost:3000/entitysport'

  // ✅ Connect to WebSocket Gateway
  const {
    isConnected,
    isConnecting,
    error: wsError,
    liveMatches,
    lastUpdate,
    connect,
    disconnect,
  } = useCricketLiveUpdates({
    url: SOCKET_URL,
    autoConnect: true,
    realtimeEvent: 'entitySportRealtimeData',
    listEvent: 'entitySportLiveData',
  })

  // ✅ API fallback
  const { data, isLoading, refetch } = useGetCricketMatchesQuery({
    page: 1,
    per_page: 20,
    status: statusFilter,
  })

  // ✅ Prefer live WebSocket data, fallback to API
  const matches = useMemo(() => {
    if (isConnected && liveMatches?.length > 0) {
      console.log("📊 [LIVE PAGE] Using WebSocket matches:", liveMatches.length)
      return liveMatches
    }
    console.log("📊 [LIVE PAGE] Using API matches:", data?.response?.items?.length || 0)
    return data?.response?.items || []
  }, [isConnected, liveMatches, data])

  // ✅ Filter only live matches (handles both API + socket payloads)
  const liveOnlyMatches = useMemo(() => {
    const filtered = matches.filter((m: any) => {
      const status = m?.status_str?.toLowerCase?.() || m?.state?.toLowerCase?.() || ''
      const isLive = (
        status.includes('live') ||
        m?.status === 3 ||
        m?.status === 1 ||
        m?.game_state === 3 ||
        m?.match_status === 'live'
      )
      if (!isLive && m?.match_id) {
        console.log(`🚫 [FILTER] Match ${m.match_id} filtered out. Status: ${m?.status}, status_str: ${m?.status_str}`)
      }
      return isLive
    })
    console.log("📊 [LIVE PAGE] Filtered live matches:", filtered.length, "out of", matches.length)
    return filtered
  }, [matches])

  // ✅ Upcoming matches (non-live)
  const upcomingMatches = useMemo(() => {
    const filtered = matches.filter((m: any) => {
      const statusText = (m?.status_str || m?.state || m?.match_status || '')
        .toString()
        .toLowerCase()

      // Prefer canonical status if present
      const liveByNumeric = typeof m?.status === 'number' && (m.status === 1 || m.status === 3 || m.status === 5)
      const isLive = liveByNumeric || (
        statusText.includes('live') ||
        m?.game_state === 3 ||
        m?.match_status === 'live'
      )

      // Heuristics for upcoming/scheduled/not started
      const isUpcoming = (
        statusText.includes('upcoming') ||
        statusText.includes('scheduled') ||
        statusText.includes('fixture') ||
        statusText.includes('not started') ||
        statusText === 'ns' ||
        m?.match_status === 'upcoming' ||
        m?.game_state === 1 // commonly scheduled
      )

      // If we know via numeric status it's not live, treat as upcoming unless clearly completed
      const completedKeywords = ['completed', 'finished', 'result']
      const isCompleted = completedKeywords.some(k => statusText.includes(k))

      if (liveByNumeric === false) {
        return !isCompleted
      }

      return !isLive && isUpcoming
    })
    console.log("📅 [LIVE PAGE] Filtered upcoming matches:", filtered.length)
    return filtered
  }, [matches])

  // ✅ Poll API when WebSocket disconnected
  useEffect(() => {
    if (!isConnected && autoRefresh) {
      const interval = setInterval(() => {
        console.log('🔄 Polling API for updates...')
        refetch()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [isConnected, autoRefresh, refetch])

  // ✅ Manual reconnect
  const handleReconnect = () => {
    if (isConnected) {
      console.log('🔌 Manual disconnect triggered')
      disconnect()
    } else {
      console.log('🔁 Manual reconnect triggered')
      connect()
    }
  }

  // ✅ Format last update text
  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never'
    const diff = (Date.now() - lastUpdate.getTime()) / 1000
    if (diff < 60) return `${Math.floor(diff)}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  // ✅ Loading state
  if (isLoading && !isConnected) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-600">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading matches...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="bg-[#00A66E] text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Live Cricket Updates
            </h1>

            <div className="flex items-center gap-3">
              <ConnectionIndicator
                isConnected={isConnected}
                isConnecting={isConnecting}
                error={wsError}
                lastUpdate={lastUpdate}
              />

              <button
                onClick={handleReconnect}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  isConnected
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                {isConnected ? 'Disconnect' : 'Connect'}
              </button>

              <button
                disabled={isConnected}
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="px-2 py-1 rounded hover:bg-white/30"
                title="Toggle Auto Refresh"
              >
                <Clock className="w-4 h-4" />
              </button>

              <button
                onClick={refetch}
                className="p-2 hover:bg-white/30 rounded"
                title="Manual Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader */}
          <div className="px-6 py-3 bg-gray-50 border-b flex justify-between text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              {isConnected ? 'Real-time stream active' : 'API polling mode'}
            </span>
            <div className="flex gap-4">
              <span>Last update: {formatLastUpdate()}</span>
              <span className="font-semibold text-green-600">
                {liveOnlyMatches.length} live matches
              </span>
              <span className="text-gray-500">{matches.length} total</span>
            </div>
          </div>
        </div>

        {/* ✅ Live Matches */}
        <div className="bg-white rounded-lg shadow divide-y">
          {liveOnlyMatches.length > 0 ? (
            liveOnlyMatches.map((match, idx) => (
              <MatchRow
                key={(match as any)?.match_id ?? (match as any)?.id ?? idx}
                match={match}
              />
            ))
          ) : (
            <div className="py-12 text-center text-gray-600">
              <Trophy className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              No live matches right now
            </div>
          )}
        </div>

        {/* ✅ Upcoming Matches */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-3 border-b bg-gray-50 flex items-center gap-2 text-gray-700 font-semibold">
              <Clock className="w-4 h-4" />
              Upcoming Matches
              <span className="ml-2 text-xs text-gray-500 font-normal">{upcomingMatches.length}</span>
            </div>
            <div className="divide-y">
              {upcomingMatches.length > 0 ? (
                upcomingMatches.map((match, idx) => (
                  <MatchRow
                    key={(match as any)?.match_id ?? (match as any)?.id ?? `up-${idx}`}
                    match={match}
                  />
                ))
              ) : (
                <div className="py-10 text-center text-gray-600">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  No upcoming matches
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
