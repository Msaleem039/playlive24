import React from 'react'
import { ChevronDown } from 'lucide-react'

interface SharedNavigationProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'CLIENT'
}

// Define navigation items for each role
const roleNavigationItems = {
  SUPER_ADMIN: [
    'Dashboard',
    'User Management',
    'Matches',
    'My Market',
    'Casino Analysis',
    'Game Controls',
    'System Settings',
    'Reports',
    'Detail Report',
    'Complaints'
  ],
  ADMIN: [
    'Dashboard',
    'User List',
    'Matches',
    'My Market',
    'Casino Analysis',
    'Game Controls',
    'Chip Summary',
    'Game List',
    'Detail Report'
  ],
  AGENT: [
    'Dashboard',
    'User List',
    'Matches',
    'My Market',
    'Casino Analysis',
    'Game Controls',
    'Chip Summary',
    'Game List',
    'Detail Report'
  ],
  CLIENT: [
    'Dashboard',
    'My Bets',
    'Matches',
    'Account Statement',
    'Bet History',
    'Profit Loss'
  ]
}

export function SharedNavigation({ activeTab = 'Dashboard', onTabChange, role = 'AGENT' }: SharedNavigationProps) {
  const navigationItems = roleNavigationItems[role] || roleNavigationItems.AGENT

  return (
    <>
      {/* Main Navigation Header */}
      <div className="bg-[#00A66E] text-black text-[0.65rem]">
        <div className="px-4 sm:px-6 py-3 ">
          <div className="flex justify-center items-center space-x-4 sm:space-x-4 lg:space-x-6 overflow-x-auto no-scrollbar">
            {navigationItems.map((item) => (
              <button
                key={item}
                onClick={() => onTabChange?.(item)}
                className={`font-semibold flex items-center whitespace-nowrap text-[0.75rem] transition-colors ${
                  item === 'Game Controls' ? 'hover:text-gray-200' : ''
                } ${
                  item === activeTab ? 'bg-white text-black px-3 py-1 rounded font-bold' : 'hover:text-gray-200'
                }`}
              >
                {item}
                {item === 'Game Controls' && (
                  <ChevronDown className="w-4 h-4 ml-1" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="bg-black text-white px-4 sm:px-6 py-2">
        <h1 className="text-lg font-semibold">{activeTab}</h1>
      </div>
    </>
  )
}

