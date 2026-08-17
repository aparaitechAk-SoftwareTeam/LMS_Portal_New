import { useEffect, useState } from 'react'
import { CheckSquare, Clock, Award, TrendingUp, Calendar, AlertCircle, Play, BookOpen } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { StatCard, Badge, Skeleton, Empty } from '../../components/common/index'
import api from '../../services/api'
import { motion } from 'framer-motion'
import { COMPANY_NAME } from '../../utils/constants'

export default function StudentDashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/intern').then(r => setData(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_,i) => <div key={i} className="card h-24" />)}
      </div>
    </div>
  )

  const { intern, taskStats, todayAttendance, attendancePercent, upcomingDeadlines, internshipProgress } = data||{}

  const radialData = [{ name:'Progress', value: internshipProgress||0, fill:'#7c3aed' }]

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* Hero welcome */}
      <div className="rounded-2xl overflow-hidden relative p-6 sm:p-8"
           style={{ background:'linear-gradient(135deg,#2e1065 0%,#4c1d95 40%,#7c3aed 100%)' }}>
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage:'linear-gradient(rgba(255,255,255,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px)', backgroundSize:'32px 32px' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-violet-300 text-sm font-medium mb-1">{COMPANY_NAME} Internship Program</p>
            <h1 className="text-white font-bold text-2xl sm:text-3xl mb-1">
              Welcome back, {intern?.user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-violet-300 text-sm">{intern?.department} · {intern?.internId}</p>
          </div>

          {/* Circular progress */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-center">
              <div className="relative w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="65%" outerRadius="95%" data={radialData} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" cornerRadius={8} background={{ fill:'rgba(255,255,255,0.1)' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{internshipProgress||0}%</span>
                </div>
              </div>
              <p className="text-violet-300 text-xs mt-1">Program Progress</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${todayAttendance?.loginTime && !todayAttendance?.logoutTime ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                <span className="text-violet-200 text-xs">{todayAttendance?.loginTime && !todayAttendance?.logoutTime ? 'Online now' : todayAttendance?.loginTime ? 'Checked out' : 'Not checked in'}</span>
              </div>
              <div className="text-violet-200 text-xs">Attendance: <span className="text-white font-semibold">{attendancePercent||0}%</span></div>
              <div className="text-violet-200 text-xs">Score: <span className="text-white font-semibold">{intern?.performanceScore||0}/100</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Tasks',     value:taskStats?.myTasks||0,       icon:CheckSquare, color:'violet' },
          { label:'Pending',         value:taskStats?.pendingTasks||0,   icon:AlertCircle, color:'amber'  },
          { label:'Approved',        value:taskStats?.approvedTasks||0,  icon:Award,       color:'green'  },
          { label:'Attendance',      value:`${attendancePercent||0}%`,   icon:Clock,       color:'sky'    },
        ].map((s,i) => (
          <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white">Upcoming Deadlines</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Tasks due in the next 7 days</p>
            </div>
            <Calendar size={18} className="text-zinc-400" />
          </div>
          <div className="space-y-3">
            {upcomingDeadlines?.length > 0 ? upcomingDeadlines.map(task => {
              const daysLeft = Math.ceil((new Date(task.dueDate) - new Date()) / (1000*60*60*24))
              const urgency = daysLeft <= 1 ? 'text-red-500 bg-red-50 dark:bg-red-950/30' : daysLeft <= 3 ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
              return (
                <div key={task._id} className="flex items-center gap-4 p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{task.title}</p>
                    <p className="text-xs text-zinc-400">{new Date(task.dueDate).toLocaleDateString('en-US',{ month:'short', day:'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge status={task.priority} label={task.priority} />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urgency}`}>{daysLeft}d</span>
                  </div>
                </div>
              )
            }) : <Empty title="No upcoming deadlines" description="You're all caught up!" icon={CheckSquare} />}
          </div>
        </div>

        {/* Quick Stats sidebar */}
        <div className="space-y-4">
          {/* Internship timeline */}
          <div className="card p-5">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-4 text-sm">Internship Timeline</h3>
            <div className="space-y-3 text-xs">
              {[
                { label:'Start', value: intern?.internshipStart ? new Date(intern.internshipStart).toLocaleDateString() : '—', color:'text-emerald-600' },
                { label:'End',   value: intern?.internshipEnd   ? new Date(intern.internshipEnd).toLocaleDateString()   : '—', color:'text-red-500'    },
                { label:'Duration', value: intern?.internshipDuration || '—', color:'text-violet-600' },
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-zinc-400">{item.label}</span>
                  <span className={`font-semibold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-400">Progress</span>
                <span className="font-bold text-violet-600">{internshipProgress||0}%</span>
              </div>
              <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <motion.div initial={{ width:0 }} animate={{ width:`${internshipProgress||0}%` }} transition={{ duration:1, delay:.4 }}
                  className="h-full bg-violet-500 rounded-full" />
              </div>
            </div>
          </div>

          {/* Today's status */}
          <div className="card p-5">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-4 text-sm">Today's Attendance</h3>
            <div className="space-y-2.5 text-xs">
              {[
                { label:'Status',    value: <Badge status={todayAttendance?.status||'absent'} label={todayAttendance?.status||'absent'} /> },
                { label:'Check In',  value: todayAttendance?.loginTime  ? new Date(todayAttendance.loginTime).toLocaleTimeString()  : '—' },
                { label:'Check Out', value: todayAttendance?.logoutTime ? new Date(todayAttendance.logoutTime).toLocaleTimeString() : '—' },
                { label:'Hours',     value: todayAttendance?.workHours  ? `${todayAttendance.workHours}h`                         : '—' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-zinc-400">{item.label}</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          {intern?.projects?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-zinc-900 dark:text-white mb-4 text-sm">My Projects</h3>
              <div className="space-y-3">
                {intern.projects.slice(0,3).map(p => (
                  <div key={p._id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">{p.title}</span>
                      <Badge status={p.status} label={p.status} />
                    </div>
                    <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width:`${p.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
