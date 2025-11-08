"use client"

import { useState } from "react"
import { Settings, Play, Pause, Square } from "lucide-react"

export default function GameControlsView() {
  const [games, setGames] = useState([
    { id: 1, name: "Aviator", status: "active", minBet: 10, maxBet: 10000 },
    { id: 2, name: "Indian Poker", status: "inactive", minBet: 5, maxBet: 5000 },
    { id: 3, name: "Casino", status: "active", minBet: 20, maxBet: 20000 },
  ])

  const toggleGameStatus = (id: number) => {
    setGames(games.map(game => 
      game.id === id 
        ? { ...game, status: game.status === "active" ? "inactive" : "active" }
        : game
    ))
  }

  return (
    <div className="bg-gray-100">
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#00A66E]" />
              <h2 className="text-lg font-semibold text-gray-900">Game Controls</h2>
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-4">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{game.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Min Bet: <strong>${game.minBet}</strong></span>
                      <span>Max Bet: <strong>${game.maxBet}</strong></span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        game.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {game.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleGameStatus(game.id)}
                      className={`p-2 rounded transition-colors ${
                        game.status === "active"
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      {game.status === "active" ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <button className="p-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Game Button */}
            <button className="mt-4 w-full py-3 bg-[#00A66E] hover:bg-[#00b97b] text-white font-semibold rounded-lg transition-colors">
              + Add New Game
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
