"use client"

import { useState } from "react"
import { Trophy, Globe, Sparkles, Crown, Dog } from "lucide-react"
import CricketTab from "@/components/dashboard-tabs/CricketTab"
import SoccerTab from "@/components/dashboard-tabs/SoccerTab"
import TennisTab from "@/components/dashboard-tabs/TennisTab"
import HorseTab from "@/components/dashboard-tabs/HorseTab"
import GreyhoundTab from "@/components/dashboard-tabs/GreyhoundTab"

interface SportTab {
  id: string
  name: string
  icon: React.ReactNode
  count: number
  component: React.ComponentType
}

const sportTabs: SportTab[] = [
  {
    id: "cricket",
    name: "Cricket",
    icon: (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-md">
        <Trophy className="h-4 w-4" />
      </div>
    ),
    count: 0,
    component: CricketTab
  },
  {
    id: "soccer",
    name: "Soccer",
    icon: (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
        <Globe className="h-4 w-4" />
      </div>
    ),
    count: 0,
    component: SoccerTab
  },
  {
    id: "tennis",
    name: "Tennis",
    icon: (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-white shadow-md">
        <Sparkles className="h-4 w-4" />
      </div>
    ),
    count: 0,
    component: TennisTab
  },
  {
    id: "horse",
    name: "Horse",
    icon: (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white shadow-md">
        <Crown className="h-4 w-4" />
      </div>
    ),
    count: 0,
    component: HorseTab
  },
  {
    id: "greyhound",
    name: "Greyhound",
    icon: (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-white shadow-md">
        <Dog className="h-4 w-4" />
      </div>
    ),
    count: 0,
    component: GreyhoundTab
  }
]

export default function MatchesView() {
  const [activeSport, setActiveSport] = useState("cricket")

  const activeTab = sportTabs.find(tab => tab.id === activeSport)
  const ActiveComponent = activeTab?.component || CricketTab

  return (
    <div className="bg-gray-100 mt-6">
      {/* Sport Navigation Header */}
      <div className="bg-gray-900 text-white shadow-sm">
        <div className="px-4 sm:px-6 py-2">
          <div className="flex items-center justify-start gap-3 sm:gap-5 overflow-x-auto no-scrollbar">
            {sportTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSport(tab.id)}
                className={`group flex items-center gap-2 rounded-full px-3 py-2 transition-colors ${
                  activeSport === tab.id 
                    ? 'bg-gray-800 text-white shadow-inner'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab.icon}
                <span className="text-sm font-semibold tracking-wide">
                  {tab.name}
                </span>
                {tab.count > 0 && (
                  <span className="flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sport Content */}
      <div className="p-4 sm:p-6">
        <ActiveComponent />
      </div>
    </div>
  )
}
