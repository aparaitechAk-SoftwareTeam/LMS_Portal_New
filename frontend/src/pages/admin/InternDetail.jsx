import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Github, Linkedin, Mail, Phone, GraduationCap, Calendar, Award } from 'lucide-react'
import api from '../../services/api'
import { Badge, Skeleton } from '../../components/common/index'
import { COMPANY_NAME } from '../../utils/constants'

export default function StudentDetail() {
  const { id } = useParams()
  const [intern, setIntern] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/interns/${id}`).then(r => setIntern(r.data.data)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="space-y-4 max-w-4xl"><Skeleton lines={8} /></div>
  if (!intern) return <div className="text-center py-20 text-zinc-400">Student not found</div>

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/admin/interns" className="btn-secondary p-2.5"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Student Profile</h1>
          <p className="text-sm text-zinc-400">{intern.internId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile sidebar */}
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="h-20" style={{ background:'linear-gradient(135deg,#2e1065,#7c3aed)' }} />
            <div className="px-5 pb-5">
              <div className="-mt-9 mb-3">
                <div className="w-16 h-16 rounded-2xl bg-violet-600 border-4 border-white dark:border-zinc-900 flex items-center justify-center text-2xl font-bold text-white shadow-lg overflow-hidden">
                  {intern.user?.avatar
                    ? <img src={intern.user.avatar} className="w-full h-full object-cover" alt="avatar" />
                    : intern.user?.name?.[0]}
                </div>
              </div>
              <h2 className="font-bold text-zinc-900 dark:text-white">{intern.user?.name}</h2>
              <p className="text-zinc-400 text-sm">{intern.department}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge status={intern.status} label={intern.status} />
              </div>

              <div className="mt-4 space-y-2.5">
                {intern.user?.email && <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"><Mail size={13} className="flex-shrink-0" /><span className="truncate">{intern.user.email}</span></div>}
                {intern.user?.phone && <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"><Phone size={13} className="flex-shrink-0" />{intern.user.phone}</div>}
                {intern.github    && <a href={intern.github}   target="_blank" className="flex items-center gap-2 text-sm text-violet-600 hover:underline"><Github   size={13} />GitHub</a>}
                {intern.linkedin  && <a href={intern.linkedin} target="_blank" className="flex items-center gap-2 text-sm text-violet-600 hover:underline"><Linkedin size={13} />LinkedIn</a>}
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="card p-5">
            <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-3">Performance Score</h3>
            <div className="text-center mb-3">
              <p className="text-4xl font-bold text-violet-600">{intern.performanceScore}</p>
              <p className="text-xs text-zinc-400">out of 100</p>
            </div>
            <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full" style={{ width:`${intern.performanceScore}%` }} />
            </div>
          </div>

          {/* Skills */}
          {(intern.techStack?.length || intern.skills?.length) > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-3">Skills & Stack</h3>
              <div className="flex flex-wrap gap-1.5">
                {[...(intern.techStack||[]), ...(intern.skills||[])].map((s,i) => (
                  <span key={i} className="badge-violet">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main detail */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><Calendar size={16} />Internship Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label:'Start Date',  value: intern.internshipStart ? new Date(intern.internshipStart).toDateString() : '—' },
                { label:'End Date',    value: intern.internshipEnd   ? new Date(intern.internshipEnd).toDateString()   : '—' },
                { label:'Duration',    value: intern.internshipDuration || '—' },
                { label:'Mentor',      value: intern.mentor || '—' },
                { label:'Team',        value: intern.team?.name || '—' },
                { label:'Certificate', value: intern.certificateGenerated ? 'Generated' : 'Pending' },
              ].map(item => (
                <div key={item.label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                  <p className="text-xs text-zinc-400 mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {intern.college?.name && (
            <div className="card p-5">
              <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><GraduationCap size={16} />Education</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label:'College', value: intern.college.name },
                  { label:'Degree',  value: intern.college.degree || '—' },
                  { label:'Branch',  value: intern.college.branch || '—' },
                  { label:'Year',    value: intern.college.year   || '—' },
                ].map(item => (
                  <div key={item.label} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                    <p className="text-xs text-zinc-400 mb-1">{item.label}</p>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {intern.projects?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><Award size={16} />Assigned Projects</h3>
              <div className="space-y-3">
                {intern.projects.map(p => (
                  <div key={p._id} className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{p.title}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-20 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width:`${p.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold text-violet-600">{p.progress}%</span>
                      <Badge status={p.status} label={p.status} />
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
