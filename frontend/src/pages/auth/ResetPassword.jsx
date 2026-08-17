import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Layers } from 'lucide-react'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.put(`/auth/reset-password/${token}`, { password: data.password })
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch {} finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-dark-700 border border-dark-600 rounded-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center mb-4"><Layers size={24} className="text-white" /></div>
          <h1 className="text-xl font-bold text-white">Set New Password</h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label text-slate-300">New Password</label>
            <input {...register('password', { required: true, minLength: { value: 6, message: 'Min 6 characters' } })} type="password" className="input bg-dark-800 border-dark-600 text-white" />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label text-slate-300">Confirm Password</label>
            <input {...register('confirm', { validate: v => v === watch('password') || 'Passwords do not match' })} type="password" className="input bg-dark-800 border-dark-600 text-white" />
            {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">{loading ? 'Resetting...' : 'Reset Password'}</button>
        </form>
      </div>
    </div>
  )
}
