import { useSelector } from 'react-redux'
import { CricketMatch } from '@/lib/types/cricket'

// Redux selectors for optimized subscriptions
export const useCricketMatches = () => {
  return useSelector((state: any) => ({
    matches: state.cricketApi?.queries || [],
    loading: state.cricketApi?.isLoading || false,
    error: state.cricketApi?.error || null
  }))
}

export const useWebSocketStatus = () => {
  return useSelector((state: any) => ({
    isConnected: state.websocket?.isConnected || false,
    isConnecting: state.websocket?.isConnecting || false,
    error: state.websocket?.error || null,
    lastUpdate: state.websocket?.lastUpdate || null
  }))
}

export const useMatchById = (matchId: string) => {
  return useSelector((state: any) => {
    // This would need to be implemented based on your cricket API structure
    return null
  })
}
