"use client"

import { useState } from "react"
import { Tv, Clock, Pin, Star, TrophyIcon } from "lucide-react"
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
    icon: <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold"><TrophyIcon/></div>,
    count: 0,
    component: CricketTab
  },
  {
    id: "soccer",
    name: "Soccer",
    icon: <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">S</div>,
    count: 0,
    component: SoccerTab
  },
  {
    id: "tennis",
    name: "Tennis",
    icon: <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">T</div>,
    count: 0,
    component: TennisTab
  },
  {
    id: "horse",
    name: "Horse",
    icon: <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold">H</div>,
    count: 0,
    component: HorseTab
  },
  {
    id: "greyhound",
    name: "Greyhound",
    icon: <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">G</div>,
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
      <div className="bg-gray-800 text-white">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8 overflow-x-auto no-scrollbar">
            {sportTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSport(tab.id)}
                className={`flex flex-col items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  activeSport === tab.id 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {tab.icon}
                  {tab.count > 0 && (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {tab.count}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium">{tab.name}</span>
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
