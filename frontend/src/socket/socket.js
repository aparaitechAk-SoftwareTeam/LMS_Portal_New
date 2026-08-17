import { io } from 'socket.io-client'

let socket = null

export const initSocket = (token) => {
  if (socket?.connected) return socket
  // disconnect stale socket if any
  if (socket) { socket.disconnect(); socket = null }

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000,
    transports: ['websocket', 'polling'],
  })
  socket.on('connect',           () => console.log('[socket] connected:', socket.id))
  socket.on('connect_error',     (e) => console.warn('[socket] connect error:', e.message))
  socket.on('disconnect',        (r) => console.log('[socket] disconnected:', r))
  socket.on('reconnect',         (n) => console.log('[socket] reconnected after', n, 'attempts'))
  return socket
}

export const getSocket = () => socket

export const waitForSocket = () => new Promise((resolve) => {
  if (socket?.connected) return resolve(socket)
  const interval = setInterval(() => {
    if (socket?.connected) { clearInterval(interval); resolve(socket) }
  }, 100)
  setTimeout(() => { clearInterval(interval); resolve(socket) }, 5000)
})

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null }
}

export default { initSocket, getSocket, waitForSocket, disconnectSocket }
