import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Upload, Edit, Trash2, Eye, RefreshCw, GraduationCap, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import { Badge, Empty, Skeleton, PageHeader } from '../../components/common/index'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const DEPTS = ['Frontend','Backend','Full Stack','Mobile','DevOps','Data Science','UI/UX','QA','Cloud','Cybersecurity']
const STACKS = ['React','Node.js','Python','Flutter','Angular','Vue','MongoDB','PostgreSQL','AWS','Docker','Kotlin','Swift']

export default function Students() {
  const [interns, setInterns]       = useState([])
  const [pagination, setPagination] = useState({ total:0, pages:1, page:1 })
  const [loading, setLoading]       = useState(true)
  const [filters, setFilters]       = useState({ status:'', department:'', search:'' })
  const [createModal, setCreateModal] = useState(false)
  const [saving, setSaving]         = useState(false)
  const { register, handleSubmit, reset, formState:{ errors } } = useForm()

  const fetchInterns = useCallback(async (page=1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit:10, ...filters })
      const { data } = await api.get(`/interns?${params}`)
      setInterns(data.data)
      setPagination(data.pagination)
    } catch {} finally { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchInterns() }, [fetchInterns])

  const onCreateStudent = async (formData) => {
    setSaving(true)
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        techStack: JSON.stringify(formData.techStack ? [formData.techStack] : []),
        college: JSON.stringify({ name: formData.collegeName, degree: formData.degree }),
        internshipStart: formData.internshipStart,
        internshipEnd: formData.internshipEnd,
        mentor: formData.mentor,
      }
      await api.post('/interns', payload)
      toast.success('Student account created & welcome email sent!')
      setCreateModal(false); reset(); fetchInterns()
    } catch(e) {
      toast.error(e?.response?.data?.message || 'Failed to create student')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this student?')) return
    try { await api.delete(`/interns/${id}`); toast.success('Student deactivated'); fetchInterns() } catch {}
  }

  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader
        title="Students"
        subtitle={`${pagination.total} students enrolled`}
        actions={
          <>
            <button className="btn-secondary text-sm gap-2" onClick={() => toast('Import feature — use /admin/interns bulk import', {icon:'📂'})}>
              <Upload size={15} />Bulk Import
            </button>
            <button onClick={() => setCreateModal(true)} className="btn-primary text-sm">
              <Plus size={15} />Add Student
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input placeholder="Search students by name or ID…" className="input pl-10"
            value={filters.search} onChange={e => setFilters(f => ({ ...f, search:e.target.value }))} />
        </div>
        <select className="input w-full sm:w-40" value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status:e.target.value }))}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="terminated">Terminated</option>
        </select>
        <select className="input w-full sm:w-44" value={filters.department}
          onChange={e => setFilters(f => ({ ...f, department:e.target.value }))}>
          <option value="">All Departments</option>
          {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button onClick={() => fetchInterns()} className="btn-secondary flex-shrink-0 p-2.5"><RefreshCw size={15} /></button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                {['Student','ID','Department','Tech Stack','Duration','Status','Score','Actions'].map(h => (
                  <th key={h} className="table-header py-3 px-4 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(6).fill(0).map((_,i) => (
                    <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td colSpan={8} className="px-4 py-3"><Skeleton lines={1} /></td>
                    </tr>
                  ))
                : interns.length === 0
                  ? <tr><td colSpan={8}><Empty title="No students found" description="Add your first student to get started" icon={GraduationCap} /></td></tr>
                  : interns.map((intern,i) => (
                    <motion.tr key={intern._id}
                      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*.03 }}
                      className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-700 dark:text-violet-300 text-sm font-bold flex-shrink-0">
                            {intern.user?.avatar
                              ? <img src={intern.user.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                              : intern.user?.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-white text-sm">{intern.user?.name}</p>
                            <p className="text-xs text-zinc-400">{intern.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-300">
                          {intern.internId}
                        </span>
                      </td>
                      <td className="table-cell text-sm whitespace-nowrap">{intern.department}</td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {intern.techStack?.slice(0,2).map(t => (
                            <span key={t} className="badge-violet text-xs">{t}</span>
                          ))}
                          {intern.techStack?.length > 2 && <span className="text-xs text-zinc-400">+{intern.techStack.length-2}</span>}
                        </div>
                      </td>
                      <td className="table-cell text-xs text-zinc-500 whitespace-nowrap">{intern.internshipDuration||'—'}</td>
                      <td className="table-cell"><Badge status={intern.status} label={intern.status} /></td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full" style={{ width:`${intern.performanceScore}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-zinc-500">{intern.performanceScore}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-0.5">
                          <Link to={`/admin/interns/${intern._id}`}
                            className="p-2 rounded-lg text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors">
                            <Eye size={14} />
                          </Link>
                          <button className="p-2 rounded-lg text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDelete(intern._id)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
            <p className="text-xs text-zinc-400">Page {pagination.page} of {pagination.pages} &bull; {pagination.total} students</p>
            <div className="flex gap-2">
              <button disabled={pagination.page<=1} onClick={() => fetchInterns(pagination.page-1)} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Prev</button>
              <button disabled={pagination.page>=pagination.pages} onClick={() => fetchInterns(pagination.page+1)} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Student Modal */}
      <Modal isOpen={createModal} onClose={() => { setCreateModal(false); reset() }}
        title="Enroll New Student" subtitle="A welcome email with login credentials will be sent automatically." size="lg">
        <form onSubmit={handleSubmit(onCreateStudent)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name <span className="text-red-500">*</span></label>
              <input {...register('name',{ required:true })} className="input" placeholder="Jane Doe" />
              {errors.name && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>
            <div>
              <label className="label">Email Address <span className="text-red-500">*</span></label>
              <input {...register('email',{ required:true })} type="email" className="input" placeholder="jane@email.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+91 9876543210" />
            </div>
            <div>
              <label className="label">Department <span className="text-red-500">*</span></label>
              <select {...register('department',{ required:true })} className="input">
                <option value="">Select department</option>
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>
            <div>
              <label className="label">Primary Tech Stack</label>
              <select {...register('techStack')} className="input">
                <option value="">Select stack</option>
                {STACKS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Mentor Name</label>
              <input {...register('mentor')} className="input" placeholder="Mentor name" />
            </div>
            <div>
              <label className="label">Start Date <span className="text-red-500">*</span></label>
              <input {...register('internshipStart',{ required:true })} type="date" className="input" />
              {errors.internshipStart && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>
            <div>
              <label className="label">End Date <span className="text-red-500">*</span></label>
              <input {...register('internshipEnd',{ required:true })} type="date" className="input" />
              {errors.internshipEnd && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>
            <div>
              <label className="label">College / University</label>
              <input {...register('collegeName')} className="input" placeholder="University name" />
            </div>
            <div>
              <label className="label">Degree Program</label>
              <input {...register('degree')} className="input" placeholder="B.Tech Computer Science" />
            </div>
          </div>

          <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 rounded-xl p-4 text-sm text-violet-700 dark:text-violet-300">
            Default password will be <span className="font-mono font-bold">Intern@123</span>. The student will be prompted to change it on first login.
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setCreateModal(false); reset() }} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</> : 'Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
