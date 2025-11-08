"use client"

import { useState, useRef, useEffect } from "react"
import { 
  ChevronDown, 
  Lock, 
  FileText, 
  BarChart3, 
  ClipboardList, 
  History, 
  Calculator,
  TrendingUp,
  LogOut
} from "lucide-react"

interface UserDropdownProps {
  isOpen: boolean
  onClose: () => void
  onMenuClick: (menuItem: string) => void
}

export function UserDropdown({ isOpen, onClose, onMenuClick }: UserDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const menuItems = [
    {
      id: 'change-password',
      label: 'Change Password',
      icon: <Lock className="w-4 h-4 text-yellow-500" />,
      onClick: () => onMenuClick('change-password')
    },
    {
      id: 'my-report',
      label: 'My Report',
      icon: <FileText className="w-4 h-4 text-yellow-500" />,
      onClick: () => onMenuClick('my-report')
    },
    {
      id: 'account-statement',
      label: 'Account Statement',
      icon: <BarChart3 className="w-4 h-4 text-yellow-500" />,
      onClick: () => onMenuClick('account-statement')
    },
    {
      id: 'current-bets',
      label: 'Current Bets',
      icon: <ClipboardList className="w-4 h-4 text-yellow-500" />,
      onClick: () => onMenuClick('current-bets')
    },
    {
      id: 'bet-history',
      label: 'Bet History',
      icon: <History className="w-4 h-4 text-yellow-500" />,
      onClick: () => onMenuClick('bet-history')
    },
    {
      id: 'balance-sheet',
      label: 'Balance Sheet',
      icon: <Calculator className="w-4 h-4 text-yellow-500" />,
      onClick: () => onMenuClick('balance-sheet')
    },
    {
      id: 'settlement-summary',
      label: 'Settlement Summary',
      icon: <TrendingUp className="w-4 h-4 text-yellow-500" />,
      onClick: () => onMenuClick('settlement-summary')
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: <LogOut className="w-4 h-4 text-red-500" />,
      onClick: () => onMenuClick('logout'),
      isLogout: true
    }
  ]

  if (!isOpen) return null

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
      {/* User Info Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900">Online70</span>
          <span className="text-sm text-gray-600">GMT+5:00</span>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        {menuItems.map((item, index) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
              item.isLogout ? 'hover:bg-gray-800 hover:text-white' : ''
            }`}
          >
            {item.icon}
            <span className={`text-sm font-medium ${item.isLogout ? 'text-gray-900' : 'text-gray-700'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
