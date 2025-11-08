"use client"

import { useEffect, useMemo, useState } from "react"
import { useCricketLiveUpdates } from "./useWebSocket"
import { API_END_POINTS } from "@/app/services/ApiEndpoints"
import type { CricketMatch, CricketMatchesResponse } from "@/lib/types/cricket"

interface UseCricketMatchesProps {
  page?: number
  per_page?: number
  status?: number
  format?: number
}

export const isMatchLive = (status: number) => status === 1 || status === 3 || status === 5

export function useCricketMatches({
  page = 1,
  per_page = 20,
  status,
  format
}: UseCricketMatchesProps = {}) {
  const [matches, setMatches] = useState<CricketMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [liveList, setLiveList] = useState<any[]>([])
  const [upcomingList, setUpcomingList] = useState<any[]>([])
  const [liveIds, setLiveIds] = useState<number[]>([])
  const normalizeMatch = (raw: any): any => {
    if (!raw) return null
    const base = raw.match_info ?? raw
    const teama = base.teama || {}
    const teamb = base.teamb || {}
    return {
      ...base,
      teama: { name: teama.name || teama.short_name || "-", short_name: teama.short_name || teama.name || "-", scores: teama.scores },
      teamb: { name: teamb.name || teamb.short_name || "-", short_name: teamb.short_name || teamb.name || "-", scores: teamb.scores },
      format_str: base.format_str || base.format || "-",
      status_str: base.status_str || base.match_status || "",
      title: base.title || `${teama.short_name || teama.name || "-"} vs ${teamb.short_name || teamb.name || "-"}`,
      short_title: base.short_title || base.title,
    }
  }

  // ✅ WebSocket live updates
  const {
    isConnected,
    isConnecting,
    error: wsError,
    liveMatches: wsLiveMatches,
    lastUpdate,
    connect: wsConnect,
    disconnect: wsDisconnect
  } = useCricketLiveUpdates({
    url: "ws://localhost:3000/entitysport",
    autoConnect: mounted
  })

  // ✅ Fetch matches from API
  const fetchMatches = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("per_page", per_page.toString())
      if (status !== undefined) params.append("status", status.toString())
      if (format !== undefined) params.append("format", format.toString())

      const response = await fetch(`${API_END_POINTS.cricketMatches}?${params}`)
      if (!response.ok) throw new Error(`HTTP error! ${response.status}`)

      const data: any = await response.json()

      // New shape: { success, total, live: [...], upcoming: [...] }
      if (data?.success === true && (Array.isArray(data.live) || Array.isArray(data.upcoming))) {
        const liveRaw = Array.isArray(data.live) ? data.live : []
        const upcomingRaw = Array.isArray(data.upcoming) ? data.upcoming : []

        // Some live entries are just { type: 'subscribe', match_id }
        const ids = liveRaw
          .map((m: any) => (typeof m?.match_id === 'number' ? m.match_id : null))
          .filter((id: number | null): id is number => id !== null)

        const detailedLive = liveRaw
          .filter((m: any) => m && (m.title || m.match_info || m.teama || m.teamb))
          .map(normalizeMatch)
          .filter(Boolean)

        const upcoming = upcomingRaw.map(normalizeMatch).filter(Boolean)

        setLiveIds(ids)
        setLiveList(detailedLive)
        setUpcomingList(upcoming)
        setMatches([...(detailedLive as any[]), ...(upcoming as any[])])
        setTotalItems(typeof data.total === 'number' ? data.total : detailedLive.length + upcoming.length)
        setTotalPages(1)
        return
      }

      // Legacy shape: { status: 'ok', response: { items, total_items, total_pages } }
      const legacy: CricketMatchesResponse = data
      if (legacy?.status === "ok") {
        setMatches(legacy.response.items)
        setTotalItems(legacy.response.total_items)
        setTotalPages(legacy.response.total_pages)
        setLiveList([])
        setUpcomingList([])
        return
      }

      throw new Error("Unexpected API response shape")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (mounted) fetchMatches()
  }, [mounted, page, per_page, status, format])

  // ✅ Merge API + Live data
  const mergedMatches = useMemo(() => {
    if (!wsLiveMatches?.length) return matches
    const updated = matches.map(match => {
      const live = wsLiveMatches.find(l => l.match_id === match.match_id)
      return live ? { ...match, ...live } : match
    })
    return updated
  }, [matches, wsLiveMatches])

  return {
    matches: mergedMatches,
    loading,
    error,
    totalItems,
    totalPages,
    refetch: fetchMatches,
    live: liveList,
    upcoming: upcomingList,
    liveIds,
    // WebSocket info
    isConnected,
    isConnecting,
    wsError,
    lastUpdate,
    reconnectWebSocket: wsConnect,
  }
}
