import React from 'react'
import { ChevronDown } from 'lucide-react'

interface AgentNavigationProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

const navigationItems = [
  'Dashboard',
  'User List',
  'Matches',
  'My Market',
  'Casino Analysis',
  'Game Controls',
  'Chip Summary',
  'Game List',
  'Detail Report'
]

export function AgentNavigation({ activeTab = 'Dashboard', onTabChange }: AgentNavigationProps) {
  return (
    <>
      {/* Main Navigation Header */}
      <div className="bg-[#00A66E] text-black">
        <div className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex justify-start sm:justify-center items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-6 xl:space-x-8 overflow-x-auto no-scrollbar scroll-smooth">
            {navigationItems.map((item) => (
              <button
                key={item}
                onClick={() => onTabChange?.(item)}
                className={`font-semibold flex items-center whitespace-nowrap text-[0.65rem] xs:text-[0.7rem] sm:text-[0.75rem] md:text-[0.8rem] transition-colors min-h-[36px] sm:min-h-[40px] px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 ${
                  item === 'Game Controls' ? 'hover:text-gray-200' : ''
                } ${
                  item === activeTab 
                    ? 'bg-white text-black rounded font-bold shadow-sm' 
                    : 'hover:text-gray-200 hover:bg-black/10 rounded'
                }`}
              >
                {item}
                {item === 'Game Controls' && (
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5 sm:ml-1 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="bg-black text-white px-2 sm:px-4 md:px-6 py-2">
        <h1 className="text-base sm:text-lg font-semibold">{activeTab}</h1>
      </div>
    </>
  )
}
