import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${original.baseURL}/auth/refresh`, { refreshToken })
          localStorage.setItem('token', data.token)
          original.headers.Authorization = `Bearer ${data.token}`
          return api(original)
        } catch {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
    }
    const message = err.response?.data?.message
    if (message && err.response?.status !== 401) toast.error(message)
    return Promise.reject(err)
  }
)

export default api
