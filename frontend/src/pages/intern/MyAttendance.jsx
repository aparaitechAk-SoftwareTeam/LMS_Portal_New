import { useEffect, useState } from 'react'
import { LogIn, LogOut, Clock, CalendarCheck, TrendingUp } from 'lucide-react'
import api from '../../services/api'
import { Badge, Skeleton, PageHeader } from '../../components/common/index'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function MyAttendance() {
  const [attendance, setAttendance] = useState([])
  const [stats, setStats]           = useState({})
  const [loading, setLoading]       = useState(true)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [today, setToday]           = useState(null)
  const [filters, setFilters]       = useState({ month: new Date().getMonth()+1, year: new Date().getFullYear() })

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/attendance/my?month=${filters.month}&year=${filters.year}`)
      setAttendance(data.data)
      setStats(data.stats)
      const todayStr = new Date().toISOString().split('T')[0]
      setToday(data.data.find(r => r.date?.startsWith(todayStr)))
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchAttendance() }, [filters])

  const handleCheckIn = async () => {
    setCheckinLoading(true)
    try { await api.post('/attendance/check-in'); toast.success('Checked in!'); fetchAttendance() }
    catch {} finally { setCheckinLoading(false) }
  }
  const handleCheckOut = async () => {
    setCheckinLoading(true)
    try { await api.post('/attendance/check-out'); toast.success('Checked out!'); fetchAttendance() }
    catch {} finally { setCheckinLoading(false) }
  }

  const statusColor = { present:'bg-emerald-500', late:'bg-amber-500', absent:'bg-red-400', half_day:'bg-amber-400', leave:'bg-zinc-400' }

  return (
    <div className="space-y-6 max-w-screen-xl">
      <PageHeader title="Attendance" subtitle="Track your daily attendance and work hours" />

      {/* Check-in card */}
      <div className="rounded-2xl overflow-hidden relative p-6"
           style={{ background:'linear-gradient(135deg,#2e1065 0%,#4c1d95 40%,#7c3aed 100%)' }}>
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage:'linear-gradient(rgba(255,255,255,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px)', backgroundSize:'32px 32px' }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <p className="text-violet-300 text-sm mb-1">{new Date().toDateString()}</p>
            <h2 className="text-white font-bold text-xl">
              {today?.loginTime && !today?.logoutTime
                ? 'You are currently online'
                : today?.loginTime
                  ? 'Session ended for today'
                  : 'Start your day'}
            </h2>
            {today?.loginTime && (
              <p className="text-violet-200 text-sm mt-1">
                Checked in at {new Date(today.loginTime).toLocaleTimeString()}
                {today?.logoutTime && ` · Checked out at ${new Date(today.logoutTime).toLocaleTimeString()}`}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button disabled={checkinLoading || !!today?.loginTime} onClick={handleCheckIn}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm">
              <LogIn size={16} />Check In
            </button>
            <button disabled={checkinLoading || !today?.loginTime || !!today?.logoutTime} onClick={handleCheckOut}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm border border-white/30">
              <LogOut size={16} />Check Out
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'Working Days', value: stats.totalDays||0,    icon: CalendarCheck, color:'violet' },
          { label:'Days Present', value: stats.presentDays||0,  icon: TrendingUp,    color:'green'  },
          { label:'Attendance %', value: `${stats.percentage||0}%`, icon: TrendingUp, color:'violet'},
          { label:'Total Hours',  value: `${stats.totalHours||0}h`, icon: Clock,      color:'amber'  },
        ].map((s,i) => (
          <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}>
            <div className="card p-5 text-center">
              <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center
                ${i===0?'bg-violet-100 dark:bg-violet-900/30 text-violet-600':i===1?'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600':i===2?'bg-violet-100 dark:bg-violet-900/30 text-violet-600':'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                <s.icon size={18} />
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-zinc-400 mt-1">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Month filter */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <select className="input w-40" value={filters.month} onChange={e => setFilters(f => ({ ...f, month: +e.target.value }))}>
          {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select className="input w-28" value={filters.year} onChange={e => setFilters(f => ({ ...f, year: +e.target.value }))}>
          {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex gap-2 ml-auto">
          {['present','late','absent'].map(s => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-zinc-500">
              <div className={`w-2.5 h-2.5 rounded-full ${statusColor[s]}`} />
              <span className="capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance calendar-style list */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                {['Date','Day','Status','Check In','Check Out','Work Hours','Notes'].map(h => (
                  <th key={h} className="table-header py-3 px-4 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array(7).fill(0).map((_,i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td colSpan={7} className="px-4 py-3"><Skeleton lines={1} /></td>
                </tr>
              )) : attendance.length===0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-zinc-400 text-sm">No attendance records for this period</td></tr>
              ) : attendance.map(r => {
                const d = new Date(r.date)
                return (
                  <tr key={r._id} className="table-row">
                    <td className="table-cell font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                      {d.toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' })}
                    </td>
                    <td className="table-cell text-zinc-400">{d.toLocaleDateString('en-US',{ weekday:'short' })}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor[r.status]||'bg-zinc-400'}`} />
                        <Badge status={r.status} label={r.status.replace('_',' ')} />
                      </div>
                    </td>
                    <td className="table-cell text-sm">{r.loginTime  ? new Date(r.loginTime).toLocaleTimeString()  : <span className="text-zinc-300 dark:text-zinc-600">—</span>}</td>
                    <td className="table-cell text-sm">{r.logoutTime ? new Date(r.logoutTime).toLocaleTimeString() : <span className="text-zinc-300 dark:text-zinc-600">—</span>}</td>
                    <td className="table-cell">
                      {r.workHours ? (
                        <span className="font-semibold text-violet-600 dark:text-violet-400">{r.workHours}h</span>
                      ) : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                    </td>
                    <td className="table-cell text-xs text-zinc-400">{r.notes||'—'}{r.isManualOverride && <span className="ml-1 badge-yellow">Override</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
