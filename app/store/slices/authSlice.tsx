import { SplitApiSettings } from '../../services/SplitApiSetting'
import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
    name: 'auth',
    initialState: { user: null, token: null },
    reducers: {
        setCredentials: (
            state,
            {
                payload: { user, token },
            },
        ) => {
            // console.log({ user, token })
            state.user = user
            state.token = token
        },
        logout: (state) => {
            state.user = null
            state.token = null
        },
    },
})

export const { setCredentials, logout: logoutAction } = authSlice.actions


export const logout = () => (dispatch: any, getState: any) => {
    dispatch(SplitApiSettings.util.resetApiState())
    dispatch(logoutAction())
}

export default authSlice.reducer

export const selectCurrentUser = (state: any) => state.auth.user
export const selectCurrentToken = (state: any) => state.auth.token
