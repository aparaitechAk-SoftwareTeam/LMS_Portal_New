import { useEffect, useState } from 'react'
import { Plus, MessageSquare, LifeBuoy, Clock, CheckCircle } from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import { Badge, Empty, PageHeader } from '../../components/common/index'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'

const CATEGORY_ICONS = {
  technical: '⚙️', task: '📋', attendance: '🕐', general: '💬', other: '❓'
}
const STATUS_STEP = { open:1, in_progress:2, resolved:3, closed:4 }

export default function MyTickets() {
  const [tickets, setTickets]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [selected, setSelected]     = useState(null)
  const { user } = useSelector(s => s.auth)
  const { register, handleSubmit, reset } = useForm()
  const { register:regR, handleSubmit:handleR, reset:resetR } = useForm()

  const fetchTickets = () => {
    api.get('/tickets').then(r => { setTickets(r.data.data) }).finally(() => setLoading(false))
  }
  useEffect(() => { fetchTickets() }, [])

  const onCreate = async (data) => {
    try {
      await api.post('/tickets', data)
      toast.success('Support ticket raised!')
      setCreateModal(false); reset(); fetchTickets()
    } catch {}
  }

  const onReply = async (data) => {
    try {
      await api.post(`/tickets/${selected._id}/reply`, data)
      toast.success('Reply sent')
      resetR()
      fetchTickets()
      setSelected(prev => ({
        ...prev,
        replies: [...(prev.replies||[]), { message: data.message, isAdmin:false, createdAt: new Date(), user:{ name:'You' } }]
      }))
    } catch {}
  }

  const openCount     = tickets.filter(t => t.status==='open').length
  const resolvedCount = tickets.filter(t => t.status==='resolved').length

  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader
        title="Support Center"
        subtitle="Get help from our admin team"
        actions={
          <button onClick={() => setCreateModal(true)} className="btn-primary text-sm">
            <Plus size={15} />Raise Ticket
          </button>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Total Tickets',   value: tickets.length, color:'text-violet-600' },
          { label:'Open',            value: openCount,       color:'text-amber-600' },
          { label:'Resolved',        value: resolvedCount,   color:'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-zinc-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Ticket list */}
      {!loading && tickets.length===0 ? (
        <Empty
          title="No support tickets"
          description="Have a question or issue? Raise a ticket and our team will respond promptly."
          icon={LifeBuoy}
          action={
            <button onClick={() => setCreateModal(true)} className="btn-primary text-sm">
              <Plus size={14} />Raise Your First Ticket
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((t, i) => (
            <motion.div key={t._id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.04 }}
              onClick={() => setSelected(t)}
              className="card-hover p-5 cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="text-2xl flex-shrink-0">{CATEGORY_ICONS[t.category]||'💬'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-white truncate">{t.subject}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{t.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge status={t.priority} label={t.priority} />
                      <Badge status={t.status}   label={t.status.replace('_',' ')} />
                    </div>
                  </div>

                  {/* Progress steps */}
                  <div className="flex items-center gap-1.5 mt-3">
                    {['open','in_progress','resolved','closed'].map((step, si) => {
                      const active = STATUS_STEP[t.status] >= si+1
                      return (
                        <div key={step} className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full transition-colors ${active ? 'bg-violet-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                          {si < 3 && <div className={`w-6 h-0.5 rounded-full ${active ? 'bg-violet-200 dark:bg-violet-900' : 'bg-zinc-200 dark:bg-zinc-800'}`} />}
                        </div>
                      )
                    })}
                    <span className="text-xs text-zinc-400 ml-1 capitalize">{t.status.replace('_',' ')}</span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Clock size={11} />
                      {new Date(t.createdAt).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <MessageSquare size={11} />
                      {t.replies?.length||0} {t.replies?.length===1 ? 'reply' : 'replies'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      <Modal isOpen={createModal} onClose={() => { setCreateModal(false); reset() }}
        title="Raise Support Ticket" subtitle="Our admin team will respond within 24 hours">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div>
            <label className="label">Subject <span className="text-red-500">*</span></label>
            <input {...register('subject',{ required:true })} className="input" placeholder="Brief description of your issue" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select {...register('category')} className="input">
                {['technical','task','attendance','general','other'].map(c => (
                  <option key={c} value={c} className="capitalize">{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select {...register('priority')} className="input">
                {['low','medium','high'].map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description <span className="text-red-500">*</span></label>
            <textarea {...register('description',{ required:true })} className="input h-28 resize-none"
              placeholder="Please describe your issue in detail. Include any steps to reproduce if it's a technical problem." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setCreateModal(false); reset() }} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Submit Ticket</button>
          </div>
        </form>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)}
        title={selected?.subject} subtitle={`Ticket · ${selected?.category} · ${selected?.status?.replace('_',' ')}`} size="lg">
        {selected && (
          <div className="space-y-4">
            {/* Description */}
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
              <div className="flex gap-2 mb-3">
                <Badge status={selected.status} label={selected.status.replace('_',' ')} />
                <Badge status={selected.priority} label={selected.priority} />
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{selected.description}</p>
              <p className="text-xs text-zinc-400 mt-3">Opened on {new Date(selected.createdAt).toLocaleString()}</p>
            </div>

            {/* Replies */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {selected.replies?.length > 0 ? selected.replies.map((r, i) => (
                <div key={i} className={`flex ${r.isAdmin ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-sm rounded-2xl px-4 py-3 text-sm
                    ${r.isAdmin
                      ? 'bg-zinc-100 dark:bg-zinc-800 rounded-tl-none'
                      : 'bg-violet-600 text-white rounded-tr-none'}`}>
                    <p className={`text-xs font-semibold mb-1 ${r.isAdmin ? 'text-zinc-500' : 'text-violet-200'}`}>
                      {r.isAdmin ? 'Support Team' : 'You'}
                    </p>
                    <p className={r.isAdmin ? 'text-zinc-700 dark:text-zinc-300' : 'text-white'}>{r.message}</p>
                    <p className={`text-xs mt-1 ${r.isAdmin ? 'text-zinc-400' : 'text-violet-200'}`}>
                      {new Date(r.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-zinc-400 text-sm">No replies yet — we'll get back to you soon!</div>
              )}
            </div>

            {/* Reply input */}
            {!['closed','resolved'].includes(selected.status) && (
              <form onSubmit={handleR(onReply)} className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <input {...regR('message',{ required:true })} className="input flex-1 text-sm" placeholder="Type your reply…" />
                <button type="submit" className="btn-primary text-sm px-4">Send</button>
              </form>
            )}
            {['closed','resolved'].includes(selected.status) && (
              <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl">
                <CheckCircle size={16} className="text-emerald-500" />
                <span className="text-sm text-emerald-600 font-medium">This ticket has been {selected.status}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
