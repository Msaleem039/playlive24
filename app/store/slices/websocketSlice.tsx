import { createSlice } from '@reduxjs/toolkit'

interface WebSocketState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  lastUpdate: Date | null
}

const initialState: WebSocketState = {
  isConnected: false,
  isConnecting: false,
  error: null,
  lastUpdate: null
}

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    setConnected: (state, action) => {
      state.isConnected = action.payload
      state.isConnecting = false
      if (action.payload) {
        state.error = null
      }
    },
    setConnecting: (state, action) => {
      state.isConnecting = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
      state.isConnecting = false
      state.isConnected = false
    },
    setLastUpdate: (state, action) => {
      state.lastUpdate = action.payload
    }
  }
})

export const { setConnected, setConnecting, setError, setLastUpdate } = websocketSlice.actions
export default websocketSlice.reducer
















