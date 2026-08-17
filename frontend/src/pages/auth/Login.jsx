import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { login, clearError } from '../../redux/slices/authSlice'
import { Eye, EyeOff, Lock, Mail, BookOpen, Users, Award, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { COMPANY_NAME, APP_NAME } from '../../utils/constants'

const features = [
  { icon: BookOpen, text: 'Structured learning paths & projects' },
  { icon: Users,    text: 'Team collaboration & peer learning' },
  { icon: Award,    text: 'Auto-generated completion certificates' },
  { icon: BarChart3,text: 'Real-time performance analytics' },
]

export default function Login() {
  const dispatch = useDispatch()
  const navigate  = useNavigate()
  const { loading, error, user, token } = useSelector(s => s.auth)
  const [showPwd, setShowPwd] = useState(false)
  const [role, setRole] = useState('admin')
  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    if (user && token) navigate(user.role === 'admin' ? '/admin' : '/intern', { replace: true })
  }, [user, token])

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()) }
  }, [error])

  const onSubmit = (data) => dispatch(login(data))

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL – brand hero ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col justify-between p-12 overflow-hidden"
           style={{ background: 'linear-gradient(135deg,#2e1065 0%,#4c1d95 35%,#6d28d9 70%,#7c3aed 100%)' }}>

        {/* grid texture */}
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* floating blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle,#a78bfa,transparent)' }} />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle,#c4b5fd,transparent)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-white/30">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">{APP_NAME}</span>
          </div>
          <p className="text-violet-300 text-sm ml-13">by {COMPANY_NAME}</p>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:.6 }}>
            <h1 className="text-5xl font-bold text-white leading-tight mb-4">
              Learn. Build.<br />
              <span className="text-violet-300">Grow.</span>
            </h1>
            <p className="text-violet-200 text-lg mb-10 max-w-md leading-relaxed">
              The all-in-one internship management platform that bridges education and industry.
            </p>
            <div className="space-y-4">
              {features.map(({ icon: Icon, text }, i) => (
                <motion.div key={i} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:.2 + i*.1 }}
                  className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-violet-200" />
                  </div>
                  <span className="text-violet-100 text-sm">{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* bottom stat strip */}
        <div className="relative z-10 flex gap-8">
          {[['500+','Students'],['50+','Projects'],['98%','Completion']].map(([n,l]) => (
            <div key={l}>
              <p className="text-white font-bold text-2xl">{n}</p>
              <p className="text-violet-300 text-xs">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL – form ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-zinc-950">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:.4 }}
          className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-white">{APP_NAME}</span>
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Welcome back</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">Sign in to your {COMPANY_NAME} account</p>

          {/* Role tabs — Udemy pill style */}
          <div className="flex gap-2 mb-7 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
            {['admin','student'].map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 capitalize
                  ${role === r
                    ? 'bg-white dark:bg-zinc-800 text-violet-700 dark:text-violet-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                {r === 'student' ? 'Student' : 'Admin'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input {...register('email', { required:'Email required', pattern:{ value:/\S+@\S+\.\S+/, message:'Invalid email' } })}
                  className="input pl-10" type="email"
                  placeholder={role === 'admin' ? 'admin@aparaitech.com' : 'student@aparaitech.com'} />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <a href="/forgot-password" className="text-xs text-violet-600 hover:text-violet-700 font-medium">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input {...register('password', { required:'Password required', minLength:{ value:6, message:'Min 6 characters' } })}
                  type={showPwd ? 'text' : 'password'} className="input pl-10 pr-11" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <div className="flex items-center gap-2.5">
              <input id="remember" type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500" />
              <label htmlFor="remember" className="text-sm text-zinc-600 dark:text-zinc-400 select-none">Remember me</label>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
                : `Sign in as ${role === 'admin' ? 'Admin' : 'Student'}`}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-violet-50 dark:bg-violet-950/30 rounded-xl border border-violet-100 dark:border-violet-900">
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-2">Demo credentials</p>
            {role === 'admin'
              ? <p className="text-xs text-zinc-600 dark:text-zinc-400">Email: <span className="font-mono text-violet-700 dark:text-violet-300">admin@company.com</span> &nbsp;/&nbsp; Password: <span className="font-mono text-violet-700 dark:text-violet-300">Admin@123</span></p>
              : <p className="text-xs text-zinc-600 dark:text-zinc-400">Default password: <span className="font-mono text-violet-700 dark:text-violet-300">Intern@123</span> — change after first login</p>}
          </div>

          <p className="mt-6 text-center text-xs text-zinc-400">&copy; {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</p>
        </motion.div>
      </div>
    </div>
  )
}
