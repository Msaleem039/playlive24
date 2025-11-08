"use client"
import { motion } from "framer-motion"
import { useEffect } from "react"

import Header from "@/components/header"
import GamesSection from "@/components/games-section"
import Watsapp from "@/components/Watsapp"
import Footer from "@/components/footer"

export default function HomePage() {
  // Prevent body scrolling when home page is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="h-screen bg-gradient-to-br  flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex-shrink-0">
        <Header />
      </div>

      {/* Spacer to push content below fixed header - Top bar (py-2 ≈ 40px) + Nav bar (h-10 = 40px) */}
      <div className="h-[80px] flex-shrink-0" />

      {/* Scrollable content area - starts below header */}
      <main className="flex-1 relative z-10 overflow-x-hidden overflow-y-auto">
        {/* Hero Section */}
      {/* <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center"> */}
          {/* Left Content */}
          {/* <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl font-bold text-yellow-300 leading-tight"
            >
              Who win asiacup 2025
            </motion.h1> */}

            {/* <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl text-yellow-300 font-semibold"
            >
              submit your answer and win smart mobile phone.
            </motion.p> */}

            {/* <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-3xl text-yellow-300 font-semibold"
            >
              play on jori95 & win daily
            </motion.p>
          </motion.div> */}

          {/* Right Content - Phone Image */}
          {/* <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex justify-center"
          >
            <motion.img
              animate={{
                y: [-10, 10, -10],
                rotate: [0, 2, -2, 0],
              }}
              transition={{
                y: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                rotate: { duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
              }}
              src="/modern-smartphone-with-blue-screen.jpg"
              alt="Smartphone Prize"
              className="max-w-md w-full h-auto"
            />
          </motion.div> */}
        {/* </div>
      </main> */}

        {/* Popular Games Section */}
        <GamesSection />

        {/* Footer */}
        <Footer />
      </main>

      {/* WhatsApp Float Button - Outside scrollable area */}
      <Watsapp />
    </div>
  )
}
