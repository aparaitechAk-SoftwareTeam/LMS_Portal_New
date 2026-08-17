import { useEffect, useState } from 'react'
import { Plus, CheckSquare, Trash2, Eye, Filter, ChevronDown } from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import { Badge, Empty, Skeleton, PageHeader } from '../../components/common/index'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const PRIORITY_DOT = { low:'bg-emerald-500', medium:'bg-amber-500', high:'bg-red-500' }

export default function Tasks() {
  const [tasks, setTasks]     = useState([])
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [reviewModal, setReviewModal] = useState(null)
  const [filters, setFilters] = useState({ status:'', priority:'', type:'' })
  const [saving, setSaving]   = useState(false)
  const { register, handleSubmit, reset }    = useForm()
  const { register:regR, handleSubmit:handleR } = useForm()

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(filters)
      const [tRes, iRes] = await Promise.all([
        api.get(`/tasks?${params}`),
        api.get('/interns?limit=100&status=active'),
      ])
      setTasks(tRes.data.data)
      setInterns(iRes.data.data)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchTasks() }, [filters])

  const onCreate = async (data) => {
    setSaving(true)
    try {
      const assignedTo = data.assignedTo ? [data.assignedTo] : []
      await api.post('/tasks', { ...data, assignedTo })
      toast.success('Task created & student notified!')
      setModal(false); reset(); fetchTasks()
    } catch {} finally { setSaving(false) }
  }

  const onReview = async (data) => {
    try {
      await api.put(`/tasks/submission/${reviewModal}/review`, data)
      toast.success('Submission reviewed')
      setReviewModal(null); fetchTasks()
    } catch {}
  }

  const submitted = tasks.filter(t => t.status==='submitted').length
  const pending   = tasks.filter(t => t.status==='pending').length
  const approved  = tasks.filter(t => t.status==='approved').length

  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader
        title="Task Management"
        subtitle={`${tasks.length} tasks · ${submitted} awaiting review`}
        actions={
          <button onClick={() => setModal(true)} className="btn-primary text-sm">
            <Plus size={15} />Assign Task
          </button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {[
          { label:'Total',    value: tasks.length, color:'text-zinc-700 dark:text-zinc-300' },
          { label:'Pending',  value: pending,       color:'text-amber-600' },
          { label:'Review',   value: submitted,     color:'text-violet-600' },
          { label:'Approved', value: approved,      color:'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-zinc-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1">
          {['','pending','in_progress','submitted','approved','rejected'].map(s => (
            <button key={s} onClick={() => setFilters(f => ({ ...f, status:s }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize whitespace-nowrap
                ${filters.status===s ? 'bg-white dark:bg-zinc-800 text-violet-700 dark:text-violet-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <select className="input w-32 text-xs" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority:e.target.value }))}>
          <option value="">Priority</option>
          {['low','medium','high'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input w-28 text-xs" value={filters.type} onChange={e => setFilters(f => ({ ...f, type:e.target.value }))}>
          <option value="">Type</option>
          {['daily','weekly','project'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                {['Task','Type','Priority','Assigned To','Due Date','Status','Actions'].map(h => (
                  <th key={h} className="table-header py-3 px-4 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array(6).fill(0).map((_,i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td colSpan={7} className="px-4 py-3"><Skeleton lines={1} /></td>
                </tr>
              )) : tasks.length===0 ? (
                <tr><td colSpan={7}><Empty title="No tasks yet" description="Create your first task for students" icon={CheckSquare} /></td></tr>
              ) : tasks.map((task,i) => (
                <motion.tr key={task._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*.03 }}
                  className="table-row">
                  <td className="table-cell max-w-xs">
                    <p className="font-semibold text-zinc-900 dark:text-white truncate">{task.title}</p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{task.description}</p>
                  </td>
                  <td className="table-cell"><span className="tag capitalize">{task.type}</span></td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority]||'bg-zinc-400'}`} />
                      <span className="text-xs font-semibold capitalize text-zinc-700 dark:text-zinc-300">{task.priority}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex -space-x-1.5">
                      {task.assignedTo?.slice(0,3).map(intern => (
                        <div key={intern._id} title={intern.user?.name}
                          className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-bold text-violet-700 dark:text-violet-300">
                          {intern.user?.name?.[0]}
                        </div>
                      ))}
                      {task.assignedTo?.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs text-zinc-500">
                          +{task.assignedTo.length-3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell text-xs whitespace-nowrap">
                    {new Date(task.dueDate).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' })}
                  </td>
                  <td className="table-cell"><Badge status={task.status} label={task.status.replace('_',' ')} /></td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      {task.status==='submitted' && (
                        <button onClick={() => setReviewModal(task._id)}
                          className="btn-primary text-xs py-1.5 px-3">Review</button>
                      )}
                      <button onClick={async () => {
                        if (confirm('Delete this task?')) { await api.delete(`/tasks/${task._id}`); fetchTasks() }
                      }} className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={modal} onClose={() => { setModal(false); reset() }}
        title="Assign New Task" subtitle="Task will be assigned and the student notified immediately" size="lg">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div>
            <label className="label">Task Title <span className="text-red-500">*</span></label>
            <input {...register('title',{ required:true })} className="input" placeholder="Describe the task in a few words" />
          </div>
          <div>
            <label className="label">Description <span className="text-red-500">*</span></label>
            <textarea {...register('description',{ required:true })} className="input h-24 resize-none" placeholder="Detailed instructions, acceptance criteria, resources…" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Task Type</label>
              <select {...register('type')} className="input">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="project">Project</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select {...register('priority')} className="input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Due Date <span className="text-red-500">*</span></label>
              <input {...register('dueDate',{ required:true })} type="date" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Assign To Student <span className="text-red-500">*</span></label>
            <select {...register('assignedTo',{ required:true })} className="input">
              <option value="">Select a student</option>
              {interns.map(i => (
                <option key={i._id} value={i._id}>{i.user?.name} — {i.department}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setModal(false); reset() }} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Assigning…</> : 'Assign Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={!!reviewModal} onClose={() => setReviewModal(null)}
        title="Review Submission" subtitle="Approve or request changes on the student's work">
        <form onSubmit={handleR(onReview)} className="space-y-4">
          <div>
            <label className="label">Decision <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value:'approved', label:'Approve', style:'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' },
                { value:'rejected', label:'Request Changes', style:'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300' },
              ].map(opt => (
                <label key={opt.value} className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer font-semibold text-sm transition-all ${opt.style}`}>
                  <input type="radio" {...regR('status',{ required:true })} value={opt.value} className="accent-violet-600" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Feedback for Student</label>
            <textarea {...regR('reviewComment')} className="input h-24 resize-none"
              placeholder="Provide constructive feedback, suggestions for improvement, or praise…" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setReviewModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Submit Review</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
