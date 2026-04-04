'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

const LIVE_TV_PLAYER_BASE = 'https://mis2.sqmr.xyz/ank.php'

interface LiveTVSectionProps {
  /** Fallback iframe URL if event id cannot be resolved (e.g. full https://... URL) */
  streamUrl: string
  liveToggle: boolean
  onToggleChange: (value: boolean) => void
  canToggleTV: boolean
  numericMatchId: number | null
  /** Preferred: API event id → https://mis2.sqmr.xyz/ank.php?eventId=... */
  eventId?: string | number | null
  isMobile?: boolean
  scorecard?: any
  matchData?: any
  variant?: 'mobile' | 'desktop'
}

export default function LiveTVSection({
  streamUrl,
  liveToggle,
  onToggleChange,
  canToggleTV,
  numericMatchId,
  eventId: eventIdProp,
  isMobile = false,
  scorecard,
  matchData,
  variant = 'mobile'
}: LiveTVSectionProps) {
  const [streamLoadError, setStreamLoadError] = useState(false)

  const resolvedEventId =
    eventIdProp ??
    matchData?.eventId ??
    matchData?.event_id ??
    numericMatchId

  const iframeSrc =
    resolvedEventId != null && String(resolvedEventId).trim() !== ''
      ? `${LIVE_TV_PLAYER_BASE}?eventId=${encodeURIComponent(String(resolvedEventId).trim())}`
      : streamUrl

  const handleRetry = () => {
    setStreamLoadError(false)
    // Force iframe reload by toggling
    onToggleChange(false)
    setTimeout(() => onToggleChange(true), 100)
  }

  const containerClass = variant === 'mobile' 
    ? 'bg-white flex flex-col sm:block md:hidden border-b border-gray-200'
    : 'hidden md:flex bg-white flex-col'

  const streamContainerStyle = variant === 'mobile'
    ? { minHeight: '200px', aspectRatio: '16/9' }
    : { minHeight: isMobile ? '200px' : '300px', aspectRatio: isMobile ? '16/9' : 'auto' }

  const streamKey = variant === 'mobile'
    ? `stream-sm-md-${numericMatchId}-${liveToggle}`
    : `stream-${numericMatchId}-${liveToggle}`

  const overlayId = variant === 'mobile'
    ? 'stream-loading-overlay'
    : 'stream-loading-overlay-desktop'

  return (
    <div className={containerClass}>
      {/* Live TV Toggle Header */}
      <div className="bg-[#00A66E] text-white px-3 sm:px-4 py-2 flex items-center justify-between flex-shrink-0">
        <span className={`${variant === 'mobile' ? 'text-xs sm:text-sm' : 'text-sm'} font-bold`}>Live TV</span>
        <button
          onClick={() => canToggleTV && onToggleChange(!liveToggle)}
          disabled={!canToggleTV}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            !canToggleTV 
              ? 'bg-gray-400 cursor-not-allowed opacity-50' 
              : liveToggle 
                ? 'bg-white' 
                : 'bg-gray-300'
          }`}
          title={
            !canToggleTV 
              ? 'Minimum wallet balance of Rs 200 required to access Live TV' 
              : liveToggle 
                ? 'Turn off Live TV' 
                : 'Turn on Live TV'
          }
        >
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform flex items-center justify-center ${
              !canToggleTV
                ? 'bg-gray-500'
                : liveToggle
                  ? 'bg-[#00A66E] translate-x-5'
                  : 'bg-[#00A66E] translate-x-0'
            }`}
          >
            {liveToggle && canToggleTV ? (
              <span className="text-white text-xs font-bold">✓</span>
            ) : (
              <span className={`text-xs font-bold ${!canToggleTV ? 'text-gray-300' : 'text-white'}`}>−</span>
            )}
          </div>
        </button>
      </div>
      
      {/* Live Video Stream - Only show when toggle is ON */}
      {liveToggle && (
        <div className="relative bg-gray-900 flex-shrink-0 flex items-center justify-center" style={streamContainerStyle}>
          {!streamLoadError ? (
            <>
              <iframe
                key={streamKey}
                src={iframeSrc}
                className="w-full h-full border-0 absolute inset-0"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                title="Live Match Stream"
                onLoad={() => {
                  console.log('[Stream] Stream iframe loaded successfully')
                  setStreamLoadError(false)
                }}
                onError={() => {
                  console.error('[Stream] Failed to load stream:', iframeSrc)
                  setStreamLoadError(true)
                }}
              />
              {/* Loading overlay - shown initially */}
              <div className={`absolute inset-0 bg-gray-900 flex items-center justify-center z-10 pointer-events-none opacity-0 transition-opacity duration-300`} id={overlayId}>
                <div className="text-center text-white px-4">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">Loading stream...</p>
                </div>
              </div>
            </>
          ) : (
            /* Error state when stream fails to load */
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
              <div className="text-center text-white px-4">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-bold mb-2">Stream Unavailable</p>
                <p className="text-xs opacity-75 mb-4">The live stream is not available at this time.</p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-[#00A66E] hover:bg-[#00C97A] text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
      
          
          {/* Stream Branding (Top Right) */}
          {/* <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-[10px] sm:text-xs font-bold">
            CANAL+ SPORT 360
          </div> */}
        </div>
      )}
    </div>
  )
}


