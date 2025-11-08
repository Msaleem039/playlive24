"use client"
import { motion, AnimatePresence } from "framer-motion"
import { X, Play, Lock, Star, Trophy, Users, Gamepad2, Zap } from "lucide-react"
import { Game } from "@/lib/sport"
import Link from "next/link"

interface GameModalProps {
  isOpen: boolean
  onClose: () => void
  game: Game | null
}

export default function GameModal({ isOpen, onClose, game }: GameModalProps) {
  if (!game) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Enhanced Blurred Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-xl"
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-[#0f0f0f]/60 to-[#111]/60" />
            
            {/* Animated Pattern Background */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%2330967c%22%20fill-opacity%3D%220.08%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
            
            {/* Floating Game Icons */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="text-[#30967c]/20 text-8xl"
              >
                🎮
              </motion.div>
            </div>
          </motion.div>

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
            className="relative z-10 w-full max-w-lg"
          >
            {/* Transparent Glassmorphic Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-[0_0_40px_rgba(0,255,102,0.2)] relative overflow-hidden"
            >
              {/* Cross Button with Blink Animation */}
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
                animate={{ 
                  opacity: [0.6, 1, 0.6],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-6 h-6" />
              </motion.button>

              {/* Game Header */}
              <div className="text-center mb-8">
                {/* <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="w-20 h-20 bg-gradient-to-br from-[#30967c] to-[#2a7f6a] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.5)]"
                > */}
                  {/* <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="text-3xl"
                  >
                    🎮
                  </motion.div>
                </motion.div> */}

                {/* <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-extrabold text-[#30967c] mb-2"
                >
                  {game.name} */}
                {/* </motion.h1>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-2 text-white/80 text-sm"
                >
                  <Trophy className="w-4 h-4" />
                  <span>{game.genre}</span>
                  <span>•</span>
                  <span>{game.type}</span>
                </motion.div> */}

                {/* Live Indicator */}
                {/* <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-full text-sm font-medium"
                > */}
                  {/* <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-red-400 rounded-full"
                  />
                  LIVE GAME
                </motion.div> */}
              </div>

              {/* Login Prompt */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center mb-8"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                  <Lock className="w-8 h-8 text-yellow-400" />
                </motion.div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  Please Login to Play
                </h3>
                {/* <p className="text-white/70 mb-6">
                  Sign in to access live games, place bets, and enjoy the full gaming experience!
                </p> */}
              </motion.div>

              {/* Features */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-4 mb-8"
              >
                {[
                  { icon: Play, text: "Live streaming and real-time updates", color: "green" },
                  { icon: Users, text: "Join thousands of active players", color: "blue" },
                  { icon: Star, text: "Exclusive bonuses and rewards", color: "purple" }
                ].map((feature, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center gap-3 text-white/80"
                  >
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2 + index * 0.5, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className={`w-10 h-10 bg-${feature.color}-500/20 border border-${feature.color}-500/30 rounded-xl flex items-center justify-center`}
                    >
                      <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
                    </motion.div>
                    <span className="text-sm">{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="space-y-3"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-gradient-to-r from-[#30967c] to-[#2a7f6a] text-white font-bold py-4 px-6 rounded-xl hover:from-[#2a7f6a] hover:to-[#1f5f4a] transition-all duration-300 shadow-[0_0_20px_rgba(0,255,102,0.3)]"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    Login to Play Now
                  </motion.div>
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
