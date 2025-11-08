import { useMemo } from 'react'

// Memoized date formatting utilities
export const useFormattedDate = (dateString: string) => {
  return useMemo(() => {
    try {
      const date = new Date(dateString)
      const month = date.getUTCMonth()
      const day = date.getUTCDate()
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[month]} ${day}`
    } catch {
      return '--'
    }
  }, [dateString])
}

export const useFormattedTime = (dateString: string) => {
  return useMemo(() => {
    try {
      const date = new Date(dateString)
      const hours = date.getUTCHours().toString().padStart(2, '0')
      const minutes = date.getUTCMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    } catch {
      return '--:--'
    }
  }, [dateString])
}

export const useFormattedDateTime = (dateString: string) => {
  return useMemo(() => {
    try {
      const date = new Date(dateString)
      const month = date.getUTCMonth()
      const day = date.getUTCDate()
      const hours = date.getUTCHours().toString().padStart(2, '0')
      const minutes = date.getUTCMinutes().toString().padStart(2, '0')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[month]} ${day} ${hours}:${minutes}`
    } catch {
      return '-- --:--'
    }
  }, [dateString])
}

// Static formatters for non-React contexts
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const month = date.getUTCMonth()
    const day = date.getUTCDate()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[month]} ${day}`
  } catch {
    return '--'
  }
}

export const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const hours = date.getUTCHours().toString().padStart(2, '0')
    const minutes = date.getUTCMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  } catch {
    return '--:--'
  }
}











