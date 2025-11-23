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

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    console.log("🔌 [SOCKET] Connecting to:", url)
    setIsConnecting(true)

      const socket = io(url, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
        timeout: 20000,
      })

      socketRef.current = socket

    socket.on("connect", () => {
      // console.log("✅ [SOCKET] Connected:", socket.id)
        setIsConnected(true)
        setIsConnecting(false)
      socket.emit("subscribe", { event: realtimeEvent })
      socket.emit("subscribe", { event: listEvent })
      })

    socket.on("disconnect", (reason) => {
      // console.warn("⚠️ [SOCKET] Disconnected:", reason)
        setIsConnected(false)
        setIsConnecting(false)
    })

    socket.on("connect_error", (err) => {
      console.error("❌ [SOCKET] Connection error:", err)
      setError(err.message)
      setIsConnecting(false)
    })

    // ✅ Handles initial list of live matches
    socket.on(listEvent, (payload) => {
      console.log("🟢 [EVENT]", listEvent, "received:", payload)
      
      // New API format: { success: true, data: { t1: [...], t2: [...] } }
      if (payload?.success === true && payload?.data) {
        const t1 = Array.isArray(payload.data.t1) ? payload.data.t1 : []
        const t2 = Array.isArray(payload.data.t2) ? payload.data.t2 : []
        // Combine live and upcoming matches
        const allMatches = [...t1, ...t2]
        if (allMatches.length > 0) {
          setLiveMatches(allMatches)
          setLastUpdate(new Date())
        }
        return
      }
      
      // Legacy formats
      const items = payload?.data?.matches || payload?.data?.response?.items
      if (Array.isArray(items)) {
        setLiveMatches(items)
        setLastUpdate(new Date())
      }
    })

    // ✅ Helper: normalize backend payload to item shape expected by UI
    const normalizeMatch = (raw: any) => {
      if (!raw) return null
      const base = raw.match_info ? raw.match_info : raw
      // Ensure teama/teamb exist
      const teama = base.teama || raw.teama || {}
      const teamb = base.teamb || raw.teamb || {}
      // Optionally copy live scores into team scores if provided
      const liveScore = raw.live?.live_score
      const teamaScores = liveScore?.team_a_scores || teama.scores
      const teambScores = liveScore?.team_b_scores || teamb.scores
      return {
        ...base,
        teama: { ...teama, scores: teamaScores },
        teamb: { ...teamb, scores: teambScores },
      }
    }

    // ✅ Handles real-time updates for a specific match
    socket.on(realtimeEvent, (payload) => {
      console.log("🔥 [EVENT]", realtimeEvent, "received:", payload)
      if (payload?.data?.data) {
        const normalized = normalizeMatch(payload.data.data)
        if (!normalized?.match_id) return
        setLiveMatches((prev) => {
          const existing = prev.filter((m: any) => m.match_id !== normalized.match_id)
          return [normalized, ...existing]
        })
        setLastUpdate(new Date())
      }
    })

    // ✅ Handle new event names from backend
    socket.on("liveUpdate", (payload) => {
      console.log("🔥 [LIVE UPDATE]", payload)
      const raw = payload?.[0]?.data?.response || payload?.data?.response
      const normalized = normalizeMatch(raw)
      if (normalized?.match_id) {
        setLiveMatches((prev) => {
          const existing = prev.filter((m: any) => m.match_id !== normalized.match_id)
          return [normalized, ...existing]
        })
        setLastUpdate(new Date())
      }
    })

    socket.on("realtimeUpdate", (payload) => {
      console.log("⚡ [REALTIME UPDATE]", payload)
      
      // Try multiple payload structures
      let raw = payload?.[0]?.data?.response || 
                payload?.data?.response || 
                payload?.data?.data?.response ||
                payload?.response ||
                payload
      
      console.log("⚡ [REALTIME] Extracted raw data:", raw)
      
      // If it's an array, take first item
      if (Array.isArray(raw)) raw = raw[0]
      
      // If raw has match_id directly, use it as-is
      if (raw?.match_id && raw?.match_info) {
        raw = raw.match_info
      }
      
      const normalized = normalizeMatch(raw)
      console.log("⚡ [REALTIME] Normalized match:", normalized)
      
      if (normalized?.match_id) {
        setLiveMatches((prev) => {
          const existing = prev.filter((m: any) => m.match_id !== normalized.match_id)
          const updated = [normalized, ...existing]
          console.log("⚡ [REALTIME] Updated liveMatches, count:", updated.length)
          return updated
        })
          setLastUpdate(new Date())
      } else {
        console.warn("⚡ [REALTIME] Failed to normalize match, no match_id found")
      }
    })

    // ✅ Catch any unknown event
    socket.onAny((event, ...args) => {
      if (!["liveUpdate", "realtimeUpdate", listEvent, realtimeEvent].includes(event)) {
        console.log(`🧩 [DEBUG] Unhandled event: "${event}"`, args)
      }
    })
  }, [url, realtimeEvent, listEvent])

  const disconnect = useCallback(() => {
    console.log("🔌 [SOCKET] Disconnecting manually")
    socketRef.current?.disconnect()
      socketRef.current = null
    setIsConnected(false)
  }, [])

  useEffect(() => {
    if (autoConnect) connect()
    return () => disconnect()
  }, [autoConnect, connect, disconnect])

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    liveMatches,
    lastUpdate,
  }
}

// Hook for subscribing to live odds updates for a specific match
export function useLiveOdds(sid: number | null, gmid: number | null) {
  const [odds, setOdds] = useState<any>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!sid || !gmid) {
      setOdds(null)
      return
    }

    // Create socket connection for live odds (base URL, no namespace)
    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"
    const socket = io(baseUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      timeout: 20000,
    })

    socketRef.current = socket

    socket.on("connect", () => {
      console.log("📊 [LIVE ODDS] Connected, subscribing to match:", { sid, gmid })
      socket.emit("subscribe_match", { sid, gmid })
    })

    socket.on("disconnect", () => {
      console.log("📊 [LIVE ODDS] Disconnected")
    })

    socket.on("connect_error", (err) => {
      console.error("❌ [LIVE ODDS] Connection error:", err)
    })

    const handleOddsUpdate = (data: any) => {
      console.log("📊 [LIVE ODDS] Received update:", data)
      setOdds(data)
    }

    socket.on("odds_update", handleOddsUpdate)

    return () => {
      console.log("📊 [LIVE ODDS] Unsubscribing from match:", { sid, gmid })
      if (socketRef.current?.connected) {
        socketRef.current.emit("unsubscribe_match", { sid, gmid })
        socketRef.current.off("odds_update", handleOddsUpdate)
      }
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [sid, gmid])

  return odds
}
