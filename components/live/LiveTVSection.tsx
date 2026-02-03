'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface LiveTVSectionProps {
  streamUrl: string
  liveToggle: boolean
  onToggleChange: (value: boolean) => void
  canToggleTV: boolean
  numericMatchId: number | null
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
  isMobile = false,
  scorecard,
  matchData,
  variant = 'mobile'
}: LiveTVSectionProps) {
  const [streamLoadError, setStreamLoadError] = useState(false)

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
        <span className={`${variant === 'mobile' ? 'text-xs sm:text-sm' : 'text-sm'} font-semibold`}>Live TV</span>
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
                src={streamUrl}
                className="w-full h-full border-0 absolute inset-0"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                title="Live Match Stream"
                onLoad={() => {
                  console.log('[Stream] Stream iframe loaded successfully')
                  setStreamLoadError(false)
                }}
                onError={() => {
                  console.error('[Stream] Failed to load stream:', streamUrl)
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
                <p className="text-sm font-medium mb-2">Stream Unavailable</p>
                <p className="text-xs opacity-75 mb-4">The live stream is not available at this time.</p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-[#00A66E] hover:bg-[#00C97A] text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          {/* Video Overlay - Score and Match Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 sm:p-3 text-white">
            {/* Current Score Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm font-semibold gap-1">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="truncate">{(scorecard?.team1?.shortName || matchData?.ename?.split(/\s+v\s+/i)[0] || 'Team A')?.toUpperCase()}</span>
                <span>{scorecard?.team1?.score || '0-0'}</span>
                <span className="text-[5px] sm:text-xs font-normal text-gray-300">{scorecard?.team1?.overs || '0'}</span>
              </div>
              <div className="text-[5px] sm:text-xs text-gray-300 truncate">
                {(scorecard?.team2?.shortName || matchData?.ename?.split(/\s+v\s+/i)[1] || 'Team B')?.toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* Stream Branding (Top Right) */}
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-[10px] sm:text-xs font-semibold">
            CANAL+ SPORT 360
          </div>
        </div>
      )}
    </div>
  )
}


