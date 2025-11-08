"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/utils/button"
import Link from "next/link"
import Logo from "./utils/Logo"
import LoginModal from "./modal/LoginModal"
import SignupModal from "./modal/SignupModal"

export default function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)

  const openLoginModal = () => {
    setIsSignupModalOpen(false)
    setIsLoginModalOpen(true)
  }

  const openSignupModal = () => {
    setIsLoginModalOpen(false)
    setIsSignupModalOpen(true)
  }

  const closeModals = () => {
    setIsLoginModalOpen(false)
    setIsSignupModalOpen(false)
  }

  return (
    <header className="bg-black">
      {/* Top bar (dark) */}
      <div className="bg-black">
        <div className="w-full px-4 sm:px-8 py-2 flex items-center justify-between">
        <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="text-3xl font-extrabold tracking-wide"
    >
<p
  className="text-transparent bg-clip-text"
  style={{
    backgroundImage: "linear-gradient(90deg, #FFD700, #FFFF33)", // shades of yellow
    // textShadow: `
    //   0 0 6px #FFD70099,
    //   0 0 12px #FFD700CC,
    //   0 0 18px #FFFF3399,
    //   1px 1px 3px #00000080
    // `,
    fontSize: "1rem",	
    WebkitTextStroke: "0.5px rgba(255,255,255,0.2)",
  }}
>
  PlayLive <span className="text-green-400">7</span>/24
  {/* <Logo /> */}
</p>


    </motion.div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={openLoginModal}
              className="bg-black border border-[#00A66E]  text-[#00A66E] font-bold px-5 py-1.5 rounded hover:bg-[#00A66E] hover:text-black transition-all duration-300"
            >
              Login
            </Button>
            {/* <Button 
              onClick={openSignupModal}
              className="bg-black border border-[#00A66E]  text-[#00A66E] font-bold px-5 py-1.5 rounded hover:bg-[#00A66E] hover:text-black transition-all duration-300"
            >
              Register
            </Button> */}
          </div>
        </div>
      </div>

      {/* Nav bar (green, reduced height) - always visible with horizontal scroll on small screens */}
      <div className="bg-black w-full">
        <nav className="w-full flex justify-center px-0 sm:px-6 bg-[#00A66E] h-10">
          <ul className="w-full flex justify-center items-center gap-4 sm:gap-8 py-2 bg-[#00A66E] overflow-x-auto whitespace-nowrap no-scrollbar">
            {[
              { label: "HOME", icon: "🏠" },
              { label: "CRICKET", icon: "🏏" },
              { label: "SOCCER", icon: "⚽" },
              { label: "TENNIS", icon: "🎾" },
              { label: "HORSE", icon: "🐎" },
              { label: "GREYHOUND", icon: "🐕" },
              // { label: "SPORTS BOOK", icon: "📗" },
              { label: "VIRTUAL SPORTS", icon: "🎮" },
              { label: "LIVE CASINO", icon: "🎰" },
            ].map((item) => (
              <li key={item.label} className="shrink-0 relative group">
                <Link
                  href="#"
                  className="uppercase font-bold text-black hover:text-white transition-colors text-[0.75rem] tracking-wide flex items-center gap-2 px-3 py-2 rounded"
                >
                  <span aria-hidden>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
                {/* Hover line indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Floating Complain Button */}
      <motion.button
        onClick={() => window.open('mailto:support@playlive7.com?subject=Complaint', '_blank')}
        className="fixed bottom-20 right-6 z-40 bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 mb-5 rounded-full shadow-lg border-2 border-red-400"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
          boxShadow: [
            "0 0 10px rgba(239, 68, 68, 0.5)",
            "0 0 20px rgba(239, 68, 68, 0.8)",
            "0 0 10px rgba(239, 68, 68, 0.5)"
          ]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        whileHover={{ 
          scale: 1.15,
          boxShadow: "0 0 25px rgba(239, 68, 68, 1)"
        }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="flex items-center gap-2"
        >
          {/* <span className="text-lg">🚨</span> */}
          <span className="text-sm font-semibold tracking-wide"> FOR COMPLAIN</span>
        </motion.div>
      </motion.button>

      {/* Floating WhatsApp Button */}
      <motion.div 
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-[#30967c] rounded-full flex items-center justify-center shadow-lg cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ 
          y: [0, -5, 0],
          boxShadow: [
            "0 4px 15px rgba(48, 150, 124, 0.3)",
            "0 8px 25px rgba(48, 150, 124, 0.5)",
            "0 4px 15px rgba(48, 150, 124, 0.3)"
          ]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <span className="text-white font-bold text-lg">💬</span>
      </motion.div>

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={closeModals} 
        onSwitchToSignup={openSignupModal}
      />
      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={closeModals} 
        onSwitchToLogin={openLoginModal}
      />
    </header>
  )
}


