import { useEffect, useState } from 'react'
import { LifeBuoy, MessageSquare, CheckCircle } from 'lucide-react'
import api from '../../services/api'
import { Badge, Empty, Skeleton } from '../../components/common/index'
import Modal from '../../components/common/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

export default function Tickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    api.get('/tickets').then(r => setTickets(r.data.data)).finally(() => setLoading(false))
  }, [])

  const sendReply = async (data) => {
    try {
      await api.post(`/tickets/${selected._id}/reply`, data)
      toast.success('Reply sent')
      reset()
      const r = await api.get('/tickets')
      setTickets(r.data.data)
      setSelected(tickets.find(t => t._id === selected._id))
    } catch {}
  }

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/tickets/${id}/status`, { status })
      toast.success('Status updated')
      const r = await api.get('/tickets')
      setTickets(r.data.data)
    } catch {}
  }

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold text-slate-800 dark:text-white">Support Tickets</h1><p className="text-sm text-slate-400">{tickets.length} tickets</p></div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-100 dark:border-dark-600">
            <tr>{['Intern','Subject','Category','Priority','Status','Created','Actions'].map(h => <th key={h} className="table-header py-3 px-4 text-left">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-dark-600">
            {loading ? Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton lines={1} /></td></tr>)
              : tickets.length === 0 ? <tr><td colSpan={7}><Empty title="No tickets" icon={LifeBuoy} /></td></tr>
              : tickets.map(t => (
              <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-dark-600/40 transition-colors">
                <td className="table-cell text-sm font-medium">{t.intern?.user?.name}</td>
                <td className="table-cell"><p className="text-sm text-slate-800 dark:text-white truncate max-w-xs">{t.subject}</p></td>
                <td className="table-cell"><span className="badge-slate capitalize">{t.category}</span></td>
                <td className="table-cell"><Badge status={t.priority} label={t.priority} /></td>
                <td className="table-cell"><Badge status={t.status} label={t.status.replace('_', ' ')} /></td>
                <td className="table-cell text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => setSelected(t)} className="text-xs btn-secondary py-1 px-2 flex items-center gap-1"><MessageSquare size={12} />Reply</button>
                    {t.status !== 'resolved' && <button onClick={() => updateStatus(t._id, 'resolved')} className="text-xs text-emerald-600 hover:underline flex items-center gap-1"><CheckCircle size={12} />Resolve</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Ticket: ${selected?.subject}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-dark-800 rounded-lg p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300">{selected.description}</p>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {selected.replies?.map((r, i) => (
                <div key={i} className={`flex ${r.isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-xl px-4 py-2.5 text-sm ${r.isAdmin ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-dark-600 text-slate-800 dark:text-slate-200'}`}>
                    <p className={`text-xs font-medium mb-1 ${r.isAdmin ? 'text-primary-200' : 'text-slate-500'}`}>{r.user?.name}</p>
                    {r.message}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit(sendReply)} className="flex gap-2">
              <input {...register('message', { required: true })} className="input flex-1" placeholder="Type your reply..." />
              <button type="submit" className="btn-primary text-sm px-4">Send</button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  )
}
