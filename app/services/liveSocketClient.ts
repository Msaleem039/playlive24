"use client"

import { io, type Socket } from "socket.io-client"
import { BASE_URL } from "./ApiEndpoints"

export type LiveConnectionStatus = "live" | "reconnecting" | "offline"

export interface SubscribeOddsPayload {
  eventId: string
  marketIds: string
}

export interface SubscribeBookmakerFancyPayload {
  eventId: string
  marketIds?: string
}

export interface OddsUpdateEvent<TData = unknown> {
  eventId: string
  marketIds: string[]
  data: TData
  updatedAt: number
}

export interface BookmakerFancyUpdateEvent<TData = unknown> {
  eventId: string
  data: TData
  updatedAt: number
}

const isDev = process.env.NODE_ENV === "development"

function debugLog(message: string, payload?: unknown) {
  if (!isDev) return
  if (payload !== undefined) {
    console.log(`[LiveSocket] ${message}`, payload)
    return
  }
  console.log(`[LiveSocket] ${message}`)
}

class LiveSocketClient {
  private socket: Socket | null = null

  connect() {
    if (this.socket?.connected) return this.socket

    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
    }

    this.socket = io(BASE_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 15000,
      autoConnect: true,
    })

    debugLog("connecting", { baseUrl: BASE_URL })
    return this.socket
  }

  disconnect() {
    if (!this.socket) return
    debugLog("disconnecting")
    this.socket.removeAllListeners()
    this.socket.disconnect()
    this.socket = null
  }

  getSocket() {
    return this.socket
  }

  subscribeOdds(eventId: string, marketIds: string) {
    if (!this.socket) return
    const payload: SubscribeOddsPayload = { eventId, marketIds }
    this.socket.emit("subscribe:odds", payload)
    debugLog("subscribe:odds", payload)
  }

  unsubscribeOdds(eventId: string, marketIds: string) {
    if (!this.socket) return
    const payload: SubscribeOddsPayload = { eventId, marketIds }
    this.socket.emit("unsubscribe:odds", payload)
    debugLog("unsubscribe:odds", payload)
  }

  subscribeBookmakerFancy(eventId: string, marketIds?: string) {
    if (!this.socket) return
    const payload: SubscribeBookmakerFancyPayload = marketIds
      ? { eventId, marketIds }
      : { eventId }
    this.socket.emit("subscribe:bookmaker-fancy", payload)
    debugLog("subscribe:bookmaker-fancy", payload)
  }

  unsubscribeBookmakerFancy(eventId: string) {
    if (!this.socket) return
    const payload = { eventId }
    this.socket.emit("unsubscribe:bookmaker-fancy", payload)
    debugLog("unsubscribe:bookmaker-fancy", payload)
  }
}

export const liveSocketClient = new LiveSocketClient()
