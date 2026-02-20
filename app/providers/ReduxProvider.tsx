"use client"

import { Provider } from "react-redux"
import { store } from "../store/store"
import { useEffect } from "react"
import Cookies from "js-cookie"
import { setCredentials } from "../store/slices/authSlice"

// Initialize auth state synchronously from cookies to prevent flicker
if (typeof window !== 'undefined') {
  try {
    const token = Cookies.get("token")
    const authUserCookie = Cookies.get("auth_user")
    
    if (token && authUserCookie) {
      try {
        const user = JSON.parse(authUserCookie)
        // console.log("ReduxProvider: Loading user from cookie:", user)
        // console.log("ReduxProvider: Balance from cookie:", user.balance)
        // Check if Redux state is empty before setting
        const currentState = store.getState()
        if (!currentState.auth?.token || !currentState.auth?.user) {
          store.dispatch(setCredentials({ user, token }))
          // console.log("ReduxProvider: Set credentials from cookie")
        } else {
          // If Redux already has data, check if cookie data is newer (by updatedAt)
          const existingUser = currentState.auth.user as any
          const existingUpdatedAt = existingUser?.updatedAt || existingUser?.updated_at
          const cookieUpdatedAt = user?.updatedAt || user?.updated_at
          
          // If cookie has newer data, update Redux
          if (cookieUpdatedAt && existingUpdatedAt && new Date(cookieUpdatedAt) > new Date(existingUpdatedAt)) {
            console.log("ReduxProvider: Cookie has newer data, updating Redux")
            store.dispatch(setCredentials({ user, token }))
          } else if (!existingUpdatedAt && cookieUpdatedAt) {
            // Cookie has updatedAt but Redux doesn't, use cookie
            console.log("ReduxProvider: Cookie has updatedAt, updating Redux")
            store.dispatch(setCredentials({ user, token }))
          }
        }
      } catch (e) {
        // Invalid cookie, try localStorage fallback
        const userJson = window.localStorage.getItem("auth_user")
        if (userJson) {
          try {
            const user = JSON.parse(userJson)
            // console.log("ReduxProvider: Loading user from localStorage:", user)
            // console.log("ReduxProvider: Balance from localStorage:", user.balance)
            const currentState = store.getState()
            if (!currentState.auth?.token || !currentState.auth?.user) {
              store.dispatch(setCredentials({ user, token }))
              console.log("ReduxProvider: Set credentials from localStorage")
            }
          } catch (parseError) {
            // Both cookie and localStorage failed, ignore
          }
        }
      }
    }
  } catch (error) {
    // Silently fail if cookies/localStorage access fails
  }
}

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Keep useEffect as backup for runtime updates
  useEffect(() => {
    try {
      const token = Cookies.get("token")
      const authUserCookie = Cookies.get("auth_user")
      let user = null
      
      if (authUserCookie) {
        try {
          user = JSON.parse(authUserCookie)
        } catch (e) {
          const userJson = window.localStorage.getItem("auth_user")
          user = userJson ? JSON.parse(userJson) : null
        }
      } else {
        const userJson = window.localStorage.getItem("auth_user")
        user = userJson ? JSON.parse(userJson) : null
      }
      
      if (token && user) {
        const currentState = store.getState()
        if (!currentState.auth?.token || !currentState.auth?.user) {
          store.dispatch(setCredentials({ user, token }))
        }
      }
    } catch {}
  }, [])

  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}


