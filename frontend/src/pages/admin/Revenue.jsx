import { useEffect, useState } from 'react'
import { Plus, Download, TrendingUp, IndianRupee, Clock, AlertCircle, CheckCircle, FileText, Filter, Edit, Trash2 } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import { Badge, Empty, Skeleton, PageHeader, StatCard } from '../../components/common/index'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const COLORS   = ['#7c3aed','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6']
const PERIODS  = ['daily','weekly','monthly','yearly']
const STATUS_CFG = {
  paid:    { label:'Paid',    cls:'badge-green',  icon: CheckCircle, color:'#10b981' },
  pending: { label:'Pending', cls:'badge-yellow', icon: Clock,       color:'#f59e0b' },
  overdue: { label:'Overdue', cls:'badge-red',    icon: AlertCircle, color:'#ef4444' },
  waived:  { label:'Waived',  cls:'badge-slate',  icon: FileText,    color:'#71717a' },
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-zinc-700 dark:text-zinc-200 mb-1">{label}</p>
      {payload.map((p,i) => <p key={i} style={{color:p.color}} className="font-semibold">₹{p.value?.toLocaleString()}</p>)}
    </div>
  )
}

export default function Revenue() {
  const [analytics, setAnalytics] = useState(null)
  const [payments, setPayments]   = useState([])
  const [interns, setInterns]     = useState([])
  const [domains, setDomains]     = useState([])
  const [period, setPeriod]       = useState('monthly')
  const [loading, setLoading]     = useState(true)
  const [pLoading, setPLoading]   = useState(false)
  const [modal, setModal]         = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [filters, setFilters]     = useState({ status:'', type:'' })
  const [page, setPage]           = useState(1)
  const [pagination, setPagination] = useState({})
  const [saving, setSaving]       = useState(false)
  const { register, handleSubmit, reset, setValue } = useForm()

  const fetchAnalytics = async () => {
    try {
      const r = await api.get(`/payments/analytics?period=${period}`)
      setAnalytics(r.data.data)
    } catch {}
  }

  const fetchPayments = async (p = 1) => {
    setPLoading(true)
    try {
      const params = new URLSearchParams({ page:p, limit:15, ...filters })
      const r = await api.get(`/payments?${params}`)
      setPayments(r.data.data)
      setPagination(r.data.pagination)
    } catch {} finally { setPLoading(false) }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const [iRes, dRes] = await Promise.all([api.get('/interns?limit=200'), api.get('/domains')])
        setInterns(iRes.data.data || [])
        setDomains(dRes.data.data || [])
      } catch {} finally { setLoading(false) }
    }
    init()
  }, [])

  useEffect(() => { fetchAnalytics() }, [period])
  useEffect(() => { fetchPayments(1); setPage(1) }, [filters])

  // Build time-series chart data
  const timeData = analytics?.timeSeries?.map(t => ({
    name: t._id.month ? `${['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][t._id.month]} ${t._id.year||''}` : String(t._id.year || t._id.week || t._id.day || ''),
    Revenue: t.revenue,
    Payments: t.count,
  })) || []

  const pieData = analytics?.statusDist?.map(s => ({ name: s._id, value: s.amount, count: s.count })) || []

  const onSave = async (data) => {
    setSaving(true)
    try {
      if (editTarget) {
        await api.put(`/payments/${editTarget}`, data)
        toast.success('Payment updated')
      } else {
        await api.post('/payments', data)
        toast.success('Payment recorded')
      }
      setModal(false); reset(); setEditTarget(null)
      fetchAnalytics(); fetchPayments(page)
    } catch {} finally { setSaving(false) }
  }

  const openEdit = (p) => {
    setValue('intern', p.intern?._id); setValue('type', p.type)
    setValue('amount', p.amount); setValue('status', p.status)
    setValue('paymentMethod', p.paymentMethod); setValue('notes', p.notes || '')
    setValue('transactionId', p.transactionId || '')
    if (p.dueDate) setValue('dueDate', new Date(p.dueDate).toISOString().split('T')[0])
    if (p.paidDate) setValue('paidDate', new Date(p.paidDate).toISOString().split('T')[0])
    setValue('domain', p.domain?._id || '')
    setEditTarget(p._id); setModal(true)
  }

  const onDelete = async (id) => {
    if (!confirm('Delete this payment record?')) return
    await api.delete(`/payments/${id}`); toast.success('Deleted')
    fetchPayments(page); fetchAnalytics()
  }

  return (
    <div className="space-y-6 max-w-screen-xl">
      <PageHeader title="Revenue Analytics" subtitle="Track onboarding (I1025) & final payments (I4025)"
        actions={
          <>
            <a href="/api/payments/export/excel" target="_blank" className="btn-secondary text-sm"><Download size={14}/>Excel</a>
            <a href="/api/payments/export/pdf"   target="_blank" className="btn-secondary text-sm"><FileText size={14}/>PDF</a>
            <button onClick={() => { setEditTarget(null); reset(); setModal(true) }} className="btn-primary text-sm"><Plus size={15}/>Record Payment</button>
          </>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Collected',  value: analytics ? `₹${analytics.summary.totalPaid.toLocaleString()}`    : '—', icon: IndianRupee, color:'green'  },
          { label:'Pending',          value: analytics ? `₹${analytics.summary.totalPending.toLocaleString()}` : '—', icon: Clock,        color:'amber'  },
          { label:'Overdue',          value: analytics ? `₹${analytics.summary.totalOverdue.toLocaleString()}` : '—', icon: AlertCircle,  color:'red'    },
          { label:'Total Payments',   value: (analytics?.statusDist?.reduce((s,d)=>s+d.count,0) || 0),              icon: TrendingUp,   color:'violet' },
        ].map((s, i) => (
          <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}>
            <StatCard {...s}/>
          </motion.div>
        ))}
      </div>

      {/* Period selector + area chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white">Revenue Over Time</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Collected payments by {period} period</p>
          </div>
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all
                  ${period===p ? 'bg-white dark:bg-zinc-800 text-violet-700 dark:text-violet-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        {timeData.length === 0
          ? <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">No payment data yet</div>
          : <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={.25}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={.5}/>
                <XAxis dataKey="name" tick={{fontSize:11, fill:'#71717a'}}/>
                <YAxis tick={{fontSize:11, fill:'#71717a'}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey="Revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#gRev)"/>
              </AreaChart>
            </ResponsiveContainer>
        }
      </div>

      {/* Domain breakdown + Status pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Domain-wise Revenue</h3>
          <p className="text-xs text-zinc-400 mb-4">Collected payments per domain</p>
          {analytics?.domainRevenue?.length === 0
            ? <div className="h-40 flex items-center justify-center text-zinc-400 text-sm">No domain data</div>
            : <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics?.domainRevenue||[]} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={.5}/>
                  <XAxis dataKey="_id" tick={{fontSize:10, fill:'#71717a'}}/>
                  <YAxis tick={{fontSize:10, fill:'#71717a'}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<Tip/>} formatter={v=>`₹${v.toLocaleString()}`}/>
                  <Bar dataKey="total" radius={[6,6,0,0]}>
                    {(analytics?.domainRevenue||[]).map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Payment Status Distribution</h3>
          <p className="text-xs text-zinc-400 mb-4">By payment amount</p>
          {pieData.length === 0
            ? <div className="h-40 flex items-center justify-center text-zinc-400 text-sm">No data</div>
            : <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={4}>
                      {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={v=>`₹${v.toLocaleString()}`}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5">
                  {pieData.map((d,i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:COLORS[i%COLORS.length]}}/>
                      <span className="text-zinc-600 dark:text-zinc-400 capitalize">{d.name}</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 ml-auto">₹{d.value?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
          }
        </div>
      </div>

      {/* Payments table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white">Payment Records</h3>
          <div className="flex gap-2">
            <select className="input w-32 text-xs" value={filters.status} onChange={e => setFilters(f=>({...f,status:e.target.value}))}>
              <option value="">All Status</option>
              {['paid','pending','overdue','waived'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
            <select className="input w-32 text-xs" value={filters.type} onChange={e => setFilters(f=>({...f,type:e.target.value}))}>
              <option value="">All Types</option>
              <option value="onboarding">Onboarding (I1025)</option>
              <option value="final">Final (I4025)</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>{['Invoice','Student','Type','Amount','Domain','Status','Due Date','Paid Date','Actions'].map(h => (
                <th key={h} className="table-header py-3 px-4 text-left whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {pLoading ? Array(5).fill(0).map((_,i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800"><td colSpan={9} className="px-4 py-3"><Skeleton lines={1}/></td></tr>
              )) : payments.length === 0 ? (
                <tr><td colSpan={9}><Empty title="No payment records" icon={IndianRupee}/></td></tr>
              ) : payments.map((p, i) => {
                const scfg = STATUS_CFG[p.status] || STATUS_CFG.pending
                return (
                  <motion.tr key={p._id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*.03}} className="table-row">
                    <td className="table-cell"><span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-300">{p.invoiceNumber||'—'}</span></td>
                    <td className="table-cell">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{p.intern?.user?.name||'—'}</p>
                      <p className="text-xs text-zinc-400">{p.intern?.user?.email}</p>
                    </td>
                    <td className="table-cell">
                      <span className={`badge text-xs ${p.type==='onboarding'?'badge-violet':'badge-blue'}`}>
                        {p.type==='onboarding'?'I1025':'I4025'}
                      </span>
                    </td>
                    <td className="table-cell font-bold text-zinc-900 dark:text-white">₹{p.amount?.toLocaleString()}</td>
                    <td className="table-cell text-xs text-zinc-400">{p.domain?.name||'—'}</td>
                    <td className="table-cell"><Badge status={p.status} label={p.status}/></td>
                    <td className="table-cell text-xs">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '—'}</td>
                    <td className="table-cell text-xs">{p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"><Edit size={13}/></button>
                        <button onClick={() => onDelete(p._id)} className="p-1.5 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
            <p className="text-xs text-zinc-400">Page {pagination.page} of {pagination.pages} · {pagination.total} records</p>
            <div className="flex gap-2">
              <button disabled={page<=1} onClick={() => { setPage(p=>p-1); fetchPayments(page-1) }} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Prev</button>
              <button disabled={page>=pagination.pages} onClick={() => { setPage(p=>p+1); fetchPayments(page+1) }} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Recent payments sidebar strip */}
      {analytics?.recent?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {analytics.recent.map((p, i) => {
              const scfg = STATUS_CFG[p.status] || STATUS_CFG.pending
              return (
                <div key={p._id} className="flex items-center gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: p.status==='paid'?'#d1fae5':p.status==='overdue'?'#fee2e2':'#fef3c7'}}>
                    <scfg.icon size={15} style={{color:scfg.color}}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{p.intern?.user?.name||'—'}</p>
                    <p className="text-xs text-zinc-400">{p.invoiceNumber} · {p.type==='onboarding'?'Onboarding':'Final'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">₹{p.amount?.toLocaleString()}</p>
                    <p className="text-xs text-zinc-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Record/Edit Payment Modal */}
      <Modal isOpen={modal} onClose={() => {setModal(false);reset();setEditTarget(null)}}
        title={editTarget ? 'Edit Payment' : 'Record Payment'}
        subtitle="Onboarding fee (I1025) or Final payment (I4025)" size="lg">
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Student <span className="text-red-500">*</span></label>
              <select {...register('intern',{required:true})} className="input">
                <option value="">Select student</option>
                {interns.map(i => <option key={i._id} value={i._id}>{i.user?.name} — {i.internId}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment Type <span className="text-red-500">*</span></label>
              <select {...register('type',{required:true})} className="input">
                <option value="onboarding">Onboarding Fee (I1025)</option>
                <option value="final">Final Payment (I4025)</option>
              </select>
            </div>
            <div>
              <label className="label">Amount (₹) <span className="text-red-500">*</span></label>
              <input {...register('amount',{required:true})} type="number" min="0" className="input" placeholder="1025"/>
            </div>
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input">
                {['pending','paid','overdue','waived'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select {...register('paymentMethod')} className="input">
                {['upi','cash','bank_transfer','card','other'].map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Domain</label>
              <select {...register('domain')} className="input">
                <option value="">Select domain</option>
                {domains.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Transaction ID</label>
              <input {...register('transactionId')} className="input" placeholder="UPI ref / cheque no."/>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input {...register('dueDate')} type="date" className="input"/>
            </div>
            <div>
              <label className="label">Paid Date</label>
              <input {...register('paidDate')} type="date" className="input"/>
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea {...register('notes')} className="input h-16 resize-none" placeholder="Any additional notes…"/>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => {setModal(false);reset();setEditTarget(null)}} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</> : editTarget ? 'Update' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
