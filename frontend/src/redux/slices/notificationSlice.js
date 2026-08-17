import { createSlice } from '@reduxjs/toolkit'

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unread: 0 },
  reducers: {
    setNotifications: (state, action) => { state.items = action.payload.data; state.unread = action.payload.unread },
    addNotification: (state, action) => { state.items.unshift(action.payload); state.unread += 1 },
    markRead: (state, action) => {
      const notif = state.items.find(n => n._id === action.payload)
      if (notif && !notif.isRead) { notif.isRead = true; state.unread = Math.max(0, state.unread - 1) }
    },
    markAllRead: (state) => { state.items.forEach(n => n.isRead = true); state.unread = 0 }
  }
})

export const { setNotifications, addNotification, markRead, markAllRead } = notificationSlice.actions
export default notificationSlice.reducer
