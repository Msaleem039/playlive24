"use client"
import { motion } from "framer-motion"
import GameCard from "@/components/utils/game-card"
import { topGames } from "@/lib/sport"

type GamesSectionProps = {
  title?: string
}

export default function GamesSection({ title = "Popular Games" }: GamesSectionProps) {
  return (
    <section className="bg-black py-10 pt-10">
      <div className="max-w-7xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-white mb-6"
        >
          <span className="text-teal-400">Popular</span> Games
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {topGames.map((game, index) => (
            <GameCard key={game.id} game={game} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}


