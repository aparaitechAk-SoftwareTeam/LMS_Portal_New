import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Users, BookOpen, Code, Database, Brain, Globe, Smartphone, Shield, Cloud, BarChart2 } from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import { Empty, Skeleton, PageHeader, Badge } from '../../components/common/index'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const DOMAIN_ICONS = { Code, Database, Brain, Globe, Smartphone, Shield, Cloud, BarChart2, BookOpen }
const ICON_NAMES   = Object.keys(DOMAIN_ICONS)
const PRESET_COLORS = ['#7c3aed','#059669','#0284c7','#d97706','#dc2626','#db2777','#0891b2','#65a30d']
const PRESETS = [
  { name:'Web Development', icon:'Globe', color:'#0284c7', skills:['HTML','CSS','JavaScript','React','Node.js'] },
  { name:'Data Science',    icon:'BarChart2', color:'#7c3aed', skills:['Python','Pandas','NumPy','Matplotlib','SQL'] },
  { name:'AI/ML',           icon:'Brain', color:'#059669', skills:['Python','TensorFlow','PyTorch','Scikit-learn'] },
  { name:'Mobile Dev',      icon:'Smartphone', color:'#d97706', skills:['Flutter','React Native','Kotlin','Swift'] },
  { name:'DevOps',          icon:'Cloud', color:'#0891b2', skills:['Docker','Kubernetes','AWS','CI/CD','Linux'] },
  { name:'Cybersecurity',   icon:'Shield', color:'#dc2626', skills:['Networking','Penetration Testing','SIEM','Python'] },
]

function CapacityBar({ current, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{current}/{max} students</span>
        <span className={`font-bold ${pct>=90?'text-red-500':pct>=70?'text-amber-500':'text-emerald-600'}`}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width:`${pct}%` }}/>
      </div>
    </div>
  )
}

export default function Domains() {
  const [domains, setDomains] = useState([])
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [currModal, setCurrModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, setValue, watch } = useForm()
  const { register:regC, handleSubmit:handleCurr, reset:resetC } = useForm()
  const selColor = watch('color', '#7c3aed')

  const fetchDomains = async () => {
    setLoading(true)
    try {
      const [dRes, pRes, tRes] = await Promise.all([
        api.get('/domains'),
        api.get('/projects?limit=100'),
        api.get('/tasks?limit=100'),
      ])
      setDomains(dRes.data.data)
      setProjects(pRes.data.data || [])
      setTasks(tRes.data.data || [])
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchDomains() }, [])

  const openCreate = (preset) => {
    reset()
    if (preset) { setValue('name', preset.name); setValue('icon', preset.icon); setValue('color', preset.color); setValue('skills', preset.skills.join(', ')) }
    setEditTarget(null); setModal(true)
  }
  const openEdit = (d) => {
    setValue('name', d.name); setValue('description', d.description); setValue('icon', d.icon)
    setValue('color', d.color); setValue('maxCapacity', d.maxCapacity); setValue('skills', d.skills?.join(', '))
    setEditTarget(d._id); setModal(true)
  }

  const onSave = async (data) => {
    setSaving(true)
    try {
      const payload = { ...data, skills: data.skills?.split(',').map(s=>s.trim()).filter(Boolean) }
      editTarget ? await api.put(`/domains/${editTarget}`, payload) : await api.post('/domains', payload)
      toast.success(editTarget ? 'Domain updated' : 'Domain created')
      setModal(false); reset(); fetchDomains()
    } catch {} finally { setSaving(false) }
  }

  const onDelete = async (id) => {
    if (!confirm('Delete this domain?')) return
    await api.delete(`/domains/${id}`); toast.success('Deleted'); fetchDomains()
  }

  const onAddCurriculum = async (data) => {
    try {
      await api.post(`/domains/${currModal._id}/curriculum`, data)
      toast.success('Curriculum item added')
      resetC(); fetchDomains()
      const updated = await api.get('/domains')
      setCurrModal(updated.data.data.find(d => d._id === currModal._id))
    } catch {}
  }

  const onDeleteCurr = async (domainId, itemId) => {
    await api.delete(`/domains/${domainId}/curriculum/${itemId}`)
    toast.success('Removed')
    const updated = await api.get('/domains')
    setCurrModal(updated.data.data.find(d => d._id === domainId))
    fetchDomains()
  }

  return (
    <div className="space-y-6 max-w-screen-xl">
      <PageHeader title="Domain Management" subtitle={`${domains.length} domains configured`}
        actions={<button onClick={() => openCreate(null)} className="btn-primary text-sm"><Plus size={15}/>New Domain</button>} />

      {/* Quick add presets */}
      <div className="card p-5">
        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">Quick Add from Presets</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => {
            const Icon = DOMAIN_ICONS[p.icon] || Code
            const exists = domains.some(d => d.name === p.name)
            return (
              <button key={p.name} onClick={() => !exists && openCreate(p)} disabled={exists}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all
                  ${exists ? 'opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400'
                           : 'border-dashed border-zinc-300 dark:border-zinc-700 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 text-zinc-600 dark:text-zinc-400'}`}>
                <Icon size={13} style={{ color: p.color }}/>
                {p.name}
                {exists && <span className="text-xs">(active)</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Domains grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? Array(4).fill(0).map((_,i) => <div key={i} className="card p-5 h-52"><Skeleton lines={5}/></div>)
        : domains.length === 0 ? <div className="col-span-3"><Empty title="No domains yet" icon={BookOpen} description="Create domains to organize your internship tracks"/></div>
        : domains.map((d, i) => {
          const Icon = DOMAIN_ICONS[d.icon] || Code
          const isFull = d.currentCount >= d.maxCapacity
          return (
            <motion.div key={d._id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.05}} className="card overflow-hidden group">
              <div className="h-1.5 w-full" style={{ background: d.color }}/>
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: d.color + '20' }}>
                      <Icon size={20} style={{ color: d.color }}/>
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white text-sm">{d.name}</h3>
                      {isFull && <span className="badge-red text-xs">Full</span>}
                      {!isFull && d.isActive && <span className="badge-green text-xs">Active</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setCurrModal(d)} className="p-1.5 text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/20 rounded-lg transition-colors" title="Curriculum"><BookOpen size={13}/></button>
                    <button onClick={() => openEdit(d)} className="p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-colors"><Edit size={13}/></button>
                    <button onClick={() => onDelete(d._id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"><Trash2 size={13}/></button>
                  </div>
                </div>

                {d.description && <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{d.description}</p>}

                <CapacityBar current={d.currentCount} max={d.maxCapacity}/>

                <div className="flex flex-wrap gap-1 mt-3">
                  {d.skills?.slice(0,4).map(s => <span key={s} className="tag text-xs">{s}</span>)}
                  {d.skills?.length > 4 && <span className="text-xs text-zinc-400 self-center">+{d.skills.length-4}</span>}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400">
                  <span className="flex items-center gap-1"><BookOpen size={11}/>{d.curriculum?.length||0} curriculum items</span>
                  <span className="flex items-center gap-1"><Users size={11}/>{d.currentCount} students</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modal} onClose={() => {setModal(false);reset()}} title={editTarget ? 'Edit Domain' : 'Create Domain'} size="lg">
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Domain Name <span className="text-red-500">*</span></label>
              <input {...register('name',{required:true})} className="input" placeholder="e.g. Web Development"/></div>
            <div><label className="label">Icon</label>
              <select {...register('icon')} className="input">
                {ICON_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div><label className="label">Max Capacity</label>
              <input {...register('maxCapacity')} type="number" min="1" className="input" placeholder="20"/></div>
          </div>
          <div><label className="label">Description</label>
            <textarea {...register('description')} className="input h-16 resize-none" placeholder="Brief description…"/></div>
          <div><label className="label">Skills (comma separated)</label>
            <input {...register('skills')} className="input" placeholder="React, Node.js, MongoDB…"/></div>
          <div>
            <label className="label">Brand Color</label>
            <div className="flex items-center gap-3 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setValue('color', c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${selColor===c ? 'border-zinc-800 dark:border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }}/>
              ))}
              <input {...register('color')} type="color" className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-300"/>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => {setModal(false);reset()}} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</> : editTarget ? 'Update Domain' : 'Create Domain'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Curriculum Modal */}
      <Modal isOpen={!!currModal} onClose={() => setCurrModal(null)} title={`Curriculum — ${currModal?.name}`} size="lg">
        {currModal && (
          <div className="space-y-5">
            <form onSubmit={handleCurr(onAddCurriculum)} className="card p-4 space-y-3 bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900">
              <p className="text-sm font-bold text-violet-700 dark:text-violet-300">Add Curriculum Item</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label text-xs">Week #</label>
                  <input {...regC('week')} type="number" min="1" className="input text-sm" placeholder="1"/></div>
                <div><label className="label text-xs">Type</label>
                  <select {...regC('type')} className="input text-sm">
                    {['assignment','project','test','lecture'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className="label text-xs">Title <span className="text-red-500">*</span></label>
                  <input {...regC('title',{required:true})} className="input text-sm" placeholder="e.g. Build a REST API"/></div>
                <div className="col-span-2"><label className="label text-xs">Description</label>
                  <textarea {...regC('description')} className="input text-sm h-16 resize-none" placeholder="Learning objectives…"/></div>
                <div><label className="label text-xs">Link Project</label>
                  <select {...regC('linkedItem')} className="input text-sm">
                    <option value="">None</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary text-sm w-full"><Plus size={13}/>Add Item</button>
            </form>

            {/* Existing curriculum */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {currModal.curriculum?.length === 0
                ? <p className="text-sm text-zinc-400 text-center py-4">No curriculum items yet</p>
                : [...(currModal.curriculum||[])].sort((a,b)=>a.week-b.week).map((item, i) => (
                <div key={item._id||i} className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-600 flex-shrink-0">W{item.week||'?'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="badge-violet text-xs capitalize">{item.type}</span>
                      {item.description && <span className="text-xs text-zinc-400 truncate">{item.description}</span>}
                    </div>
                  </div>
                  <button onClick={() => onDeleteCurr(currModal._id, item._id)} className="text-zinc-400 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 size={13}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
