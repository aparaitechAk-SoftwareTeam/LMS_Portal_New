import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeft, BookOpen, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { APP_NAME, COMPANY_NAME } from '../../utils/constants'

export default function ForgotPassword() {
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState:{ errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try { await api.post('/auth/forgot-password', data); setSent(true); toast.success('Reset email sent!') }
    catch {} finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="font-bold text-zinc-900 dark:text-white text-lg">{APP_NAME}</span>
        </div>
        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Send size={28} className="text-violet-600" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Check your email</h2>
              <p className="text-zinc-500 text-sm mb-6">We sent a password reset link to your email address.</p>
              <Link to="/login" className="btn-primary w-full">Back to Login</Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Reset your password</h2>
              <p className="text-zinc-500 text-sm mb-6">Enter your email and we'll send a reset link.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input {...register('email',{ required:true })} type="email" className="input" placeholder="you@company.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">Email is required</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
                <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-zinc-500 hover:text-violet-600 transition-colors mt-2">
                  <ArrowLeft size={14} />Back to login
                </Link>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-xs text-zinc-400 mt-4">&copy; {new Date().getFullYear()} {COMPANY_NAME}</p>
      </motion.div>
    </div>
  )
}
