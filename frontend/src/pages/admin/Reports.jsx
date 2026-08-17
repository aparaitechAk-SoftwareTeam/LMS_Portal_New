import { Download, BarChart3, FileText, Users, TrendingUp } from 'lucide-react'
import { PageHeader } from '../../components/common/index'

const reports = [
  {
    title:'Student Performance Report',
    desc:'Performance scores, task completion rates, and attendance percentages for all enrolled students.',
    icon: BarChart3, endpoint:'/reports/interns/excel',
    gradient:'from-violet-500 to-purple-600', tag:'Excel'
  },
  {
    title:'Monthly Attendance Report',
    desc:'Detailed attendance logs including check-in/out times and total work hours per student.',
    icon: Users, endpoint:'/reports/attendance/excel',
    gradient:'from-emerald-500 to-teal-600', tag:'Excel'
  },
  {
    title:'Learning Progress & Certificates',
    desc:'Course enrolment, student progress, paid purchases, and issued learning certificates.',
    icon: FileText, endpoint:'/reports/learning/excel',
    gradient:'from-amber-500 to-orange-600', tag:'Excel'
  },
  {
    title:'Program Overview Report',
    desc:'A comprehensive overview of the entire internship program including all modules.',
    icon: TrendingUp, endpoint:'#',
    gradient:'from-sky-500 to-cyan-600', tag:'Excel'
  },
]

export default function Reports() {
  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader title="Reports & Analytics" subtitle="Download detailed reports in Excel and PDF formats" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reports.map((r, i) => (
          <div key={i} className="card overflow-hidden group">
            <div className={`h-1.5 bg-gradient-to-r ${r.gradient}`} />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <r.icon size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-zinc-900 dark:text-white">{r.title}</h3>
                    <span className="badge-violet text-xs">{r.tag}</span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">{r.desc}</p>
                  <a href={`/api${r.endpoint}`} target="_blank"
                    className="btn-primary text-sm">
                    <Download size={14} />Download Report
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coming soon banner */}
      <div className="card p-6 flex items-center gap-4 border-dashed">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={20} className="text-zinc-400" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">Analytics Dashboard</h3>
          <p className="text-sm text-zinc-400">Interactive charts and real-time analytics coming soon.</p>
        </div>
        <span className="ml-auto badge-slate">Coming Soon</span>
      </div>
    </div>
  )
}
