import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { getMe } from './redux/slices/authSlice'
import { setTheme } from './redux/slices/uiSlice'
import { initSocket, disconnectSocket } from './socket/socket'
import { addNotification, setNotifications } from './redux/slices/notificationSlice'
import api from './services/api'

import AdminLayout from './layouts/AdminLayout'
import InternLayout from './layouts/InternLayout'

import Login          from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword  from './pages/auth/ResetPassword'

import AdminDashboard from './pages/admin/Dashboard'
import Interns        from './pages/admin/Interns'
import InternDetail   from './pages/admin/InternDetail'
import Projects       from './pages/admin/Projects'
import Tasks          from './pages/admin/Tasks'
import Attendance     from './pages/admin/Attendance'
import Teams          from './pages/admin/Teams'
import TeamDetail     from './pages/admin/TeamDetail'
import Reports        from './pages/admin/Reports'
import Tickets        from './pages/admin/Tickets'
import Certificates   from './pages/admin/Certificates'
import AdminSettings  from './pages/admin/Settings'
import Domains        from './pages/admin/Domains'
import Revenue        from './pages/admin/Revenue'
import ProjectFees    from './pages/admin/ProjectFees'
import LearningCourses from './pages/admin/LearningCourses'
import LearningEditor  from './pages/admin/LearningEditor'
import AdminAssessments from './pages/admin/Assessments'
import AdminProjectReviews from './pages/admin/ProjectReviews'
import AdminJobApplications from './pages/admin/JobApplications'
import AdminInquiries from './pages/admin/Inquiries'
import AdminCourseSales from './pages/admin/CourseSales'

import InternDashboard  from './pages/intern/Dashboard'
import MyTasks          from './pages/intern/MyTasks'
import MyProjects       from './pages/intern/MyProjects'
import MyTeam           from './pages/intern/MyTeam'
import MyAttendance     from './pages/intern/MyAttendance'
import MyProfile        from './pages/intern/MyProfile'
import MyCertificates   from './pages/intern/MyCertificates'
import MyTickets        from './pages/intern/MyTickets'
import MyPayments       from './pages/intern/MyPayments'
import MyLearning       from './pages/intern/MyLearning'
import MyTodos          from './pages/intern/MyTodos'
import LearningPlayer   from './pages/intern/LearningPlayer'
import InternAssessments from './pages/intern/Assessments'
import InternProjectReviews from './pages/intern/ProjectReviews'
import InternJobApplications from './pages/intern/JobApplications'
import TeamCalendar      from './pages/intern/TeamCalendar'
import Landing           from './pages/public/Landing'
import CourseCatalog     from './pages/public/CourseCatalog'
import CourseDetail      from './pages/public/CourseDetail'
import Contact           from './pages/public/Contact'

import Loader from './components/common/Loader'
import toast  from 'react-hot-toast'

const ProtectedRoute = ({ children, role }) => {
  const { user, token } = useSelector(s => s.auth)
  if (!token) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to={user?.role === 'admin' ? '/admin' : '/intern'} replace />
  return children
}

export default function App() {
  const dispatch = useDispatch()
  const { token, user, initialized } = useSelector(s => s.auth)
  const { theme } = useSelector(s => s.ui)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    dispatch(setTheme(savedTheme))
    if (token) dispatch(getMe())
    else dispatch({ type: 'auth/getMe/rejected' })
  }, [])

  useEffect(() => {
    if (!token || !user) return
    const socket = initSocket(token)
    socket.on('notification', (notif) => {
      dispatch(addNotification(notif))
      toast(notif.title, { icon: null, style: { background:'#1e293b', color:'#f1f5f9', border:'1px solid #7c3aed' } })
    })
    api.get('/notifications').then(({ data }) => dispatch(setNotifications(data))).catch(() => {})
    return () => disconnectSocket()
  }, [user?._id])

  if (!initialized) return (
    <div className="flex h-screen items-center justify-center bg-zinc-950">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto"/>
        <p className="text-zinc-500 text-sm">Loading…</p>
      </div>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"                  element={<Login />} />
        <Route path="/forgot-password"        element={<ForgotPassword />} />
        <Route path="/reset-password/:token"  element={<ResetPassword />} />

        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index             element={<AdminDashboard />} />
          <Route path="interns"    element={<Interns />} />
          <Route path="interns/:id" element={<InternDetail />} />
          <Route path="projects"   element={<Projects />} />
          <Route path="tasks"      element={<Tasks />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="teams"      element={<Teams />} />
          <Route path="teams/:id"  element={<TeamDetail />} />
          <Route path="reports"    element={<Reports />} />
          <Route path="tickets"    element={<Tickets />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="settings"   element={<AdminSettings />} />
          <Route path="domains"    element={<Domains />} />
          <Route path="revenue"    element={<Revenue />} />
          <Route path="project-fees" element={<ProjectFees />} />
          <Route path="learning"   element={<LearningCourses />} />
          <Route path="learning/:id" element={<LearningEditor />} />
          <Route path="assessments" element={<AdminAssessments />} />
          <Route path="project-reviews" element={<AdminProjectReviews />} />
          <Route path="job-applications" element={<AdminJobApplications />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="course-sales" element={<AdminCourseSales />} />
        </Route>

        <Route path="/intern" element={<ProtectedRoute role="intern"><InternLayout /></ProtectedRoute>}>
          <Route index               element={<InternDashboard />} />
          <Route path="dashboard"   element={<Navigate to="/intern" replace />} />
          <Route path="tasks"        element={<MyTasks />} />
          <Route path="projects"     element={<MyProjects />} />
          <Route path="team"         element={<MyTeam />} />
          <Route path="attendance"   element={<MyAttendance />} />
          <Route path="profile"      element={<MyProfile />} />
          <Route path="certificates" element={<MyCertificates />} />
          <Route path="tickets"      element={<MyTickets />} />
          <Route path="payments"     element={<MyPayments />} />
          <Route path="learning"     element={<MyLearning />} />
          <Route path="learning/:id"  element={<LearningPlayer />} />
          <Route path="assessments" element={<InternAssessments />} />
          <Route path="project-reviews" element={<InternProjectReviews />} />
          <Route path="job-applications" element={<InternJobApplications />} />
          <Route path="calendar"      element={<TeamCalendar />} />
          <Route path="todos"        element={<MyTodos />} />
        </Route>

        <Route path="/" element={<Landing />} />
        <Route path="/courses" element={<CourseCatalog />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
