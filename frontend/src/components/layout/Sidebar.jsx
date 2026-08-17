import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import { toggleSidebar } from '../../redux/slices/uiSlice'
import * as Icons from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { COMPANY_NAME, APP_NAME } from '../../utils/constants'

const DynIcon = ({ name, size = 17 }) => {
  const Icon = Icons[name] || Icons.Circle
  return <Icon size={size} />
}

export default function Sidebar({ nav, role }) {
  const dispatch = useDispatch()
  const navigate  = useNavigate()
  const { sidebarOpen } = useSelector(s => s.ui)
  const { user }        = useSelector(s => s.auth)

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  const roleLabel = role === 'admin' ? 'Admin Portal' : 'Student Portal'

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 z-20 bg-black/50 lg:hidden"
               onClick={() => dispatch(toggleSidebar())} />

          <motion.aside
            initial={{ x:-264 }} animate={{ x:0 }} exit={{ x:-264 }}
            transition={{ type:'spring', stiffness:300, damping:30 }}
            className="fixed left-0 top-0 h-full w-64 z-30 flex flex-col"
            style={{ background:'#18181b', borderRight:'1px solid #27272a' }}>

            {/* ── Logo ── */}
            <div className="flex items-center gap-3 px-5 h-16 border-b border-zinc-800 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-600/30">
                <Icons.BookOpen size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm leading-none truncate">{COMPANY_NAME} LMS</p>
                <p className="text-zinc-500 text-xs mt-0.5">{roleLabel}</p>
              </div>
            </div>

            {/* ── Nav ── */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 hide-scrollbar">
              {nav.map(item => (
                <NavLink key={item.path} to={item.path} end={item.exact}
                  className={({ isActive }) => isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}>
                  <DynIcon name={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* ── Divider ── */}
            <div className="mx-4 border-t border-zinc-800" />

            {/* ── User strip ── */}
            <div className="p-3 flex-shrink-0">
              <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-600/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {user?.avatar
                    ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    : <span className="text-violet-400 text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-zinc-500 text-xs capitalize truncate">{role === 'intern' ? 'Student' : user?.role}</p>
                </div>
                <button onClick={handleLogout}
                  className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Logout">
                  <Icons.LogOut size={15} />
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
