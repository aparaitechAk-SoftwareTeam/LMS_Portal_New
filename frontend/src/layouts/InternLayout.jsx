import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Header  from '../components/layout/Header'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'

const internNav = [
  { label:'Dashboard',    path:'/intern',              icon:'LayoutDashboard', exact:true },
  { label:'My Tasks',     path:'/intern/tasks',        icon:'CheckSquare' },
  { label:'My Learning',  path:'/intern/learning',     icon:'BookOpen' },
  { label:'My To-dos',    path:'/intern/todos',        icon:'ListTodo' },
  { label:'Assessments',  path:'/intern/assessments',  icon:'BrainCircuit' },
  { label:'Projects',     path:'/intern/projects',     icon:'FolderKanban' },
  { label:'Project Review', path:'/intern/project-reviews', icon:'ClipboardCheck' },
  { label:'Job & HR',      path:'/intern/job-applications', icon:'Briefcase' },
  { label:'Team',         path:'/intern/team',         icon:'MessagesSquare' },
  { label:'Team Calendar', path:'/intern/calendar',    icon:'CalendarDays' },
  { label:'Attendance',   path:'/intern/attendance',   icon:'CalendarCheck' },
  { label:'Certificates', path:'/intern/certificates', icon:'Award' },
  { label:'Payments',     path:'/intern/payments',     icon:'CreditCard' },
  { label:'Support',      path:'/intern/tickets',      icon:'LifeBuoy' },
  { label:'My Profile',   path:'/intern/profile',      icon:'User' },
]

export default function InternLayout() {
  const { sidebarOpen } = useSelector(s => s.ui)
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar nav={internNav} role="intern" />
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
