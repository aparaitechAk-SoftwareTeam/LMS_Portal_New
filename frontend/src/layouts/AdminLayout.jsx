import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Sidebar from '../components/layout/Sidebar'
import Header  from '../components/layout/Header'
import { motion } from 'framer-motion'

const adminNav = [
  { label:'Dashboard',    path:'/admin',               icon:'LayoutDashboard', exact:true },
  { label:'Students',     path:'/admin/interns',       icon:'GraduationCap' },
  { label:'Domains',      path:'/admin/domains',       icon:'Layers' },
  { label:'Live Projects', path:'/admin/learning',     icon:'FolderKanban' },
  { label:'Internship Sales', path:'/admin/course-sales', icon:'ShoppingCart' },
  { label:'Assessments',  path:'/admin/assessments',   icon:'BrainCircuit' },
  { label:'Projects',     path:'/admin/projects',      icon:'FolderKanban' },
  { label:'Reviews',      path:'/admin/project-reviews', icon:'ClipboardCheck' },
  { label:'Job Applications', path:'/admin/job-applications', icon:'Briefcase' },
  { label:'Tasks',        path:'/admin/tasks',         icon:'CheckSquare' },
  { label:'Attendance',   path:'/admin/attendance',    icon:'CalendarCheck' },
  { label:'Teams',        path:'/admin/teams',         icon:'MessagesSquare' },
  { label:'Revenue',      path:'/admin/revenue',       icon:'IndianRupee' },
  { label:'Project Fees',  path:'/admin/project-fees',  icon:'CreditCard' },
  { label:'Reports',      path:'/admin/reports',       icon:'BarChart3' },
  { label:'Certificates', path:'/admin/certificates',  icon:'Award' },
  { label:'Support',      path:'/admin/tickets',       icon:'LifeBuoy' },
  { label:'Public Inquiries', path:'/admin/inquiries', icon:'Mail' },
  { label:'Settings',     path:'/admin/settings',      icon:'Settings' },
]

export default function AdminLayout() {
  const { sidebarOpen } = useSelector(s => s.ui)
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar nav={adminNav} role="admin" />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950">
          <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:.2 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
