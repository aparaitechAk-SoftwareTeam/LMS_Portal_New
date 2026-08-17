import { useEffect, useState } from 'react'
import { Plus, FolderKanban, Edit, Trash2, Users } from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import { Badge, Empty, Skeleton } from '../../components/common/index'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const [pRes, iRes] = await Promise.all([api.get('/projects'), api.get('/interns?limit=100')])
      setProjects(pRes.data.data)
      setInterns(iRes.data.data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchProjects() }, [])

  const onCreate = async (data) => {
    setSaving(true)
    try {
      const milestones = data.milestones ? data.milestones.split('\n').filter(Boolean).map(m => ({ title: m.trim() })) : []
      await api.post('/projects', { ...data, milestones, assignedTo: data.assignedTo ? [data.assignedTo] : [] })
      toast.success('Project created')
      setModal(false); reset(); fetchProjects()
    } catch {} finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Projects</h1>
          <p className="text-sm text-slate-400">{projects.length} projects total</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={15} />Create Project</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? Array(6).fill(0).map((_, i) => <div key={i} className="card p-5"><Skeleton lines={4} /></div>)
          : projects.length === 0 ? <div className="col-span-3"><Empty title="No projects yet" icon={FolderKanban} /></div>
          : projects.map((project, i) => (
          <motion.div key={project._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card-hover p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 dark:text-white truncate">{project.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{project.description}</p>
              </div>
              <Badge status={project.status} label={project.status} />
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {project.techStack?.slice(0, 4).map(t => <span key={t} className="badge-blue text-xs">{t}</span>)}
            </div>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">Progress</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{project.progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-dark-600 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-slate-400">
                <Users size={13} />
                <span className="text-xs">{project.assignedTo?.length || 0} interns</span>
              </div>
              {project.endDate && (
                <span className="text-xs text-slate-400">Due: {new Date(project.endDate).toLocaleDateString()}</span>
              )}
              <div className="flex gap-1">
                <button className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors"><Edit size={14} /></button>
                <button onClick={async () => { if (confirm('Delete?')) { await api.delete(`/projects/${project._id}`); fetchProjects() } }} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>

            {/* Milestones */}
            {project.milestones?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-dark-600">
                <p className="text-xs font-medium text-slate-500 mb-2">Milestones</p>
                <div className="space-y-1">
                  {project.milestones.slice(0, 3).map((m, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs">
                      <div className={`w-3 h-3 rounded-full border flex-shrink-0 ${m.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-dark-500'}`} />
                      <span className={m.completed ? 'line-through text-slate-400' : 'text-slate-600 dark:text-slate-300'}>{m.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => { setModal(false); reset() }} title="Create Project" size="lg">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div><label className="label">Project Title</label><input {...register('title', { required: true })} className="input" placeholder="Project name" /></div>
          <div><label className="label">Description</label><textarea {...register('description', { required: true })} className="input h-20 resize-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Status</label>
              <select {...register('status')} className="input">
                {['pending','ongoing','review','completed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Priority</label>
              <select {...register('priority')} className="input">
                {['low','medium','high'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="label">Start Date</label><input {...register('startDate')} type="date" className="input" /></div>
            <div><label className="label">End Date</label><input {...register('endDate')} type="date" className="input" /></div>
          </div>
          <div><label className="label">Tech Stack (comma separated)</label><input {...register('techStack')} className="input" placeholder="React, Node.js, MongoDB" /></div>
          <div><label className="label">Assign To</label>
            <select {...register('assignedTo')} className="input">
              <option value="">Select intern</option>
              {interns.map(i => <option key={i._id} value={i._id}>{i.user?.name} — {i.department}</option>)}
            </select>
          </div>
          <div><label className="label">Milestones (one per line)</label><textarea {...register('milestones')} className="input h-20 resize-none" placeholder="Design mockups&#10;Backend API&#10;Frontend integration" /></div>
          <div><label className="label">GitHub Repository</label><input {...register('githubRepo')} className="input" placeholder="https://github.com/..." /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setModal(false); reset() }} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
