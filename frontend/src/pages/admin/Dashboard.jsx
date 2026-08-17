import { useEffect, useState } from 'react'
import { GraduationCap, FolderKanban, CheckSquare, CalendarCheck, Award, UserCheck, UserX, TrendingUp } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { StatCard, Skeleton, Badge, PageHeader } from '../../components/common/index'
import api from '../../services/api'
import { motion } from 'framer-motion'
import { COMPANY_NAME } from '../../utils/constants'

const COLORS = ['#7c3aed','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-zinc-700 dark:text-zinc-200 mb-1">{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/admin').then(r => setData(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_,i) => <div key={i} className="card p-5 h-28" />)}
      </div>
    </div>
  )

  const { stats, weeklySubmissions, deptDistribution, topPerformers, recentActivities, taskStats } = data || {}

  const weeklyData = DAYS.map((day,i) => {
    const f = weeklySubmissions?.find(s => s._id === i+1)
    return { day, Submitted: f?.count||0, Approved: f?.approved||0 }
  })
  const pieData   = deptDistribution?.map(d => ({ name: d._id, value: d.count })) || []
  const taskData  = [
    { name:'Pending',     value: taskStats?.pending||0 },
    { name:'In Progress', value: taskStats?.in_progress||0 },
    { name:'Submitted',   value: taskStats?.submitted||0 },
    { name:'Approved',    value: taskStats?.approved||0 },
    { name:'Rejected',    value: taskStats?.rejected||0 },
  ]

  return (
    <div className="space-y-6 max-w-screen-xl">
      <PageHeader
        title={`Welcome back, ${COMPANY_NAME}`}
        subtitle={`Here's what's happening with your internship program today.`}
      />

      {/* Hero banner */}
      <div className="rounded-2xl overflow-hidden relative p-6 sm:p-8"
           style={{ background:'linear-gradient(135deg,#2e1065 0%,#4c1d95 40%,#7c3aed 100%)' }}>
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage:'linear-gradient(rgba(255,255,255,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px)', backgroundSize:'32px 32px' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-violet-300 text-sm font-medium mb-1">Program Overview</p>
            <h2 className="text-white font-bold text-2xl sm:text-3xl">
              {stats?.activeInterns || 0} Active Students
            </h2>
            <p className="text-violet-300 text-sm mt-1">across {stats?.ongoingProjects||0} ongoing projects</p>
          </div>
          <div className="flex gap-6">
            {[
              { label:'Completion Rate', value:`${stats?.completedInterns && stats?.totalInterns ? Math.round(stats.completedInterns/stats.totalInterns*100) : 0}%` },
              { label:'Today Present',   value: stats?.todayAttendance||0 },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-white font-bold text-2xl">{s.value}</p>
                <p className="text-violet-300 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Students',  value:stats?.totalInterns,     icon:GraduationCap, color:'violet' },
          { label:'Active Students', value:stats?.activeInterns,    icon:UserCheck,     color:'green'  },
          { label:'Completed',       value:stats?.completedInterns, icon:Award,         color:'violet' },
          { label:'Today Present',   value:stats?.todayAttendance,  icon:CalendarCheck, color:'amber'  },
        ].map((s,i) => (
          <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label:'Total Projects',   value:stats?.totalProjects,    icon:FolderKanban, color:'violet' },
          { label:'Ongoing Projects', value:stats?.ongoingProjects,  icon:TrendingUp,   color:'sky'    },
          { label:'Terminated',       value:stats?.terminatedInterns,icon:UserX,        color:'red'    },
        ].map((s,i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Weekly Submissions</h3>
          <p className="text-xs text-zinc-400 mb-4">Task submissions & approvals this week</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="gSubmit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={.2}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gApprove" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={.5} />
              <XAxis dataKey="day" tick={{ fontSize:11, fill:'#71717a' }} />
              <YAxis tick={{ fontSize:11, fill:'#71717a' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:12 }} />
              <Area type="monotone" dataKey="Submitted" stroke="#7c3aed" strokeWidth={2} fill="url(#gSubmit)" />
              <Area type="monotone" dataKey="Approved"  stroke="#10b981" strokeWidth={2} fill="url(#gApprove)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Department Distribution</h3>
          <p className="text-xs text-zinc-400 mb-4">Students across departments</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={4}>
                  {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize:12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-40 flex items-center justify-center text-zinc-400 text-sm">No department data yet</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status */}
        <div className="card p-5">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Task Status Overview</h3>
          <p className="text-xs text-zinc-400 mb-4">Current task pipeline</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={taskData} layout="vertical" barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={.5} horizontal={false}/>
              <XAxis type="number" tick={{ fontSize:11, fill:'#71717a' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'#71717a' }} width={85} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0,6,6,0]}>
                {taskData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers */}
        <div className="card p-5">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Top Performers</h3>
          <p className="text-xs text-zinc-400 mb-4">Ranked by performance score</p>
          <div className="space-y-3.5">
            {topPerformers?.length > 0 ? topPerformers.map((intern,i) => (
              <div key={intern._id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${i===0 ? 'bg-amber-400 text-white' : i===1 ? 'bg-zinc-300 text-zinc-700' : i===2 ? 'bg-orange-400 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                  {i+1}
                </div>
                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-700 dark:text-violet-300 text-xs font-bold flex-shrink-0">
                  {intern.user?.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{intern.user?.name}</p>
                  <p className="text-xs text-zinc-400">{intern.department}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width:`${intern.performanceScore}%` }} />
                  </div>
                  <span className="text-xs font-bold text-zinc-500 w-6 text-right">{intern.performanceScore}</span>
                </div>
              </div>
            )) : <p className="text-zinc-400 text-sm">No performance data yet</p>}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-5">
        <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivities?.length > 0 ? recentActivities.slice(0,6).map((act,i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                <span className="text-violet-600 text-xs font-bold">{act.user?.name?.[0]||'S'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-700 dark:text-zinc-300">
                  <span className="font-semibold text-zinc-900 dark:text-white">{act.user?.name||'System'}</span>
                  {' — '}{act.action} in <span className="text-violet-600">{act.module}</span>
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">{new Date(act.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )) : <p className="text-zinc-400 text-sm">No recent activity</p>}
        </div>
      </div>
    </div>
  )
}
