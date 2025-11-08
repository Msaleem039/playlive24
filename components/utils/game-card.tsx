"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { topGames } from "@/lib/sport"
import type { Game } from "@/lib/sport"
import GameModal from "../modal/GameModal"

type GameCardProps = {
  game?: Game
  gameId?: number
  index?: number
}

export default function GameCard({ game, gameId, index = 0 }: GameCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const resolvedGame: Game | undefined = game ?? topGames.find((g) => g.id === gameId)
  
  if (!resolvedGame) return null

  const handleCardClick = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.05, y: -5 }}
        onClick={handleCardClick}
        className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl overflow-hidden cursor-pointer group"
      >
        <div className="aspect-[4/3] relative">
          <img
            src={resolvedGame.imageUrl || "/placeholder.svg"}
            alt={resolvedGame.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement
              if (target.src.endsWith("/placeholder.svg")) return
              target.src = "/placeholder.svg"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p className="text-sm font-medium">Click to Play</p>
            </div>
          </div>

          <div className="absolute bottom-2 left-2 right-2">
            <h3 className="text-white font-bold text-sm">{resolvedGame.name}</h3>
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <GameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        game={resolvedGame}
      />
    </>
  )
}


