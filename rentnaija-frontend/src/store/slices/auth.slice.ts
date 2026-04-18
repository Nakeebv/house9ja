import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '@/types'

interface AuthState {
  token: string | null
  user: AuthUser | null
}

const initialState: AuthState = {
  token: null,
  user: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload
    },
    logout(state) {
      state.user = null
      state.token = null
    },
  },
})

export const { logout, setToken, setUser } = authSlice.actions
export default authSlice.reducer
