import { useState, useEffect } from 'react'

export function useResponsiveLayout() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  // Responsive breakpoint detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }

    // Initial check
    checkScreenSize()

    // Add event listener
    window.addEventListener('resize', checkScreenSize)

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const getMainLayoutClass = (hasLiveTV: boolean, streamUrl: string | null) => {
    if (!hasLiveTV || !streamUrl) {
      return 'flex flex-col'
    }
    
    if (isMobile) {
      return 'flex flex-col'
    }
    
    if (isTablet) {
      return 'grid grid-cols-1 md:grid-cols-12 gap-0'
    }
    
    return 'grid grid-cols-12 gap-0'
  }

  const getLeftPanelClass = (hasLiveTV: boolean, streamUrl: string | null) => {
    if (!hasLiveTV || !streamUrl) {
      return 'col-span-12'
    }
    
    if (isMobile) {
      return 'col-span-12'
    }
    
    if (isTablet) {
      return 'col-span-12 md:col-span-8 border-r border-gray-200'
    }
    
    return 'col-span-12 md:col-span-8 border-r border-gray-200'
  }

  const getRightPanelClass = (hasLiveTV: boolean, streamUrl: string | null) => {
    if (!hasLiveTV || !streamUrl) {
      return 'col-span-12'
    }
    
    if (isMobile) {
      return 'col-span-12'
    }
    
    if (isTablet) {
      return 'col-span-12 md:col-span-4'
    }
    
    return 'col-span-12 md:col-span-4'
  }

  return {
    isMobile,
    isTablet,
    getMainLayoutClass,
    getLeftPanelClass,
    getRightPanelClass
  }
}


