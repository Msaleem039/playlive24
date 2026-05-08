"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  liveSocketClient,
  type BookmakerFancyUpdateEvent,
  type LiveConnectionStatus,
  type OddsUpdateEvent,
} from "@/app/services/liveSocketClient"

const isDev = process.env.NODE_ENV === "development"

function devLog(message: string, payload?: unknown) {
  if (!isDev) return
  if (payload !== undefined) {
    console.log(`[useLiveMarketSocket] ${message}`, payload)
    return
  }
  console.log(`[useLiveMarketSocket] ${message}`)
}

interface UseLiveMarketSocketParams {
  enabled: boolean
  eventId: string
  marketIds: string[]
}

interface UseLiveMarketSocketReturn {
  oddsData: unknown | null
  bookmakerFancyData: unknown | null
  lastUpdated: number | null
  connectionStatus: LiveConnectionStatus
  shouldPollFallback: boolean
}

export function useLiveMarketSocket({
  enabled,
  eventId,
  marketIds,
}: UseLiveMarketSocketParams): UseLiveMarketSocketReturn {
  const [oddsData, setOddsData] = useState<unknown | null>(null)
  const [bookmakerFancyData, setBookmakerFancyData] = useState<unknown | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<LiveConnectionStatus>("offline")
  const [shouldPollFallback, setShouldPollFallback] = useState(false)

  const lastOddsUpdatedAtRef = useRef<number>(0)
  const lastBookmakerUpdatedAtRef = useRef<number>(0)
  const disconnectedAtRef = useRef<number | null>(null)

  const marketIdsString = useMemo(() => {
    if (!Array.isArray(marketIds) || marketIds.length === 0) return ""
    return marketIds
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0)
      .join(",")
  }, [marketIds])

  useEffect(() => {
    if (!enabled || !eventId) {
      setConnectionStatus("offline")
      setShouldPollFallback(false)
      return
    }

    const socket = liveSocketClient.connect()

    const handleConnect = () => {
      setConnectionStatus("live")
      setShouldPollFallback(false)
      disconnectedAtRef.current = null
      liveSocketClient.subscribeOdds(eventId, marketIdsString)
      liveSocketClient.subscribeBookmakerFancy(eventId, marketIdsString || undefined)
      devLog("connected and subscribed", { eventId, marketIdsString })
    }

    const handleDisconnect = (reason: string) => {
      setConnectionStatus("reconnecting")
      disconnectedAtRef.current = Date.now()
      devLog("disconnected", { reason })
    }

    const handleConnectError = (error: Error) => {
      setConnectionStatus("reconnecting")
      if (!disconnectedAtRef.current) {
        disconnectedAtRef.current = Date.now()
      }
      devLog("connect error", { message: error?.message })
    }

    const handleOddsUpdate = (payload: OddsUpdateEvent) => {
      if (!payload || payload.eventId !== eventId) return
      const nextUpdatedAt = Number(payload.updatedAt || 0)
      if (nextUpdatedAt <= lastOddsUpdatedAtRef.current) {
        return
      }
      lastOddsUpdatedAtRef.current = nextUpdatedAt
      setOddsData(payload.data)
      setLastUpdated(nextUpdatedAt)
      setShouldPollFallback(false)
      setConnectionStatus("live")
    }

    const handleBookmakerFancyUpdate = (payload: BookmakerFancyUpdateEvent) => {
      if (!payload || payload.eventId !== eventId) return
      const nextUpdatedAt = Number(payload.updatedAt || 0)
      if (nextUpdatedAt <= lastBookmakerUpdatedAtRef.current) {
        return
      }
      lastBookmakerUpdatedAtRef.current = nextUpdatedAt
      setBookmakerFancyData(payload.data)
      setLastUpdated(nextUpdatedAt)
      setShouldPollFallback(false)
      setConnectionStatus("live")
    }

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("connect_error", handleConnectError)
    socket.on("odds:update", handleOddsUpdate)
    socket.on("bookmaker-fancy:update", handleBookmakerFancyUpdate)

    if (socket.connected) {
      handleConnect()
    } else {
      setConnectionStatus("reconnecting")
    }

    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("connect_error", handleConnectError)
      socket.off("odds:update", handleOddsUpdate)
      socket.off("bookmaker-fancy:update", handleBookmakerFancyUpdate)
      liveSocketClient.unsubscribeOdds(eventId, marketIdsString)
      liveSocketClient.unsubscribeBookmakerFancy(eventId)
      liveSocketClient.disconnect()
      setShouldPollFallback(false)
      setConnectionStatus("offline")
      disconnectedAtRef.current = null
    }
  }, [enabled, eventId, marketIdsString])

  useEffect(() => {
    if (!enabled || connectionStatus === "live") {
      setShouldPollFallback(false)
      return
    }

    const timer = window.setInterval(() => {
      if (!disconnectedAtRef.current) return
      const elapsed = Date.now() - disconnectedAtRef.current
      if (elapsed > 5000) {
        setShouldPollFallback(true)
        setConnectionStatus("offline")
      }
    }, 500)

    return () => window.clearInterval(timer)
  }, [enabled, connectionStatus])

  return {
    oddsData,
    bookmakerFancyData,
    lastUpdated,
    connectionStatus,
    shouldPollFallback,
  }
}
