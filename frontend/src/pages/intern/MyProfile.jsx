import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Github, Linkedin, Save, User, MapPin, Phone, Mail, GraduationCap, Code } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Badge, Skeleton, PageHeader } from '../../components/common/index'
import { useSelector } from 'react-redux'
import { COMPANY_NAME } from '../../utils/constants'

export default function MyProfile() {
  const [intern, setIntern] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const { user } = useSelector(s => s.auth)
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    api.get('/interns/me').then(r => {
      const d = r.data.data
      setIntern(d)
      reset({
        name:      d.user?.name,
        phone:     d.user?.phone,
        github:    d.github,
        linkedin:  d.linkedin,
        skills:    d.skills?.join(', '),
        'address.city':  d.address?.city,
        'address.state': d.address?.state,
        'emergencyContact.name':  d.emergencyContact?.name,
        'emergencyContact.phone': d.emergencyContact?.phone,
      })
    }).finally(() => setLoading(false))
  }, [])

  const onSave = async (data) => {
    setSaving(true)
    try {
      await api.put('/interns/me', {
        ...data,
        skills: data.skills?.split(',').map(s => s.trim()).filter(Boolean),
      })
      toast.success('Profile updated successfully!')
    } catch {} finally { setSaving(false) }
  }

  const TABS = [
    { id:'profile',   label:'Profile Info' },
    { id:'education', label:'Education' },
    { id:'security',  label:'Security' },
  ]

  if (loading) return <div className="space-y-4"><Skeleton lines={8} /></div>

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="My Profile" subtitle="Manage your personal information and account settings" />

      {/* Profile card */}
      <div className="card overflow-hidden">
        {/* Banner */}
        <div className="h-24 relative" style={{ background:'linear-gradient(135deg,#2e1065,#7c3aed)' }} />

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className="w-20 h-20 rounded-2xl bg-violet-600 border-4 border-white dark:border-zinc-900 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden">
              {intern?.user?.avatar
                ? <img src={intern.user.avatar} className="w-full h-full object-cover" alt="avatar" />
                : intern?.user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex gap-2">
              <Badge status={intern?.status} label={intern?.status} />
              <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-zinc-600 dark:text-zinc-300">{intern?.internId}</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{intern?.user?.name}</h2>
          <p className="text-zinc-500 text-sm">{intern?.department} · {COMPANY_NAME}</p>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-zinc-500">
            {intern?.user?.email && <div className="flex items-center gap-1.5"><Mail size={14} />{intern.user.email}</div>}
            {intern?.user?.phone && <div className="flex items-center gap-1.5"><Phone size={14} />{intern.user.phone}</div>}
            {intern?.github && <a href={intern.github} target="_blank" className="flex items-center gap-1.5 text-violet-600 hover:underline"><Github size={14} />GitHub</a>}
            {intern?.linkedin && <a href={intern.linkedin} target="_blank" className="flex items-center gap-1.5 text-violet-600 hover:underline"><Linkedin size={14} />LinkedIn</a>}
          </div>

          {/* Tech stack */}
          {intern?.techStack?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {intern.techStack.map(t => <span key={t} className="badge-violet">{t}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab===t.id ? 'bg-white dark:bg-zinc-800 text-violet-700 dark:text-violet-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSave)}>
        {activeTab==='profile' && (
          <div className="card p-6 space-y-5">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2"><User size={16} />Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Full Name</label><input {...register('name')} className="input" /></div>
              <div><label className="label">Phone</label><input {...register('phone')} className="input" /></div>
              <div>
                <label className="label flex items-center gap-1.5"><Github size={13} />GitHub Profile URL</label>
                <input {...register('github')} className="input" placeholder="https://github.com/username" />
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Linkedin size={13} />LinkedIn Profile URL</label>
                <input {...register('linkedin')} className="input" placeholder="https://linkedin.com/in/username" />
              </div>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800" />
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Code size={16} />Skills</h3>
            <div>
              <label className="label">Skills (comma separated)</label>
              <input {...register('skills')} className="input" placeholder="React, Node.js, Python, MongoDB…" />
              <p className="text-xs text-zinc-400 mt-1.5">Enter skills separated by commas</p>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800" />
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><MapPin size={16} />Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">City</label><input {...register('address.city')} className="input" placeholder="Mumbai" /></div>
              <div><label className="label">State</label><input {...register('address.state')} className="input" placeholder="Maharashtra" /></div>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800" />
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Phone size={16} />Emergency Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Contact Name</label><input {...register('emergencyContact.name')} className="input" placeholder="Parent / Guardian name" /></div>
              <div><label className="label">Contact Phone</label><input {...register('emergencyContact.phone')} className="input" placeholder="+91 9876543210" /></div>
            </div>

            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={15} />{saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}

        {activeTab==='education' && (
          <div className="card p-6 space-y-5">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2"><GraduationCap size={16} />Education Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label:'College/University', key:'college.name', placeholder:'University name' },
                { label:'Degree',             key:'college.degree', placeholder:'B.Tech Computer Science' },
                { label:'Branch/Specialization', key:'college.branch', placeholder:'Computer Engineering' },
                { label:'Current Year',       key:'college.year', placeholder:'Final Year' },
                { label:'Roll Number',        key:'college.rollNo', placeholder:'2021CS001' },
              ].map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input {...register(f.key)} defaultValue={intern?.college?.[f.key.split('.')[1]]} className="input" placeholder={f.placeholder} />
                </div>
              ))}
            </div>

            {/* Internship info (read-only) */}
            <hr className="border-zinc-100 dark:border-zinc-800" />
            <h3 className="font-bold text-zinc-900 dark:text-white mb-3">Internship Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label:'Start Date', value: intern?.internshipStart ? new Date(intern.internshipStart).toDateString() : '—' },
                { label:'End Date',   value: intern?.internshipEnd   ? new Date(intern.internshipEnd).toDateString()   : '—' },
                { label:'Duration',   value: intern?.internshipDuration || '—' },
                { label:'Mentor',     value: intern?.mentor || '—' },
                { label:'Team',       value: intern?.team?.name || '—' },
              ].map(item => (
                <div key={item.label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                  <p className="text-xs text-zinc-400 mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{item.value}</p>
                </div>
              ))}
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={15} />{saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}

        {activeTab==='security' && (
          <div className="card p-6 space-y-5">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div><label className="label">Current Password</label><input type="password" className="input" placeholder="••••••••" /></div>
              <div><label className="label">New Password</label><input type="password" className="input" placeholder="••••••••" /></div>
              <div><label className="label">Confirm New Password</label><input type="password" className="input" placeholder="••••••••" /></div>
              <button type="button" className="btn-primary">Update Password</button>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800" />
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2">Login Sessions</h3>
            <p className="text-sm text-zinc-400">Last login: {intern?.user?.lastLogin ? new Date(intern.user.lastLogin).toLocaleString() : '—'}</p>
          </div>
        )}
      </form>
    </div>
  )
}
