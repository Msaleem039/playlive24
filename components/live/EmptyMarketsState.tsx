'use client'

import { RefreshCw } from 'lucide-react'

interface EmptyMarketsStateProps {
  title?: string
  message?: string
  onRefresh: () => void
}

export default function EmptyMarketsState({ 
  title = 'No Markets Available',
  message = 'Betting markets are not available for this match at the moment. Please check back later.',
  onRefresh 
}: EmptyMarketsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A66E] text-white rounded-lg hover:bg-[#00C97A] transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    </div>
  )
}


