import { useDispatch, useSelector } from 'react-redux'
import { toggleSidebar, toggleTheme } from '../../redux/slices/uiSlice'
import { markRead, markAllRead } from '../../redux/slices/notificationSlice'
import { Menu, Sun, Moon, Bell, X, CheckCheck, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import { logout } from '../../redux/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { COMPANY_NAME } from '../../utils/constants'

const typeColors = {
  task_assigned:'bg-violet-500', submission_approved:'bg-emerald-500',
  submission_rejected:'bg-red-500', deadline_reminder:'bg-amber-500',
  attendance_alert:'bg-sky-500', announcement:'bg-violet-500',
  project_assigned:'bg-indigo-500', certificate_ready:'bg-emerald-500',
}

export default function Header() {
  const dispatch     = useDispatch()
  const navigate     = useNavigate()
  const { theme }    = useSelector(s => s.ui)
  const { items, unread } = useSelector(s => s.notifications)
  const { user }     = useSelector(s => s.auth)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef   = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))   setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleMarkRead = async (id) => {
    dispatch(markRead(id))
    await api.put(`/notifications/${id}/read`).catch(() => {})
  }

  const handleMarkAll = async () => {
    dispatch(markAllRead())
    await api.put('/notifications/read-all').catch(() => {})
  }

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 flex-shrink-0 z-10">

      {/* Left */}
      <div className="flex items-center gap-4">
        <button onClick={() => dispatch(toggleSidebar())}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <Menu size={19} />
        </button>

        {/* Breadcrumb/search — Udemy style */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3.5 py-2 w-72">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input placeholder="Search courses, tasks, students…"
            className="bg-transparent text-sm outline-none w-full placeholder:text-zinc-400 dark:text-white" />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">

        {/* Theme toggle */}
        <button onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div initial={{ opacity:0, y:8, scale:.96 }} animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:8, scale:.96 }} transition={{ duration:.15 }}
                className="absolute right-0 top-12 w-88 card shadow-xl z-50 overflow-hidden"
                style={{ width: '360px' }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Notifications</h3>
                    {unread > 0 && <p className="text-xs text-zinc-400">{unread} unread</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <button onClick={handleMarkAll}
                        className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                        <CheckCheck size={12} />Mark all read
                      </button>
                    )}
                    <button onClick={() => setNotifOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                      <X size={15} />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800/60">
                  {items.length === 0
                    ? <div className="p-8 text-center text-zinc-400 text-sm">You're all caught up!</div>
                    : items.slice(0, 12).map(n => (
                      <div key={n._id} onClick={() => handleMarkRead(n._id)}
                        className={`flex gap-3 px-4 py-3.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors
                          ${!n.isRead ? 'bg-violet-50/60 dark:bg-violet-950/20' : ''}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeColors[n.type] || 'bg-zinc-400'} ${!n.isRead ? '' : 'opacity-0'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">{n.title}</p>
                          <p className="text-xs text-zinc-500 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                          <p className="text-xs text-zinc-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile dropdown */}
        <div className="relative ml-1" ref={profileRef}>
          <button onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-800 flex items-center justify-center overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" />
                : <span className="text-violet-700 dark:text-violet-300 text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-none">{user?.name}</p>
              <p className="text-xs text-zinc-400 mt-0.5 capitalize">{user?.role === 'intern' ? 'Student' : user?.role}</p>
            </div>
            <ChevronDown size={14} className="text-zinc-400 hidden md:block" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div initial={{ opacity:0, y:8, scale:.96 }} animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:8, scale:.96 }} transition={{ duration:.15 }}
                className="absolute right-0 top-12 w-52 card shadow-xl z-50 py-1.5 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                    View Profile
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
                    Settings
                  </button>
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
