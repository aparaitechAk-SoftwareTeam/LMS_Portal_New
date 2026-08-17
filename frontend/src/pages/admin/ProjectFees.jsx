import { useEffect, useState } from 'react'
import { Plus, IndianRupee, Trash2, CheckCircle, Clock, AlertCircle, Filter } from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import { Badge, Empty, Skeleton, PageHeader, StatCard } from '../../components/common/index'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const STATUS_CFG = {
  paid:      { cls:'badge-green',  icon: CheckCircle, color:'#10b981', label:'Paid'      },
  pending:   { cls:'badge-yellow', icon: Clock,       color:'#f59e0b', label:'Pending'   },
  overdue:   { cls:'badge-red',    icon: AlertCircle, color:'#ef4444', label:'Overdue'   },
  initiated: { cls:'badge-violet', icon: Clock,       color:'#7c3aed', label:'Initiated' },
  waived:    { cls:'badge-slate',  icon: CheckCircle, color:'#71717a', label:'Waived'    },
}

export default function ProjectFees() {
  const [fees,       setFees]       = useState([])
  const [interns,    setInterns]    = useState([])
  const [projects,   setProjects]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [filters,    setFilters]    = useState({ status:'', internId:'' })
  const [pagination, setPagination] = useState({})
  const [page,       setPage]       = useState(1)
  const { register, handleSubmit, reset } = useForm()

  const fetchFees = async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p, limit: 15, ...filters })
      const r = await api.get(`/razorpay/fees?${params}`)
      setFees(r.data.data)
      setPagination(r.data.pagination)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    Promise.all([api.get('/interns?limit=200&status=active'), api.get('/projects?limit=100')])
      .then(([iRes, pRes]) => { setInterns(iRes.data.data||[]); setProjects(pRes.data.data||[]) })
  }, [])
  useEffect(() => { fetchFees(1); setPage(1) }, [filters])

  const onAssign = async (data) => {
    setSaving(true)
    try {
      await api.post('/razorpay/assign-fee', data)
      toast.success('Fee assigned & intern notified!')
      setModal(false); reset(); fetchFees(page)
    } catch (e) { toast.error(e?.response?.data?.message||'Failed') } finally { setSaving(false) }
  }

  const onDelete = async (id) => {
    if (!confirm('Remove this fee?')) return
    await api.delete(`/razorpay/fees/${id}`)
    toast.success('Fee removed'); fetchFees(page)
  }

  const totalPaid    = fees.filter(f=>f.status==='paid').reduce((s,f)=>s+f.amount,0)
  const totalPending = fees.filter(f=>f.status==='pending').reduce((s,f)=>s+f.amount,0)

  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader title="Project Fees" subtitle="Assign and track project fees for students"
        actions={<button onClick={() => setModal(true)} className="btn-primary text-sm"><Plus size={15}/>Assign Fee</button>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'Total Fees',     value: fees.length,                          icon: IndianRupee, color:'violet' },
          { label:'Collected',      value: `₹${totalPaid.toLocaleString()}`,     icon: CheckCircle, color:'green'  },
          { label:'Pending',        value: `₹${totalPending.toLocaleString()}`,  icon: Clock,       color:'amber'  },
          { label:'Paid Count',     value: fees.filter(f=>f.status==='paid').length, icon: CheckCircle, color:'green' },
        ].map((s,i) => <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.05}}><StatCard {...s}/></motion.div>)}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input w-40 text-sm" value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}>
          <option value="">All Status</option>
          {['pending','paid','overdue','initiated','waived'].map(s=><option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <select className="input w-48 text-sm" value={filters.internId} onChange={e=>setFilters(f=>({...f,internId:e.target.value}))}>
          <option value="">All Students</option>
          {interns.map(i=><option key={i._id} value={i._id}>{i.user?.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
            <tr>{['Student','Fee Title','Project','Amount','Status','Due Date','Invoice','Actions'].map(h=>(
              <th key={h} className="table-header py-3 px-4 text-left whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {loading ? Array(5).fill(0).map((_,i)=>(
              <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800"><td colSpan={8} className="px-4 py-3"><Skeleton lines={1}/></td></tr>
            )) : fees.length===0 ? (
              <tr><td colSpan={8}><Empty title="No project fees assigned yet" icon={IndianRupee}/></td></tr>
            ) : fees.map((fee,i)=>{
              const scfg = STATUS_CFG[fee.status]||STATUS_CFG.pending
              return (
                <motion.tr key={fee._id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*.03}} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-600">{fee.intern?.user?.name?.[0]}</div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{fee.intern?.user?.name}</p>
                        <p className="text-xs text-zinc-400">{fee.intern?.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{fee.title}</p>
                    {fee.description&&<p className="text-xs text-zinc-400 truncate max-w-[160px]">{fee.description}</p>}
                  </td>
                  <td className="table-cell text-xs text-zinc-400">{fee.project?.title||'—'}</td>
                  <td className="table-cell font-bold text-zinc-900 dark:text-white">₹{fee.amount?.toLocaleString()}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5">
                      <scfg.icon size={13} style={{color:scfg.color}}/>
                      <span className={scfg.cls+' capitalize'}>{fee.status}</span>
                    </div>
                  </td>
                  <td className="table-cell text-xs">{fee.dueDate?new Date(fee.dueDate).toLocaleDateString():'—'}</td>
                  <td className="table-cell"><span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-300">{fee.invoiceNumber||'—'}</span></td>
                  <td className="table-cell">
                    {fee.status!=='paid'&&<button onClick={()=>onDelete(fee._id)} className="p-2 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"><Trash2 size={13}/></button>}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
        {pagination.pages>1&&(
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
            <p className="text-xs text-zinc-400">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button disabled={page<=1} onClick={()=>{setPage(p=>p-1);fetchFees(page-1)}} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Prev</button>
              <button disabled={page>=pagination.pages} onClick={()=>{setPage(p=>p+1);fetchFees(page+1)}} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Assign Fee Modal */}
      <Modal isOpen={modal} onClose={()=>{setModal(false);reset()}} title="Assign Project Fee"
        subtitle="Student will receive email notification and can pay via Razorpay" size="lg">
        <form onSubmit={handleSubmit(onAssign)} className="space-y-4">
          <div>
            <label className="label">Student <span className="text-red-500">*</span></label>
            <select {...register('internId',{required:true})} className="input">
              <option value="">Select student</option>
              {interns.map(i=><option key={i._id} value={i._id}>{i.user?.name} — {i.department} ({i.internId})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Linked Project (optional)</label>
            <select {...register('projectId')} className="input">
              <option value="">No project link</option>
              {projects.map(p=><option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Fee Title <span className="text-red-500">*</span></label>
            <input {...register('title',{required:true})} className="input" placeholder="e.g. E-Commerce Project Fee"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (₹) <span className="text-red-500">*</span></label>
              <input {...register('amount',{required:true,min:1})} type="number" className="input" placeholder="2500"/>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input {...register('dueDate')} type="date" className="input"/>
            </div>
          </div>
          <div>
            <label className="label">Description / Instructions</label>
            <textarea {...register('description')} className="input h-20 resize-none" placeholder="What does this fee cover? Any access or deliverables included…"/>
          </div>
          <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900 rounded-xl p-4 text-sm text-violet-700 dark:text-violet-300">
            Student will receive an email with a payment link. Payment will be processed via <strong>Razorpay</strong>. You'll be notified when payment is completed.
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={()=>{setModal(false);reset()}} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Assigning…</>:'Assign Fee & Notify'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
