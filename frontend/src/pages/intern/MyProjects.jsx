import { useEffect, useState } from 'react'
import { FolderKanban, Github, ExternalLink, CheckCircle, Circle } from 'lucide-react'
import api from '../../services/api'
import { Badge, Empty, Skeleton, PageHeader } from '../../components/common/index'
import { motion } from 'framer-motion'

export default function MyProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.get('/projects').then(r => { setProjects(r.data.data); if(r.data.data.length) setSelected(r.data.data[0]._id) })
      .finally(() => setLoading(false))
  }, [])

  const statusGrad = {
    pending:   'from-zinc-400 to-zinc-500',
    ongoing:   'from-violet-500 to-violet-600',
    review:    'from-amber-400 to-amber-500',
    completed: 'from-emerald-400 to-emerald-500',
  }

  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader title="My Projects" subtitle={`${projects.length} project(s) assigned`} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array(4).fill(0).map((_,i) => <div key={i} className="card p-5"><Skeleton lines={5} /></div>)}
        </div>
      ) : projects.length===0 ? (
        <Empty title="No projects assigned yet" description="Your admin will assign projects to you soon." icon={FolderKanban} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project list */}
          <div className="space-y-3">
            {projects.map((p,i) => (
              <motion.div key={p._id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.06 }}
                onClick={() => setSelected(p._id)}
                className={`course-card p-4 cursor-pointer transition-all
                  ${selected===p._id ? 'ring-2 ring-violet-500 border-violet-200 dark:border-violet-800' : ''}`}>
                <div className={`h-1 w-full rounded-full bg-gradient-to-r ${statusGrad[p.status]||'from-zinc-400 to-zinc-500'} mb-3`} />
                <h3 className="font-semibold text-zinc-900 dark:text-white text-sm mb-1 line-clamp-1">{p.title}</h3>
                <div className="flex items-center justify-between">
                  <Badge status={p.status} label={p.status} />
                  <span className="text-xs font-bold text-violet-600">{p.progress}%</span>
                </div>
                <div className="mt-2.5 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width:`${p.progress}%` }} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Project detail */}
          {(() => {
            const p = projects.find(pr => pr._id===selected)
            if (!p) return null
            return (
              <div className="lg:col-span-2 space-y-5">
                <div className="card overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${statusGrad[p.status]||'from-zinc-400 to-zinc-500'}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{p.title}</h2>
                        <p className="text-sm text-zinc-500 mt-1">{p.description}</p>
                      </div>
                      <Badge status={p.status} label={p.status} />
                    </div>

                    {/* Tech stack */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {p.techStack?.map(t => <span key={t} className="badge-violet">{t}</span>)}
                    </div>

                    {/* Progress */}
                    <div className="mb-5">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">Overall Progress</span>
                        <span className="font-bold text-violet-600">{p.progress}%</span>
                      </div>
                      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width:0 }} animate={{ width:`${p.progress}%` }} transition={{ duration:.8 }}
                          className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full" />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      {[
                        { label:'Start Date', value: p.startDate ? new Date(p.startDate).toDateString() : '—' },
                        { label:'End Date',   value: p.endDate   ? new Date(p.endDate).toDateString()   : '—' },
                      ].map(item => (
                        <div key={item.label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                          <p className="text-xs text-zinc-400 mb-1">{item.label}</p>
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Links */}
                    {(p.githubRepo || p.liveUrl) && (
                      <div className="flex gap-3 mb-5">
                        {p.githubRepo && (
                          <a href={p.githubRepo} target="_blank" className="btn-secondary text-sm gap-2">
                            <Github size={14} />Repository
                          </a>
                        )}
                        {p.liveUrl && (
                          <a href={p.liveUrl} target="_blank" className="btn-secondary text-sm gap-2">
                            <ExternalLink size={14} />Live Demo
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Milestones */}
                {p.milestones?.length > 0 && (
                  <div className="card p-5">
                    <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Milestones</h3>
                    <div className="space-y-3">
                      {p.milestones.map((m, mi) => (
                        <div key={mi} className={`flex items-start gap-3 p-3.5 rounded-xl border
                          ${m.completed
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                            : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-800'}`}>
                          {m.completed
                            ? <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                            : <Circle size={18} className="text-zinc-400 flex-shrink-0 mt-0.5" />}
                          <div>
                            <p className={`text-sm font-semibold ${m.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>{m.title}</p>
                            {m.dueDate && <p className="text-xs text-zinc-400 mt-0.5">Due: {new Date(m.dueDate).toDateString()}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team members */}
                {p.assignedTo?.length > 1 && (
                  <div className="card p-5">
                    <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Project Team</h3>
                    <div className="flex flex-wrap gap-3">
                      {p.assignedTo.map(intern => (
                        <div key={intern._id} className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2">
                          <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-600">
                            {intern.user?.name?.[0]}
                          </div>
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{intern.user?.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
