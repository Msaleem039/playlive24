'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/app/store/slices/authSlice'

interface AgentNavigationProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

const allNavigationItems = [
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
  const authUser = useSelector(selectCurrentUser)
  const currentRole = (authUser?.role as string) || ''
  const isSuperAdmin = ['SUPER_ADMIN', 'SUPERADMIN'].includes(currentRole.toUpperCase()) || (currentRole.toUpperCase().includes('SUPER') && currentRole.toUpperCase().includes('ADMIN'))
  const navigationItems = isSuperAdmin ? allNavigationItems : allNavigationItems.filter((item) => item !== 'Game Controls')

  return (
    <>
      {/* Main Navigation Header */}
      <div className="bg-[#064e3b] border-t border-[#047857]/60">
        <div className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex justify-start sm:justify-center items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-6 xl:space-x-8 overflow-x-auto no-scrollbar scroll-smooth">
            {navigationItems.map((item) => (
              <button
                key={item}
                onClick={() => onTabChange?.(item)}
                className={`font-bold flex items-center whitespace-nowrap text-[0.65rem] xs:text-[0.7rem] sm:text-[0.75rem] md:text-[0.8rem] transition-colors min-h-[36px] sm:min-h-[40px] px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 ${
                  item === activeTab
                    ? "bg-[#fbbf24] text-black rounded-t-md shadow-sm"
                    : "text-white hover:bg-white/10 rounded-lg"
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
      <div className="bg-[#064e3b] text-white px-2 sm:px-4 md:px-6 py-2 border-t border-[#047857]/60">
        <h1 className="text-base sm:text-lg font-bold">{activeTab}</h1>
      </div>
    </>
  )
}
