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
    socket.on("connect_error", (err) => {
      console.error("⛔ Connection error:", err.message)
      setError(err.message)
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
-------------------------------------------------------------- */
export function useLiveOdds(sid: number | null, gmid: number | null) {
  const [odds, setOdds] = useState<any>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!sid || !gmid) return setOdds(null)

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
      console.log("📊 [LIVE ODDS] Connected:", { sid, gmid })
      socket.emit("subscribe_match", { sid, gmid })
    })

    socket.on("disconnect", () => console.warn("📊 Live odds disconnected"))
    socket.on("connect_error", (e) => console.error("📊 Live odds error:", e))

    socket.on("odds_update", setOdds)
    socket.on("webhook_update", setOdds)

    return () => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("unsubscribe_match", { sid, gmid })
      }
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [sid, gmid])

  return odds
}
