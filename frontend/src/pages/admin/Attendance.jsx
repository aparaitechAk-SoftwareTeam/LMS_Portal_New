import { useEffect, useState } from 'react'
import { Clock, Download, Filter, Edit } from 'lucide-react'
import api from '../../services/api'
import { Badge, Empty, Skeleton } from '../../components/common/index'
import Modal from '../../components/common/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

export default function Attendance() {
  const [records, setRecords] = useState([])
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ date: new Date().toISOString().split('T')[0] })
  const [overrideModal, setOverrideModal] = useState(false)
  const { register, handleSubmit } = useForm()

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(filters)
      const [aRes, iRes] = await Promise.all([api.get(`/attendance?${params}`), api.get('/interns?limit=100&status=active')])
      setRecords(aRes.data.data)
      setInterns(iRes.data.data)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchAttendance() }, [filters])

  const onOverride = async (data) => {
    try {
      await api.post('/attendance/override', data)
      toast.success('Attendance updated')
      setOverrideModal(false)
      fetchAttendance()
    } catch {}
  }

  const downloadExcel = () => {
    const params = new URLSearchParams({ month: new Date(filters.date).getMonth() + 1, year: new Date(filters.date).getFullYear() })
    window.open(`/api/reports/attendance/excel?${params}`, '_blank')
  }

  const statusColors = { present: 'badge-green', late: 'badge-yellow', absent: 'badge-red', half_day: 'badge-yellow', leave: 'badge-slate' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Attendance</h1>
          <p className="text-sm text-slate-400">{records.length} records for selected date</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadExcel} className="btn-secondary flex items-center gap-2 text-sm"><Download size={14} />Export</button>
          <button onClick={() => setOverrideModal(true)} className="btn-primary flex items-center gap-2 text-sm"><Edit size={14} />Manual Override</button>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <input type="date" className="input w-44" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Present', count: records.filter(r => r.status === 'present').length, color: 'text-emerald-600' },
          { label: 'Late', count: records.filter(r => r.status === 'late').length, color: 'text-amber-600' },
          { label: 'Absent', count: records.filter(r => r.status === 'absent').length, color: 'text-red-600' },
          { label: 'Total', count: records.length, color: 'text-primary-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-dark-800 border-b border-slate-100 dark:border-dark-600">
            <tr>{['Intern', 'Status', 'Login Time', 'Logout Time', 'Work Hours', 'Override'].map(h => <th key={h} className="table-header py-3 px-4 text-left">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-dark-600">
            {loading ? Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton lines={1} /></td></tr>)
              : records.length === 0 ? <tr><td colSpan={6}><Empty title="No attendance records" icon={Clock} /></td></tr>
              : records.map(r => (
              <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-dark-600/40 transition-colors">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-xs font-bold text-primary-600">
                      {r.intern?.user?.name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{r.intern?.user?.name}</p>
                      <p className="text-xs text-slate-400">{r.intern?.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell"><span className={`badge ${statusColors[r.status] || 'badge-slate'}`}>{r.status}</span></td>
                <td className="table-cell text-sm">{r.loginTime ? new Date(r.loginTime).toLocaleTimeString() : '—'}</td>
                <td className="table-cell text-sm">{r.logoutTime ? new Date(r.logoutTime).toLocaleTimeString() : '—'}</td>
                <td className="table-cell text-sm">{r.workHours ? `${r.workHours}h` : '—'}</td>
                <td className="table-cell">
                  {r.isManualOverride && <span className="badge-yellow text-xs">Overridden</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={overrideModal} onClose={() => setOverrideModal(false)} title="Manual Attendance Override">
        <form onSubmit={handleSubmit(onOverride)} className="space-y-4">
          <div><label className="label">Intern</label>
            <select {...register('internId', { required: true })} className="input">
              <option value="">Select intern</option>
              {interns.map(i => <option key={i._id} value={i._id}>{i.user?.name}</option>)}
            </select>
          </div>
          <div><label className="label">Date</label><input {...register('date', { required: true })} type="date" className="input" defaultValue={filters.date} /></div>
          <div><label className="label">Status</label>
            <select {...register('status', { required: true })} className="input">
              {['present','absent','late','half_day','leave'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Login Time</label><input {...register('loginTime')} type="time" className="input" /></div>
            <div><label className="label">Logout Time</label><input {...register('logoutTime')} type="time" className="input" /></div>
          </div>
          <div><label className="label">Notes</label><input {...register('notes')} className="input" placeholder="Reason for override" /></div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setOverrideModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Override</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
