'use client'

import { useState } from 'react'
import SignupModal from '@/components/modal/SignupModal'
import { useRouter } from 'next/navigation'

export default function SignupPageClient() {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const router = useRouter()

  const handleClose = () => {
    setIsModalOpen(false)
    router.push('/')
  }

  const handleSwitchToLogin = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f0f] to-[#111]">
      <SignupModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  )
}
