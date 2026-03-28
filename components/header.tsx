"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/utils/button"
import Link from "next/link"
import Logo from "./utils/Logo"
import LoginModal from "./modal/LoginModal"
import SignupModal from "./modal/SignupModal"
import ComplaintModal from "./modal/ComplaintModal"

export default function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false)
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false)

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
    <header className="bg-[#01411C]">
      {/* Top bar (dark) */}
      <div className="bg-[#01411C]">
        <div className="w-full px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 xs:py-2 sm:py-2.5 flex items-center justify-between gap-2">
        <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wide flex-shrink-0 min-w-0"
    >
<p
  className="text-transparent bg-clip-text truncate"
  style={{
    backgroundImage: "linear-gradient(90deg, #FFD700, #FFFF33)", // shades of yellow
    // textShadow: `
    //   0 0 6px #FFD70099,
    //   0 0 12px #FFD700CC,
    //   0 0 18px #FFFF3399,
    //   1px 1px 3px #00000080
    // `,
    WebkitTextStroke: "0.5px rgba(255,255,255,0.2)",
  }}
>
<img src="/images/rbg.png" alt="Logo" width={150} height={150} />
  {/* <Logo /> */}
</p>


    </motion.div>

          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 flex-shrink-0 bg-[#FFD949] rounded-full">
            <Button 
              onClick={openLoginModal}
              className="bg-[#FFD949] border border-[#FFD949] text-black font-bold px-4 xs:px-3 sm:px-4 md:px-5 py-2 xs:py-1.5 sm:py-2 text-[0.7rem] xs:text-xs sm:text-sm md:text-base rounded hover:bg-[#FFD949] hover:text-black transition-all duration-300 whitespace-nowrap"
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
      <div className="bg-[#01411C] w-full">
        <nav className="w-full flex justify-center px-0 sm:px-4 md:px-6 bg-[#00A66E] h-8 xs:h-9 sm:h-10">
          <ul className="w-full flex justify-start sm:justify-center items-center gap-1.5 xs:gap-2 sm:gap-4 md:gap-6 lg:gap-8 px-2 xs:px-3 sm:px-0 py-1.5 xs:py-2 bg-[#00A66E] overflow-x-auto whitespace-nowrap no-scrollbar scroll-smooth">
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
                  className="uppercase font-bold text-black hover:text-white transition-colors text-[0.6rem] xs:text-[0.65rem] sm:text-[0.7rem] md:text-[0.75rem] tracking-wide flex items-center gap-1 xs:gap-1.5 sm:gap-2 px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-1 xs:py-1.5 sm:py-2 rounded"
                >
                  <span aria-hidden className="text-[0.7rem] xs:text-[0.75rem] sm:text-base">{item.icon}</span>
                  <span className="hidden xs:inline">{item.label}</span>
                  <span className="xs:hidden">{item.label.split(' ')[0]}</span>
                </Link>
                {/* Hover line indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
              </li>
            ))}
          </ul>
        </nav>
      </div>

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
      <ComplaintModal 
        isOpen={isComplaintModalOpen} 
        onClose={() => setIsComplaintModalOpen(false)}
      />
    </header>
  )
}


