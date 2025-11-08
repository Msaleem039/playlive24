"use client"

import { Wifi, WifiOff, Loader2 } from "lucide-react"

interface ConnectionIndicatorProps {
  isConnected: boolean
  isConnecting: boolean
  error?: string | null
  lastUpdate?: Date | null
  className?: string
}

export default function ConnectionIndicator({ 
  isConnected, 
  isConnecting, 
  error, 
  lastUpdate,
  className = "" 
}: ConnectionIndicatorProps) {
  const getStatusColor = () => {
    if (isConnecting) return "text-yellow-600"
    if (isConnected) return "text-green-600"
    if (error) return "text-red-600"
    return "text-gray-600"
  }

  const getStatusText = () => {
    if (isConnecting) return "Connecting..."
    if (isConnected) return "Connected"
    if (error) return "Disconnected"
    return "Offline"
  }

  const getStatusIcon = () => {
    if (isConnecting) {
      return <Loader2 className="w-4 h-4 animate-spin" />
    }
    if (isConnected) {
      return <Wifi className="w-4 h-4" />
    }
    return <WifiOff className="w-4 h-4" />
  }

  const formatLastUpdate = () => {
    if (!lastUpdate) return ""
    
    const now = new Date()
    const diffMs = now.getTime() - lastUpdate.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60)
      return `${minutes}m ago`
    } else {
      const hours = Math.floor(diffSeconds / 3600)
      return `${hours}h ago`
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">
          {getStatusText()}
        </span>
      </div>
      
      {isConnected && lastUpdate && (
        <div className="text-xs text-gray-500">
          Last update: {formatLastUpdate()}
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-500 max-w-32 truncate" title={error}>
          {error}
        </div>
      )}
    </div>
  )
}

