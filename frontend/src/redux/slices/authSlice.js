import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', creds)
    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me')
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message)
  }
})

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout') } catch {}
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, internData: null, token: localStorage.getItem('token'), loading: false, error: null, initialized: false },
  reducers: {
    clearError: (state) => { state.error = null },
    setUser: (state, action) => { state.user = action.payload }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null })
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.user = action.payload.user; state.internData = action.payload.internData; state.token = action.payload.token })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(getMe.fulfilled, (state, action) => { state.user = action.payload.user; state.internData = action.payload.internData; state.initialized = true })
      .addCase(getMe.rejected, (state) => { state.user = null; state.token = null; state.initialized = true; localStorage.removeItem('token') })
      .addCase(logout.fulfilled, (state) => { state.user = null; state.token = null; state.internData = null })
  }
})

export const { clearError, setUser } = authSlice.actions
export default authSlice.reducer
