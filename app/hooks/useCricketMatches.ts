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
  
  // Normalize match from legacy format
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

  // Normalize new API format (data.t1 / data.t2) to match format
  const normalizeApiMatch = (market: any): any => {
    if (!market) return null
    
    // Extract team names from sections array
    const sections = market.section || []
    const teamNames = sections
      .map((s: any) => s.nat)
      .filter((t: string) => t && t !== 'The Draw')
    
    // Extract team names from ename string as fallback (e.g., "India v South Africa")
    let teamA = teamNames[0] || ''
    let teamB = teamNames[1] || ''
    
    if (!teamA || !teamB) {
      const enameParts = (market.ename || '').split(/\s+v\s+/i)
      if (enameParts.length >= 2) {
        teamA = teamA || enameParts[0]?.trim() || 'Team A'
        teamB = teamB || enameParts[1]?.trim() || 'Team B'
      }
    }
    
    // Extract title from ename
    const title = market.ename || 'Match'
    
    // Group matches by gmid - each match can have multiple markets
    // Create a match object from the first market for each gmid
    return {
      match_id: market.gmid,
      gmid: market.gmid,
      title: title,
      short_title: title,
      ename: market.ename,
      match_status: market.iplay === true ? 'live' : '',
      status_str: market.iplay === true ? 'live' : '',
      status: market.iplay === true ? 1 : 3,
      iplay: market.iplay,
      stime: market.stime,
      tv: market.tv,
      bm: market.bm,
      f: market.f,
      f1: market.f1,
      cid: market.cid,
      cname: market.cname,
      etid: market.etid,
      // Create teama and teamb objects from extracted names
      teama: {
        name: teamA,
        short_name: teamA,
        scores: ''
      },
      teamb: {
        name: teamB,
        short_name: teamB,
        scores: ''
      },
      // Store all markets for this match
      markets: [{
        mid: market.mid,
        mname: market.mname,
        status: market.status,
        section: market.section,
        min: 500, // Default, could be from API
        max: market.m || 500000
      }],
      // Legacy compatibility
      format_str: market.gtype || 'match',
      date_start: market.stime,
    }
  }

  // Group markets by gmid (game match ID) since one match can have multiple markets
  const groupMarketsByMatch = (markets: any[]): any[] => {
    const matchMap = new Map<number, any>()
    
    markets.forEach((market) => {
      const normalized = normalizeApiMatch(market)
      if (!normalized) return
      
      const gmid = market.gmid
      if (matchMap.has(gmid)) {
        // Add this market to existing match
        const existing = matchMap.get(gmid)!
        existing.markets.push({
          mid: market.mid,
          mname: market.mname,
          status: market.status,
          section: market.section,
          min: 500,
          max: market.m || 500000
        })
      } else {
        // Create new match entry
        matchMap.set(gmid, normalized)
      }
    })
    
    return Array.from(matchMap.values())
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

      // New API format: { success: true, data: { t1: [...], t2: [...] } }
      if (data?.success === true && data?.data) {
        const t1 = Array.isArray(data.data.t1) ? data.data.t1 : []  // Live matches
        const t2 = Array.isArray(data.data.t2) ? data.data.t2 : []  // Upcoming matches
        
        // Group markets by match (gmid)
        const liveMatches = groupMarketsByMatch(t1)
        const upcomingMatches = groupMarketsByMatch(t2)
        
        // Extract match IDs for live matches
        const ids = liveMatches
          .map((m: any) => m.match_id || m.gmid)
          .filter((id: number | null): id is number => typeof id === 'number')

        setLiveIds(ids)
        setLiveList(liveMatches)
        setUpcomingList(upcomingMatches)
        setMatches([...liveMatches, ...upcomingMatches])
        setTotalItems(liveMatches.length + upcomingMatches.length)
        setTotalPages(1)
        return
      }

      // Alternative format: { success, total, live: [...], upcoming: [...] }
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
    const updated = matches.map((match: any) => {
      // Match by match_id or gmid
      const live = wsLiveMatches.find((l: any) => 
        l.match_id === match.match_id || 
        l.match_id === match.gmid ||
        l.gmid === match.match_id ||
        l.gmid === match.gmid
      )
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
