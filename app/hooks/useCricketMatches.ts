"use client"

import { useEffect, useMemo, useState } from "react"
import { API_END_POINTS } from "@/app/services/ApiEndpoints"
import type { CricketMatch, CricketMatchesResponse, CricketAggregatorResponse } from "@/lib/types/cricket"

// Storage key for persisting cricket matches data
const STORAGE_KEY = 'cricket_matches_cache'
const CACHE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes cache expiry

interface CachedData {
  data: {
    matches: any[]
    live: any[]
    upcoming: any[]
    liveIds: number[]
    totalItems: number
    totalPages: number
  }
  timestamp: number
  params: string // Cache key based on params
}

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

  // Generate cache key from params
  const cacheKey = useMemo(() => {
    const params = new URLSearchParams()
    if (status !== undefined) params.append("status", status.toString())
    if (format !== undefined) params.append("format", format.toString())
    return params.toString() || 'default'
  }, [status, format])

  // Load cached data from localStorage
  const loadCachedData = (): CachedData | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (!cached) return null
      
      const parsed: CachedData = JSON.parse(cached)
      
      // Check if cache is expired or params don't match
      const now = Date.now()
      if (now - parsed.timestamp > CACHE_EXPIRY_MS) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
      
      // Check if params match
      if (parsed.params !== cacheKey) {
        return null
      }
      
      return parsed
    } catch (error) {
      console.error('Error loading cached data:', error)
      return null
    }
  }

  // Save data to localStorage
  const saveCachedData = (data: CachedData['data']) => {
    if (typeof window === 'undefined') return
    
    try {
      const cache: CachedData = {
        data,
        timestamp: Date.now(),
        params: cacheKey
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
    } catch (error) {
      console.error('Error saving cached data:', error)
    }
  }
  
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

  // WebSocket live updates removed - using API only

  // Normalize aggregator event to match format
  const normalizeAggregatorEvent = (eventData: any): any => {
    if (!eventData?.event) return null
    
    const event = eventData.event
    const eventName = event.name || ''
    
    // Parse team names from event name (e.g., "India v South Africa" or "Gulf Giants v Desert Vipers")
    const nameParts = eventName.split(/\s+v\s+/i)
    const teamA = nameParts[0]?.trim() || 'Team A'
    const teamB = nameParts[1]?.trim() || 'Team B'
    
    return {
      match_id: parseInt(event.id) || 0,
      gmid: parseInt(event.id) || 0,
      title: eventName,
      short_title: eventName,
      ename: eventName,
      match_status: 'upcoming',
      status_str: 'upcoming',
      status: 3, // Upcoming by default
      iplay: false,
      stime: event.openDate,
      date_start: event.openDate,
      countryCode: event.countryCode,
      timezone: event.timezone,
      isPremiumActive: eventData.isPremiumActive === "1",
      marketCount: eventData.marketCount || 0,
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
      format_str: 'match',
      markets: []
    }
  }

  // ✅ Fetch matches from API - returns data instead of setting state directly
  const fetchMatches = async (): Promise<{
    matches: any[]
    live: any[]
    upcoming: any[]
    liveIds: number[]
    totalItems: number
    totalPages: number
  }> => {
    const params = new URLSearchParams()
    // Pagination parameters removed - not used in backend
    if (status !== undefined) params.append("status", status.toString())
    if (format !== undefined) params.append("format", format.toString())

    const response = await fetch(`${API_END_POINTS.cricketMatches}${params.toString() ? `?${params}` : ''}`)
    if (!response.ok) throw new Error(`HTTP error! ${response.status}`)

    const data: any = await response.json()

    // New aggregator format: { total, live: [...], upcoming: [...] }
    if (typeof data?.total === 'number' && (Array.isArray(data.live) || Array.isArray(data.upcoming))) {
      const aggregatorData: CricketAggregatorResponse = data
      
      const liveEvents = Array.isArray(aggregatorData.live) ? aggregatorData.live : []
      const upcomingEvents = Array.isArray(aggregatorData.upcoming) ? aggregatorData.upcoming : []
      
      // Normalize events to match format
      const liveMatches = liveEvents
        .map(normalizeAggregatorEvent)
        .map((match: any) => {
          if (match) {
            match.status = 1 // Live
            match.status_str = 'live'
            match.match_status = 'live'
            match.iplay = true
          }
          return match
        })
        .filter(Boolean)
      
      const upcomingMatches = upcomingEvents
        .map(normalizeAggregatorEvent)
        .filter(Boolean)
      
      // Extract match IDs for live matches
      const ids = liveMatches
        .map((m: any) => m.match_id || m.gmid)
        .filter((id: number | null): id is number => typeof id === 'number' && id > 0)

      return {
        matches: [...liveMatches, ...upcomingMatches],
        live: liveMatches,
        upcoming: upcomingMatches,
        liveIds: ids,
        totalItems: aggregatorData.total || liveMatches.length + upcomingMatches.length,
        totalPages: 1
      }
    }

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

      return {
        matches: [...liveMatches, ...upcomingMatches],
        live: liveMatches,
        upcoming: upcomingMatches,
        liveIds: ids,
        totalItems: liveMatches.length + upcomingMatches.length,
        totalPages: 1
      }
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

      return {
        matches: [...(detailedLive as any[]), ...(upcoming as any[])],
        live: detailedLive,
        upcoming: upcoming,
        liveIds: ids,
        totalItems: typeof data.total === 'number' ? data.total : detailedLive.length + upcoming.length,
        totalPages: 1
      }
    }

    // Legacy shape: { status: 'ok', response: { items, total_items, total_pages } }
    const legacy: CricketMatchesResponse = data
    if (legacy?.status === "ok") {
      return {
        matches: legacy.response.items,
        live: [],
        upcoming: [],
        liveIds: [],
        totalItems: legacy.response.total_items,
        totalPages: legacy.response.total_pages
      }
    }

    throw new Error("Unexpected API response shape")
  }

  useEffect(() => setMounted(true), [])

  // Load cached data on mount
  useEffect(() => {
    if (!mounted) return

    const cached = loadCachedData()
    if (cached) {
      console.log('[CricketMatches] Loading from cache')
      setMatches(cached.data.matches)
      setLiveList(cached.data.live)
      setUpcomingList(cached.data.upcoming)
      setLiveIds(cached.data.liveIds)
      setTotalItems(cached.data.totalItems)
      setTotalPages(cached.data.totalPages)
      setLoading(false)
    }
  }, [mounted, cacheKey])

  useEffect(() => {
    if (!mounted) return

    // Check if we have cached data first
    const cached = loadCachedData()
    if (cached) {
      // Data already loaded from cache in previous effect
      // Still fetch fresh data in background
      setLoading(false)
    } else {
      setLoading(true)
    }
    
    setError(null)
    
    fetchMatches()
      .then(data => {
        setMatches(data.matches)
        setLiveList(data.live)
        setUpcomingList(data.upcoming)
        setLiveIds(data.liveIds)
        setTotalItems(data.totalItems)
        setTotalPages(data.totalPages)
        
        // Save to cache
        saveCachedData(data)
        
        setLoading(false)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Unknown error")
        setMatches([])
        setLoading(false)
      })
  }, [mounted, page, per_page, status, format, cacheKey])

  // Using API data only (WebSocket removed)
  const mergedMatches = useMemo(() => {
    return matches
  }, [matches])

  // Refetch function that clears cache and fetches fresh data
  const refetch = async () => {
    // Clear cache
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (error) {
        console.error('Error clearing cache:', error)
      }
    }

    setLoading(true)
    setError(null)
    
    try {
      const data = await fetchMatches()
      setMatches(data.matches)
      setLiveList(data.live)
      setUpcomingList(data.upcoming)
      setLiveIds(data.liveIds)
      setTotalItems(data.totalItems)
      setTotalPages(data.totalPages)
      
      // Save to cache
      saveCachedData(data)
      
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setMatches([])
      setLoading(false)
    }
  }

  return {
    matches: mergedMatches,
    loading,
    error,
    totalItems,
    totalPages,
    refetch,
    live: liveList,
    upcoming: upcomingList,
    liveIds,
  }
}
