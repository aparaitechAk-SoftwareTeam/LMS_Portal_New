import { useSelector, useDispatch } from 'react-redux'
import { toggleTheme } from '../../redux/slices/uiSlice'
import { Sun, Moon, Shield, Bell, Palette, User } from 'lucide-react'
import { PageHeader } from '../../components/common/index'
import { COMPANY_NAME } from '../../utils/constants'

export default function AdminSettings() {
  const dispatch = useDispatch()
  const { theme } = useSelector(s => s.ui)
  const { user }  = useSelector(s => s.auth)

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account and platform preferences" />

      <div className="card overflow-hidden">
        <div className="h-20 relative" style={{ background:'linear-gradient(135deg,#2e1065,#7c3aed)' }} />
        <div className="px-6 pb-6">
          <div className="-mt-8 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-600 border-4 border-white dark:border-zinc-900 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
          <h2 className="font-bold text-zinc-900 dark:text-white text-lg">{user?.name}</h2>
          <p className="text-zinc-400 text-sm">{user?.email}</p>
          <span className="mt-2 inline-block badge-violet capitalize">{user?.role}</span>
          <p className="text-xs text-zinc-400 mt-2">{COMPANY_NAME} Admin Portal</p>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Palette size={16} />Appearance</h3>
        <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
          <div>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">Dark Mode</p>
            <p className="text-xs text-zinc-400 mt-0.5">Switch between light and dark interface</p>
          </div>
          <button onClick={() => dispatch(toggleTheme())}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${theme==='dark' ? 'bg-violet-600' : 'bg-zinc-300'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${theme==='dark' ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Shield size={16} />Security</h3>
        {[
          { label:'Change Password', desc:'Update your account password' },
          { label:'Two-Factor Auth', desc:'Add an extra layer of security' },
          { label:'Login History', desc:'View all recent login sessions' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <div>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{item.label}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{item.desc}</p>
            </div>
            <button className="btn-secondary text-xs py-1.5 px-3">Configure</button>
          </div>
        ))}
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Bell size={16} />Notifications</h3>
        {[
          { label:'Email Notifications', desc:'Receive email updates for important events' },
          { label:'Task Reminders',       desc:'Get notified before task deadlines' },
          { label:'New Student Alerts',   desc:'Notify when a new student is enrolled' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <div>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{item.label}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{item.desc}</p>
            </div>
            <div className="w-10 h-5 bg-violet-600 rounded-full relative cursor-pointer">
              <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
