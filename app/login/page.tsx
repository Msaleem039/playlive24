"use client"

import { useState } from "react"
import LoginModal from "@/components/modal/LoginModal"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const router = useRouter()

  const handleClose = () => {
    setIsModalOpen(false)
    router.push("/")
  }

  const handleSwitchToSignup = () => {
    router.push("/signup")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f0f] to-[#111]">
      <LoginModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSwitchToSignup={handleSwitchToSignup}
      />
    </div>
  )
}
