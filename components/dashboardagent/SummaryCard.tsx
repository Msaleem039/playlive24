import React from 'react'

interface SummaryCardProps {
  title: string
  value: string | number
  color?: 'green' | 'red' | 'black'
  className?: string
}

export function SummaryCard({ title, value, color = 'black', className = '' }: SummaryCardProps) {
  const colorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    black: 'text-black'
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className="bg-black text-white px-4 py-2">
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-6 text-center">
        <div className={`text-4xl font-bold ${colorClasses[color]}`}>
          {value}
        </div>
      </div>
    </div>
  )
}
