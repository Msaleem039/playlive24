"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { useGetSiteVideoQuery } from "@/app/services/Api"

import Header from "@/components/header"
import GamesSection from "@/components/games-section"
import Footer from "@/components/footer"

export default function HomePage() {
  const [showVideo, setShowVideo] = useState(true)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const { data: siteVideoData } = useGetSiteVideoQuery(undefined)

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  const videoUrl = siteVideoData?.videoUrl
  const shouldShowVideo = videoUrl && showVideo && siteVideoData?.isActive

  const handleUnmute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = false
    videoRef.current.volume = 1
    setIsMuted(false)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>

      <AnimatePresence>
        {shouldShowVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-40 bg-black"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onLoadedData={() => setVideoLoaded(true)}
              />

              {/* Unmute Button */}
              {videoLoaded && isMuted && (
                <button
                  onClick={handleUnmute}
                  className="absolute bottom-10 right-10 z-50 bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur"
                >
                  🔊 Tap to unmute
                </button>
              )}

              {!videoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-[80px]" />

      <main className="flex-1 overflow-y-auto">
        <GamesSection />
        <Footer />
      </main>
    </div>
  )
}
