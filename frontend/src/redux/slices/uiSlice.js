import { createSlice } from '@reduxjs/toolkit'

export const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true, theme: localStorage.getItem('theme') || 'light', modal: null },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen },
    setSidebar: (state, action) => { state.sidebarOpen = action.payload },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', state.theme)
    },
    setTheme: (state, action) => { state.theme = action.payload; localStorage.setItem('theme', action.payload) },
    openModal: (state, action) => { state.modal = action.payload },
    closeModal: (state) => { state.modal = null }
  }
})

export const { toggleSidebar, setSidebar, toggleTheme, setTheme, openModal, closeModal } = uiSlice.actions
export default uiSlice.reducer
