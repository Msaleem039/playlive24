"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"

export const useCricketLiveUpdates = ({
  url = process.env.NEXT_PUBLIC_SOCKET_URL
    ? `${process.env.NEXT_PUBLIC_SOCKET_URL}/entitysport`
    : "http://localhost:3000/entitysport",
  autoConnect = true,
  realtimeEvent = "entitySportRealtimeData",
  listEvent = "entitySportLiveData",
} = {}) => {
  const [liveMatches, setLiveMatches] = useState<any[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)

  /** --------------------------
   *  CONNECT FUNCTION
   * -------------------------- */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    console.log("🔌 Connecting to socket:", url)
    setIsConnecting(true)

    const socket = io(url, {
      transports: ["websocket"],
      forceNew: true,                 // prevents reuse of broken connections
      reconnection: true,
      reconnectionAttempts: Infinity, // unlimited reconnect
      reconnectionDelay: 2000,
      timeout: 15000,
      withCredentials: false,
    })

    socketRef.current = socket

    /** CONNECTED */
    socket.on("connect", () => {
      console.log("🟢 Connected:", socket.id)
      setIsConnected(true)
      setIsConnecting(false)

      socket.emit("subscribe", { event: listEvent })
      socket.emit("subscribe", { event: realtimeEvent })
    })

    /** DISCONNECTED */
    socket.on("disconnect", (reason) => {
      console.warn("❌ Disconnected:", reason)
      setIsConnected(false)
      setIsConnecting(false)
    })

    /** ERROR */
    socket.on("connect_error", (err: Error) => {
      const errorMessage = err?.message || err?.toString() || "Connection failed"
      console.error("⛔ Connection error:", errorMessage)
      setError(errorMessage)
      setIsConnecting(false)
    })

    /** --------------------------
     *  LIST LIVE MATCHES
     * -------------------------- */
    socket.on(listEvent, (payload) => {
      console.log("📦 Live list:", payload)

      if (payload?.success && payload?.data) {
        const t1 = Array.isArray(payload.data.t1) ? payload.data.t1 : []
        const t2 = Array.isArray(payload.data.t2) ? payload.data.t2 : []

        const matches = [...t1, ...t2]
        if (matches.length > 0) {
          setLiveMatches(matches)
          setLastUpdate(new Date())
        }
        return
      }

      // fallback formats
      const items = payload?.data?.matches || payload?.data?.response?.items
      if (Array.isArray(items)) {
        setLiveMatches(items)
        setLastUpdate(new Date())
      }
    })

    /** --------------------------
     * NORMALIZER
     * -------------------------- */
    const normalizeMatch = (raw: any) => {
      if (!raw) return null

      const base = raw.match_info || raw
      const teama = base.teama || raw.teama || {}
      const teamb = base.teamb || raw.teamb || {}

      const liveScore = raw.live?.live_score
      const teamaScores = liveScore?.team_a_scores || teama.scores
      const teambScores = liveScore?.team_b_scores || teamb.scores

      return {
        ...base,
        teama: { ...teama, scores: teamaScores },
        teamb: { ...teamb, scores: teambScores },
      }
    }

    /** --------------------------
     * REALTIME EVENT
     * -------------------------- */
    socket.on(realtimeEvent, (payload) => {
      console.log("🔥 Realtime:", payload)

      if (!payload?.data?.data) return
      const normalized = normalizeMatch(payload.data.data)
      if (!normalized?.match_id) return

      setLiveMatches((prev) => {
        const filtered = prev.filter((m) => m.match_id !== normalized.match_id)
        return [normalized, ...filtered]
      })

      setLastUpdate(new Date())
    })

    /** --------------------------
     * GENERIC EVENTS (new servers)
     * -------------------------- */
    socket.on("liveUpdate", (payload) => {
      console.log("⚡ liveUpdate:", payload)

      const raw =
        payload?.[0]?.data?.response ||
        payload?.data?.response ||
        payload?.data?.data?.response ||
        payload?.response ||
        payload

      const normalized = normalizeMatch(raw)
      if (!normalized?.match_id) return

      setLiveMatches((prev) => {
        const filtered = prev.filter((m) => m.match_id !== normalized.match_id)
        return [normalized, ...filtered]
      })

      setLastUpdate(new Date())
    })

    socket.on("realtimeUpdate", (payload) => {
      console.log("⚡ realtimeUpdate:", payload)

      let raw =
        payload?.[0]?.data?.response ||
        payload?.data?.response ||
        payload?.data?.data?.response ||
        payload?.response ||
        payload

      if (Array.isArray(raw)) raw = raw[0]
      if (raw?.match_id && raw?.match_info) raw = raw.match_info

      const normalized = normalizeMatch(raw)
      if (!normalized?.match_id) return

      setLiveMatches((prev) => {
        const filtered = prev.filter((m) => m.match_id !== normalized.match_id)
        return [normalized, ...filtered]
      })

      setLastUpdate(new Date())
    })

    /** DEBUG unknown events */
    socket.onAny((event, ...args) => {
      if (![listEvent, realtimeEvent, "liveUpdate", "realtimeUpdate"].includes(event)) {
        console.log(`🧩 Unknown event: ${event}`, args)
      }
    })
  }, [url, listEvent, realtimeEvent])

  /** --------------------------
   * DISCONNECT
   * -------------------------- */
  const disconnect = useCallback(() => {
    if (!socketRef.current) return

    console.log("🔌 Manual disconnect")
    socketRef.current.disconnect()
    socketRef.current = null
    setIsConnected(false)
  }, [])

  /** INIT + CLEANUP */
  useEffect(() => {
    if (autoConnect) connect()
    return () => disconnect()
  }, [autoConnect, connect, disconnect])

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    liveMatches,
    lastUpdate,
    connect,
    disconnect,
  }
}

/* -------------------------------------------------------------
   LIVE ODDS HOOK
   Supports both new API (eventId/marketIds) and legacy (sid/gmid)
   Merges incremental updates for multiple markets
-------------------------------------------------------------- */
export function useLiveOdds(
  sid: number | null, 
  gmid: number | null,
  eventId?: string | null,
  marketIds?: string[]
) {
  const [odds, setOdds] = useState<any>(null)
  const socketRef = useRef<Socket | null>(null)
  const oddsMapRef = useRef<Map<string, any>>(new Map()) // Store odds by marketId

  useEffect(() => {
    // Use new API format if eventId and marketIds are provided
    const useNewFormat = eventId && marketIds && marketIds.length > 0
    
    // Use legacy format if sid and gmid are provided
    const useLegacyFormat = sid && gmid

    // Skip WebSocket for new API format - use direct API polling instead (backend has cronjob)
    if (useNewFormat) {
      console.log("📊 [LIVE ODDS] Skipping WebSocket for new API format - using direct API polling")
      setOdds(null)
      oddsMapRef.current.clear()
      return
    }

    if (!useLegacyFormat) {
      setOdds(null)
      oddsMapRef.current.clear()
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://api.playlive24.com"

    const socket = io(baseUrl, {
      transports: ["websocket"],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      timeout: 15000,
    })

    socketRef.current = socket

    socket.on("connect", () => {
      if (useNewFormat) {
        console.log("📊 [LIVE ODDS] Connected (New API):", { eventId, marketIds })
        // Subscribe to markets for odds updates
        socket.emit("subscribe_markets", { eventId, marketIds })
        // Also try alternative event names
        socket.emit("subscribe", { event: "market_odds", eventId, marketIds })
      } else if (useLegacyFormat) {
        console.log("📊 [LIVE ODDS] Connected (Legacy):", { sid, gmid })
        socket.emit("subscribe_match", { sid, gmid })
      }
    })

    socket.on("disconnect", () => console.warn("📊 Live odds disconnected"))
    socket.on("connect_error", (e) => console.error("📊 Live odds error:", e))

    // Handle odds updates - transform to match API format and merge incremental updates
    const handleOddsUpdate = (payload: any) => {
      console.log("📊 [LIVE ODDS] Update received:", payload)
      
      // Handle new API format - odds update for specific markets
      if (useNewFormat) {
        let updatedOdds = null
        
        // Check if this is a single market update or array of markets
        if (payload?.marketId) {
          // Single market update - merge into map
          const marketId = payload.marketId
          oddsMapRef.current.set(marketId, {
            marketId: payload.marketId,
            isMarketDataDelayed: payload.isMarketDataDelayed || false,
            status: payload.status || "OPEN",
            betDelay: payload.betDelay || 5,
            inplay: payload.inplay || false,
            totalMatched: payload.totalMatched || 0,
            totalAvailable: payload.totalAvailable || 0,
            runners: payload.runners || []
          })
          
          // Convert map to array format
          updatedOdds = {
            status: true,
            data: Array.from(oddsMapRef.current.values())
          }
        } else if (Array.isArray(payload)) {
          // Array of market updates
          payload.forEach((market: any) => {
            if (market?.marketId) {
              oddsMapRef.current.set(market.marketId, {
                marketId: market.marketId,
                isMarketDataDelayed: market.isMarketDataDelayed || false,
                status: market.status || "OPEN",
                betDelay: market.betDelay || 5,
                inplay: market.inplay || false,
                totalMatched: market.totalMatched || 0,
                totalAvailable: market.totalAvailable || 0,
                runners: market.runners || []
              })
            }
          })
          
          updatedOdds = {
            status: true,
            data: Array.from(oddsMapRef.current.values())
          }
        } else if (payload?.data && Array.isArray(payload.data)) {
          // Wrapped array format
          payload.data.forEach((market: any) => {
            if (market?.marketId) {
              oddsMapRef.current.set(market.marketId, market)
            }
          })
          
          updatedOdds = {
            status: true,
            data: Array.from(oddsMapRef.current.values())
          }
        }
        
        if (updatedOdds) {
          setOdds(updatedOdds)
        }
        return
      }

      // Handle legacy format or generic updates
      if (useLegacyFormat) {
        setOdds(payload)
        return
      }

      // Try to extract market data from various payload formats
      if (payload?.data) {
        setOdds(payload)
      } else if (Array.isArray(payload)) {
        setOdds({ status: true, data: payload })
      } else {
        setOdds(payload)
      }
    }

    // Listen for various odds update events
    socket.on("odds_update", handleOddsUpdate)
    socket.on("webhook_update", handleOddsUpdate)
    socket.on("market_odds_update", handleOddsUpdate) // New API format event
    socket.on("market_odds", handleOddsUpdate) // Alternative event name
    socket.on("odds", handleOddsUpdate) // Generic odds event

    return () => {
      if (socketRef.current?.connected) {
        if (useNewFormat) {
          socketRef.current.emit("unsubscribe_markets", { eventId, marketIds })
          socketRef.current.emit("unsubscribe", { event: "market_odds", eventId, marketIds })
        } else if (useLegacyFormat) {
          socketRef.current.emit("unsubscribe_match", { sid, gmid })
        }
      }
      socketRef.current?.disconnect()
      socketRef.current = null
      oddsMapRef.current.clear()
    }
  }, [sid, gmid, eventId, marketIds])

  return { data: odds }
}
