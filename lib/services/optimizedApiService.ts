import { useDispatch, useSelector } from 'react-redux'
import { CricketMatch, CricketMatchesResponse } from '@/lib/types/cricket'

interface ApiServiceOptions {
  baseUrl?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
}

class OptimizedApiService {
  private baseUrl: string
  private timeout: number
  private retryAttempts: number
  private retryDelay: number

  constructor(options: ApiServiceOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000'
    this.timeout = options.timeout || 10000
    this.retryAttempts = options.retryAttempts || 3
    this.retryDelay = options.retryDelay || 1000
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}): Promise<Response> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          return response
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      } catch (error) {
        lastError = error as Error
        
        if (attempt < this.retryAttempts) {
          console.warn(`API request failed (attempt ${attempt}/${this.retryAttempts}):`, error)
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
        }
      }
    }
    
    throw lastError || new Error('API request failed after all retry attempts')
  }

  async fetchCricketMatches(params: {
    page?: number
    per_page?: number
    status?: number
    format?: number
  } = {}): Promise<CricketMatchesResponse> {
    const searchParams = new URLSearchParams()
    
    searchParams.append('page', (params.page || 1).toString())
    searchParams.append('per_page', (params.per_page || 20).toString())
    
    if (params.status !== undefined) {
      searchParams.append('status', params.status.toString())
    }
    
    if (params.format !== undefined) {
      searchParams.append('format', params.format.toString())
    }

    const url = `${this.baseUrl}/entitysport/cricket/exchange/matches?${searchParams.toString()}`
    
    const response = await this.fetchWithRetry(url)
    const data: CricketMatchesResponse = await response.json()
    
    if (data.status !== 'ok') {
      throw new Error('API returned error status')
    }
    
    return data
  }

  async fetchMatchDetails(matchId: string): Promise<CricketMatch | null> {
    try {
      const url = `${this.baseUrl}/entitysport/cricket/exchange/matches/${matchId}`
      const response = await this.fetchWithRetry(url)
      const data = await response.json()
      
      return data.status === 'ok' ? data.response : null
    } catch (error) {
      console.error('Failed to fetch match details:', error)
      return null
    }
  }
}

// Singleton instance
export const apiService = new OptimizedApiService()

// React hook for cricket matches with optimized data fetching
export const useOptimizedCricketMatches = (params: {
  page?: number
  per_page?: number
  status?: number
  format?: number
} = {}) => {
  const dispatch = useDispatch()
  const { matches, loading, error } = useSelector((state: any) => ({
    matches: state.cricket?.matches || [],
    loading: state.cricket?.loading || false,
    error: state.cricket?.error || null
  }))

  const fetchMatches = async () => {
    dispatch({ type: 'cricket/setLoading', payload: true })
    dispatch({ type: 'cricket/setError', payload: null })
    
    try {
      const data = await apiService.fetchCricketMatches(params)
      dispatch({ type: 'cricket/setMatches', payload: data.response.items })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      dispatch({ type: 'cricket/setError', payload: errorMessage })
      dispatch({ type: 'cricket/setMatches', payload: [] })
    } finally {
      dispatch({ type: 'cricket/setLoading', payload: false })
    }
  }

  return {
    matches,
    loading,
    error,
    refetch: fetchMatches
  }
}
