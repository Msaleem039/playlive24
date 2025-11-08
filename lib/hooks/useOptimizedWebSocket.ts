"use client"

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useDispatch } from 'react-redux'
import { CricketMatch } from '@/lib/types/cricket'

interface UseOptimizedWebSocketOptions {
  url?: string
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
  batchSize?: number
  batchDelay?: number
}

// RequestAnimationFrame batching for high-frequency updates
class UpdateBatcher {
  private pendingUpdates: Array<{ matchId: string; updates: Partial<CricketMatch> }> = []
  private batchTimeout: NodeJS.Timeout | null = null
  private rafId: number | null = null
  
  constructor(
    private batchCallback: (updates: Array<{ matchId: string; updates: Partial<CricketMatch> }>) => void,
    private batchDelay: number = 16 // ~60fps
  ) {}
  
  addUpdate(matchId: string, updates: Partial<CricketMatch>) {
    this.pendingUpdates.push({ matchId, updates })
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
    }
    
    this.rafId = requestAnimationFrame(() => {
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout)
      }
      
      this.batchTimeout = setTimeout(() => {
        if (this.pendingUpdates.length > 0) {
          this.batchCallback([...this.pendingUpdates])
          this.pendingUpdates = []
        }
        this.rafId = null
        this.batchTimeout = null
      }, this.batchDelay)
    })
  }
  
  flush() {
    if (this.pendingUpdates.length > 0) {
      this.batchCallback([...this.pendingUpdates])
      this.pendingUpdates = []
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
  }
}

export const useOptimizedWebSocket = (options: UseOptimizedWebSocketOptions = {}) => {
  const {
    url = 'http://localhost:3000',
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 3000,
    batchDelay = 16
  } = options

  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const batcherRef = useRef<UpdateBatcher | null>(null)
  
  const dispatch = useDispatch()

  // Initialize batcher
  useEffect(() => {
    batcherRef.current = new UpdateBatcher((updates) => {
      // Dispatch batch updates to Redux store
      dispatch({ type: 'cricket/batchUpdateMatches', payload: updates })
    }, batchDelay)
    return () => {
      batcherRef.current?.flush()
    }
  }, [dispatch, batchDelay])

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    dispatch({ type: 'websocket/setConnecting', payload: true })

    try {
      // Disconnect existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect()
      }

      // Create new socket connection
      const socket = io(url, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      })

      socketRef.current = socket

      // Connection event handlers
      socket.on('connect', () => {
        console.log('WebSocket connected:', socket.id)
        dispatch({ type: 'websocket/setConnected', payload: true })
        reconnectAttemptsRef.current = 0
      })

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason)
        dispatch({ type: 'websocket/setConnected', payload: false })
        
        // Attempt reconnection if not manually disconnected
        if (reason !== 'io client disconnect' && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++
          console.log(`Attempting reconnection ${reconnectAttemptsRef.current}/${reconnectAttempts}`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectDelay)
        }
      })

      socket.on('connect_error', (err) => {
        console.error('WebSocket connection error:', err)
        dispatch({ 
          type: 'websocket/setError', 
          payload: err.message || 'Connection failed' 
        })
      })

      // Live data handlers
      socket.on('liveUpdate', (data: { matches: CricketMatch[] }) => {
        console.log('Received live update:', data)
        dispatch({ type: 'cricket/setMatches', payload: data.matches || [] })
        dispatch({ type: 'websocket/setLastUpdate', payload: new Date() })
      })

      socket.on('matchUpdate', (data: { matchId: string; updates: Partial<CricketMatch> }) => {
        if (batcherRef.current) {
          batcherRef.current.addUpdate(data.matchId, data.updates)
        }
      })

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err)
      dispatch({ 
        type: 'websocket/setError', 
        payload: 'Failed to create connection' 
      })
    }
  }, [url, reconnectAttempts, reconnectDelay, dispatch])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    
    dispatch({ type: 'websocket/setConnected', payload: false })
    reconnectAttemptsRef.current = 0
  }, [dispatch])

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn('Socket not connected. Cannot emit event:', event)
    }
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    emit
  }
}
