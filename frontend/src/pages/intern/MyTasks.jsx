import { useEffect, useState } from 'react'
import { BookOpen, Upload, MessageSquare, Send, X, ExternalLink, Clock, AlertCircle } from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import { Badge, Empty, Skeleton, PageHeader } from '../../components/common/index'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const PRIORITY_STYLE = {
  low:    { bar:'bg-emerald-500', text:'text-emerald-600', bg:'bg-emerald-50 dark:bg-emerald-950/20' },
  medium: { bar:'bg-amber-500',   text:'text-amber-600',   bg:'bg-amber-50 dark:bg-amber-950/20' },
  high:   { bar:'bg-red-500',     text:'text-red-600',     bg:'bg-red-50 dark:bg-red-950/20' },
}

export default function MyCourses() {
  const [tasks, setTasks]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [submitModal, setSubmitModal] = useState(null)
  const [commentModal, setCommentModal] = useState(null)
  const [submitting, setSubmitting]   = useState(false)
  const [files, setFiles]         = useState([])
  const [filters, setFilters]     = useState({ status:'', priority:'' })
  const { register, handleSubmit, reset } = useForm()
  const { register:regC, handleSubmit:handleC, reset:resetC } = useForm()

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(filters)
      const { data } = await api.get(`/tasks/my-tasks?${params}`)
      setTasks(data.data)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchTasks() }, [filters])

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('taskId', submitModal._id)
      fd.append('githubLink', data.githubLink||'')
      fd.append('liveLink', data.liveLink||'')
      fd.append('notes', data.notes||'')
      files.forEach(f => fd.append('files', f))
      await api.post('/tasks/submit', fd, { headers:{ 'Content-Type':'multipart/form-data' } })
      toast.success('Task submitted!')
      setSubmitModal(null); setFiles([]); reset(); fetchTasks()
    } catch {} finally { setSubmitting(false) }
  }

  const onComment = async (data) => {
    try {
      await api.post(`/tasks/${commentModal._id}/comment`, data)
      toast.success('Comment posted')
      resetC(); fetchTasks()
    } catch {}
  }

  const statusTabs = ['','pending','in_progress','submitted','approved','rejected']

  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader title="My Courses & Tasks" subtitle={`${tasks.length} tasks assigned to you`} />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1">
          {statusTabs.map(s => (
            <button key={s} onClick={() => setFilters(f => ({ ...f, status:s }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize
                ${filters.status===s ? 'bg-white dark:bg-zinc-800 text-violet-700 dark:text-violet-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <select className="input w-32 text-xs" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority:e.target.value }))}>
          <option value="">Priority</option>
          {['low','medium','high'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Task grid — Udemy course-card style */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? Array(6).fill(0).map((_,i) => (
          <div key={i} className="card p-5"><Skeleton lines={4} /></div>
        )) : tasks.length===0 ? (
          <div className="col-span-3"><Empty title="No tasks assigned yet" description="Your instructor will assign tasks soon." icon={BookOpen} /></div>
        ) : tasks.map((task,i) => {
          const daysLeft = Math.ceil((new Date(task.dueDate)-new Date()) / (1000*60*60*24))
          const isOverdue = daysLeft < 0
          const ps = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium
          return (
            <motion.div key={task._id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.04 }}
              className="course-card">
              {/* Color top bar */}
              <div className={`h-1.5 w-full ${ps.bar}`} />

              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <Badge status={task.status} label={task.status.replace('_',' ')} />
                    <h3 className="font-bold text-zinc-900 dark:text-white mt-2 leading-snug line-clamp-2">{task.title}</h3>
                  </div>
                  <span className={`text-xs font-bold uppercase ${ps.text} flex-shrink-0`}>{task.priority}</span>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4">{task.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="tag capitalize">{task.type}</span>
                  {task.project && <span className="tag text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30">{task.project.title}</span>}
                </div>

                {/* Deadline */}
                <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 mb-4 text-xs ${isOverdue ? 'bg-red-50 dark:bg-red-950/20' : 'bg-zinc-50 dark:bg-zinc-800/60'}`}>
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Clock size={12} />
                    <span>{new Date(task.dueDate).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' })}</span>
                  </div>
                  <span className={`font-bold ${isOverdue ? 'text-red-500' : daysLeft<=2 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                  </span>
                </div>

                {/* Rejected feedback */}
                {task.status==='rejected' && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-3 mb-4">
                    <p className="text-xs font-semibold text-red-600 mb-1">Feedback from reviewer</p>
                    <p className="text-xs text-red-500 line-clamp-2">{task.comments?.slice(-1)[0]?.text || 'Please check and resubmit.'}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {['pending','in_progress','rejected'].includes(task.status) && (
                    <button onClick={() => setSubmitModal(task)}
                      className="btn-primary flex-1 text-xs py-2">
                      <Upload size={12} />{task.status==='rejected' ? 'Resubmit' : 'Submit Work'}
                    </button>
                  )}
                  <button onClick={() => setCommentModal(task)}
                    className="btn-secondary px-3 py-2 text-xs gap-1.5">
                    <MessageSquare size={12} />
                    {task.comments?.length||0}
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Submit Modal */}
      <Modal isOpen={!!submitModal} onClose={() => { setSubmitModal(null); setFiles([]); reset() }}
        title={`Submit: ${submitModal?.title}`} subtitle="Upload your work for review" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Drag drop */}
          <div>
            <label className="label">Upload Files</label>
            <label className="block border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-violet-400 dark:hover:border-violet-600 transition-colors group"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setFiles(Array.from(e.dataTransfer.files)) }}>
              <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mx-auto mb-3 group-hover:bg-violet-100 dark:group-hover:bg-violet-950/50 transition-colors">
                <Upload size={20} className="text-violet-500" />
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Drag & drop files here</p>
              <p className="text-xs text-zinc-400 mt-1">or <span className="text-violet-600 underline">browse</span> — ZIP, PDF, DOC, Images</p>
              <input type="file" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files))} />
            </label>
            {files.length>0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((f,i) => (
                  <div key={i} className="flex items-center justify-between bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900 rounded-lg px-3 py-2">
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate">{f.name}</span>
                    <button type="button" onClick={() => setFiles(files.filter((_,j)=>j!==i))} className="text-zinc-400 hover:text-red-500 ml-2"><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label flex items-center gap-1.5"><ExternalLink size={13} />GitHub Repository</label>
            <input {...register('githubLink')} className="input" placeholder="https://github.com/username/repo" />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><ExternalLink size={13} />Live Demo URL</label>
            <input {...register('liveLink')} className="input" placeholder="https://your-demo.vercel.app" />
          </div>
          <div>
            <label className="label">Notes for Reviewer</label>
            <textarea {...register('notes')} className="input h-20 resize-none" placeholder="Any notes or context for the reviewer…" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setSubmitModal(null); setFiles([]); reset() }} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              <Send size={14} />{submitting ? 'Submitting…' : 'Submit Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Comments Modal */}
      <Modal isOpen={!!commentModal} onClose={() => setCommentModal(null)} title="Comments & Discussion">
        {commentModal && (
          <div className="space-y-3">
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              {commentModal.comments?.length>0 ? commentModal.comments.map((c,i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-600 flex-shrink-0">
                    {c.user?.name?.[0]}
                  </div>
                  <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{c.user?.name}</span>
                      <span className="text-xs text-zinc-400">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{c.text}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-zinc-400 text-sm">No comments yet — start the discussion!</div>
              )}
            </div>
            <form onSubmit={handleC(onComment)} className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <input {...regC('text',{ required:true })} className="input flex-1 text-sm" placeholder="Add a comment…" />
              <button type="submit" className="btn-primary px-4 text-sm">Post</button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  )
}
