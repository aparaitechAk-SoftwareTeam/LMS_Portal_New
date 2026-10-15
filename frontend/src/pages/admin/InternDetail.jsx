import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Github, Linkedin, Mail, Phone, GraduationCap, Calendar, Award, Edit, Minus, Plus, SlidersHorizontal, LockKeyhole, Save, BadgeCheck, Trophy, Briefcase, Lock, Brain, CheckCircle2, Target } from 'lucide-react'
import api from '../../services/api'
import { Badge, Skeleton } from '../../components/common/index'
import { COMPANY_NAME } from '../../utils/constants'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'

export default function StudentDetail() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [intern, setIntern] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [assessmentReport, setAssessmentReport] = useState({ attempts:[], summary:{ attempts:0, correct:0, questions:0, averagePercentage:0, bestPercentage:0 } })
  const [projectReports, setProjectReports] = useState([])

  const load = (syncForm=true) => Promise.all([api.get(`/interns/${id}`), api.get(`/engagement/assessments/intern/${id}`), api.get(`/engagement/project-reviews/intern/${id}`)]).then(([studentResponse, assessmentResponse, reportsResponse]) => { const data=studentResponse.data.data; setIntern(data); setAssessmentReport(assessmentResponse.data || { attempts:[], summary:{} }); setProjectReports(reportsResponse.data.data || []); if (syncForm) setEditForm({ name:data.user?.name || '', phone:data.user?.phone || '', department:data.department || '', mentor:data.mentor || '', status:data.status || 'active', internshipPlan:data.internshipPlan || '', internshipFee:data.internshipFee || 0 }) }).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load(); const refreshTimer = setInterval(() => load(false), 10000); return () => clearInterval(refreshTimer) }, [id])
  const editOpen = searchParams.get('edit') === '1'
  const closeEdit = () => { setSearchParams({}); setEditForm({ name:intern?.user?.name || '', phone:intern?.user?.phone || '', department:intern?.department || '', mentor:intern?.mentor || '', status:intern?.status || 'active', internshipPlan:intern?.internshipPlan || '', internshipFee:intern?.internshipFee || 0 }) }
  const saveProfile = async e => { e.preventDefault(); setSaving(true); try { await api.put(`/interns/${id}`, editForm); toast.success('Student profile updated'); closeEdit(); load() } catch (err) { toast.error(err.response?.data?.message || 'Could not update student') } finally { setSaving(false) } }
  const applyFeeStructure = async () => { setSaving(true); try { await api.post(`/payments/apply-fee-structure/${id}`); toast.success('Onboarding and final Razorpay dues created/updated'); } catch (err) { toast.error(err.response?.data?.message || 'Set the fee structure first') } finally { setSaving(false) } }
  const setProjectProgress = async (project, value) => { const progress = Math.max(0, Math.min(100, Number(value) || 0)); setSaving(true); try { await api.put(`/projects/${project._id}`, { progress }); toast.success(`${project.title} progress set to ${progress}%`); load() } catch (err) { toast.error(err.response?.data?.message || 'Could not update project progress') } finally { setSaving(false) } }
  const setAccessControl = async (key, value) => { setSaving(true); try { await api.put(`/interns/${id}`, { accessControls: { ...(intern.accessControls || {}), [key]: value } }); toast.success('Access setting saved'); load() } catch (err) { toast.error(err.response?.data?.message || 'Could not save access setting') } finally { setSaving(false) } }

  if (loading) return <div className="space-y-4 max-w-4xl"><Skeleton lines={8} /></div>
  if (!intern) return <div className="text-center py-20 text-zinc-400">Student not found</div>
  const highestProgress = Math.max(0, ...(intern.projects || []).map(project => Number(project.progress) || 0))
  const isUnlocked = (key, threshold) => { const setting = intern.accessControls?.[key] || 'auto'; return setting === 'unlocked' || (setting === 'auto' && highestProgress >= threshold) }
  const milestoneCards = [
    { key:'projectProgress', threshold:50, title:'Project Progress Certificate', icon:BadgeCheck, color:'emerald' },
    { key:'projectCompletion', threshold:60, title:'Project Completion Certificate', icon:Trophy, color:'violet' },
    { key:'lor', threshold:90, title:'Letter of Recommendation (LOR)', icon:Award, color:'blue' },
    { key:'hrInterview', threshold:95, title:'Job / HR Interview Access', icon:Briefcase, color:'amber' }
  ]

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/admin/interns" className="btn-secondary p-2.5"><ArrowLeft size={16} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Student Profile</h1>
          <p className="text-sm text-zinc-400">{intern.internId}</p>
        </div>
        <button disabled={saving} onClick={applyFeeStructure} className="btn-secondary text-sm">Apply fees</button><button onClick={() => setSearchParams({ edit:'1' })} className="btn-primary text-sm"><Edit size={15}/>Edit student</button>
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
                { label:'Plan',        value: intern.internshipPlan || 'Custom internship' },
                { label:'Internship Fee', value: `₹${Number(intern.internshipFee || 0).toLocaleString('en-IN')}` },
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

          <section className="card overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-zinc-100 bg-gradient-to-r from-violet-50 to-sky-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:from-violet-950/30 dark:to-sky-950/20"><div className="flex items-center gap-2"><Brain size={18} className="text-violet-600"/><div><h3 className="font-bold text-zinc-900 dark:text-white">Assessment Report</h3><p className="mt-0.5 text-xs text-zinc-500">Separate assessment performance for this student. It refreshes automatically.</p></div></div><span className="text-xs font-semibold text-violet-600">{assessmentReport.summary?.attempts || 0} attempts</span></div>
            <div className="p-5"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[
              ['Attempts', assessmentReport.summary?.attempts || 0, Brain], ['Average score', `${assessmentReport.summary?.averagePercentage || 0}%`, Target], ['Best score', `${assessmentReport.summary?.bestPercentage || 0}%`, Trophy], ['Correct answers', `${assessmentReport.summary?.correct || 0}/${assessmentReport.summary?.questions || 0}`, CheckCircle2]
            ].map(([label,value,Icon]) => <div key={label} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800"><Icon size={15} className="text-violet-600"/><p className="mt-2 text-xs text-zinc-400">{label}</p><p className="mt-0.5 text-base font-bold text-zinc-800 dark:text-white">{value}</p></div>)}</div>
            {assessmentReport.attempts?.length ? <div className="mt-5 space-y-2">{assessmentReport.attempts.map(attempt => <div key={attempt._id} className="flex flex-col gap-2 rounded-xl border border-zinc-100 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"><div><p className="text-sm font-semibold capitalize text-zinc-800 dark:text-white">{attempt.topic || 'Assessment'}</p><p className="mt-0.5 text-xs capitalize text-zinc-400">{attempt.domain || 'General'} · {attempt.difficulty || '—'} · {new Date(attempt.createdAt).toLocaleString()}</p></div><div className="flex items-center gap-3"><span className="text-xs text-zinc-500">{attempt.score}/{attempt.totalQuestions} correct</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${attempt.percentage >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : attempt.percentage >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'}`}>{attempt.percentage}%</span></div></div>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-zinc-200 p-5 text-center text-sm text-zinc-400 dark:border-zinc-700">This student has not submitted an assessment yet. Once they submit one, the full score report will appear here.</div>}</div>
          </section>

          <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900"><div><h3 className="font-bold text-zinc-900 dark:text-white">Project Reports</h3><p className="mt-0.5 text-xs text-zinc-500">Weekly ZIP code, run recording and screenshot evidence submitted by this student.</p></div><span className="text-xs font-semibold text-violet-600">{projectReports.length} reports</span></div><div className="p-5">{projectReports.length ? <div className="space-y-3">{projectReports.map(report => <div key={report._id} className="rounded-xl border border-zinc-100 p-4 dark:border-zinc-800"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{report.project?.title || 'Project report'}</p><p className="mt-1 text-xs text-zinc-400">Week {report.weekNumber || 1} · {new Date(report.createdAt).toLocaleString()} · {report.status.replaceAll('_',' ')}</p></div><div className="flex flex-wrap gap-2 text-xs">{report.codeZip?.url && <a className="btn-secondary py-1.5" href={report.codeZip.url} target="_blank" rel="noreferrer">ZIP code</a>}{report.screenRecording?.url && <a className="btn-secondary py-1.5" href={report.screenRecording.url} target="_blank" rel="noreferrer">Screen recording</a>}{report.screenshots?.map((shot,index) => <a key={shot.url} className="btn-secondary py-1.5" href={shot.url} target="_blank" rel="noreferrer">Screenshot {index + 1}</a>)}</div></div>{report.notes && <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{report.notes}</p>}</div>)}</div> : <p className="rounded-xl border border-dashed border-zinc-200 p-5 text-center text-sm text-zinc-400 dark:border-zinc-700">No weekly project report has been submitted yet.</p>}</div></section>

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

      <div className="card overflow-hidden">
        <div className="border-b border-zinc-100 bg-gradient-to-r from-violet-50 to-sky-50 px-5 py-4 dark:border-zinc-800 dark:from-violet-950/30 dark:to-sky-950/20"><div className="flex items-center gap-2"><SlidersHorizontal size={18} className="text-violet-600"/><div><h2 className="font-bold text-zinc-900 dark:text-white">Progress & access controls</h2><p className="mt-0.5 text-xs text-zinc-500">This section refreshes automatically every 10 seconds. Adjust a project’s completion first, then choose how certificates, LOR and HR access should behave.</p></div></div></div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1.15fr_.85fr]">
          <div className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Project progress</h3><span className="rounded-full bg-violet-100 px-2 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">Auto refresh on</span></div>{intern.projects?.length ? intern.projects.map(project => <div key={project._id} className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{project.title}</p><p className="mt-0.5 text-xs text-zinc-400">Quick adjust by 5%, or enter the exact completion percentage.</p></div><Badge status={project.status} label={project.status}/></div><div className="mt-4 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 transition-all duration-500" style={{width:`${project.progress || 0}%`}}/></div><div className="mt-3 flex flex-wrap items-center gap-2"><button disabled={saving} onClick={() => setProjectProgress(project, (project.progress || 0) - 5)} className="btn-secondary p-2" title="Decrease progress by 5%"><Minus size={15}/></button><input aria-label={`${project.title} progress`} disabled={saving} type="number" min="0" max="100" value={project.progress || 0} onChange={e => setIntern(current => ({...current, projects:current.projects.map(item => item._id===project._id ? {...item, progress:e.target.value} : item)}))} onBlur={e => setProjectProgress(project, e.target.value)} className="input w-24 text-center font-bold text-violet-700"/><span className="mr-1 text-sm font-bold">%</span><button disabled={saving} onClick={() => setProjectProgress(project, Number(project.progress || 0) + 5)} className="btn-primary p-2" title="Increase progress by 5%"><Plus size={15}/></button><button disabled={saving} onClick={() => setProjectProgress(project, project.progress || 0)} className="ml-auto text-xs font-semibold text-violet-600 hover:text-violet-800">Save progress</button></div></div>) : <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-800">No project is assigned yet. Assign a project first to track progress.</p>}</div>
          <div className="space-y-3"><h3 className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200"><LockKeyhole size={16}/>Certificate & HR controls</h3><p className="text-xs leading-5 text-zinc-500">“Auto” follows the project percentage. “Force unlock” opens access now. “Keep locked” blocks it even after the target is reached.</p>{[
            ['projectProgress','50% Project Progress Certificate'], ['projectCompletion','60% Project Completion Certificate'], ['lor','90% Letter of Recommendation (LOR)'], ['hrInterview','95% Job / HR Interview']
          ].map(([key,label]) => <label key={key} className="block rounded-xl border border-zinc-100 p-3 dark:border-zinc-800"><span className="block text-sm font-semibold">{label}</span><select disabled={saving} value={intern.accessControls?.[key] || 'auto'} onChange={e => setAccessControl(key, e.target.value)} className="input mt-2 text-sm"><option value="auto">Auto — follow progress</option><option value="unlocked">Force unlock — allow now</option><option value="locked">Keep locked — admin only</option></select></label>)}</div>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-zinc-100 bg-zinc-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900"><div><h2 className="font-bold text-zinc-900 dark:text-white">Milestone availability</h2><p className="mt-0.5 text-xs text-zinc-500">Current project progress: <b className="text-violet-600">{highestProgress}%</b>. These cards update automatically when progress or access settings change.</p></div><Link to="/admin/certificates" className="text-sm font-semibold text-violet-600 hover:text-violet-800">Open certificate center →</Link></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">{milestoneCards.map(card => { const unlocked=isUnlocked(card.key,card.threshold); const Icon=card.icon; const colors={emerald:'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30',violet:'bg-violet-100 text-violet-600 dark:bg-violet-900/30',blue:'bg-blue-100 text-blue-600 dark:bg-blue-900/30',amber:'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}; return <div key={card.key} className={`relative rounded-2xl border p-4 transition ${unlocked ? 'border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900' : 'border-zinc-100 bg-zinc-50/70 opacity-75 dark:border-zinc-800 dark:bg-zinc-900/50'}`}><div className="flex items-start justify-between gap-2"><div className={`rounded-xl p-2.5 ${unlocked ? colors[card.color] : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800'}`}><Icon size={20}/></div>{unlocked ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Open</span> : <span className="rounded-full bg-zinc-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800"><Lock size={10} className="mr-1 inline"/>Locked</span>}</div><h3 className="mt-4 text-sm font-bold text-zinc-800 dark:text-white">{card.title}</h3><p className="mt-1 text-xs text-zinc-500">{intern.accessControls?.[card.key] === 'unlocked' ? 'Manually unlocked by admin' : intern.accessControls?.[card.key] === 'locked' ? 'Manually locked by admin' : `Opens automatically at ${card.threshold}%`}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"><div className={`h-full rounded-full ${unlocked ? 'bg-emerald-500' : 'bg-zinc-400'}`} style={{width:`${Math.min(100, highestProgress / card.threshold * 100)}%`}}/></div><p className="mt-2 text-xs font-semibold text-zinc-500">{highestProgress}% / {card.threshold}%</p></div>})}</div>
      </section>

      <Modal isOpen={editOpen} onClose={closeEdit} title="Edit student profile" subtitle="Update the student’s basic details and program status." size="md">
        <form onSubmit={saveProfile} className="space-y-4">
          <div><label className="label">Full name</label><input required className="input" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name:e.target.value})}/></div>
          <div><label className="label">Phone number</label><input className="input" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone:e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Department</label><input required className="input" value={editForm.department || ''} onChange={e => setEditForm({...editForm, department:e.target.value})}/></div><div><label className="label">Program status</label><select className="input" value={editForm.status || 'active'} onChange={e => setEditForm({...editForm, status:e.target.value})}><option value="active">Active</option><option value="completed">Completed</option><option value="terminated">Terminated</option></select></div></div>
          <div><label className="label">Mentor</label><input className="input" value={editForm.mentor || ''} onChange={e => setEditForm({...editForm, mentor:e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Internship plan</label><select className="input" value={editForm.internshipPlan || ''} onChange={e => { const fees={'1 Month Internship':3000,'2 Month Internship':5000,'3 Month Internship':6000}; setEditForm({...editForm, internshipPlan:e.target.value, internshipFee:fees[e.target.value] || editForm.internshipFee}) }}><option value="">Custom internship</option><option value="1 Month Internship">1 Month Internship — ₹3,000</option><option value="2 Month Internship">2 Month Internship — ₹5,000</option><option value="3 Month Internship">3 Month Internship — ₹6,000</option></select></div><div><label className="label">Internship fee (₹)</label><input type="number" min="0" className="input" value={editForm.internshipFee || 0} onChange={e => setEditForm({...editForm, internshipFee:e.target.value})}/><p className="mt-1 text-xs text-zinc-400">Editable for special pricing.</p></div></div>
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs leading-5 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">Project percentage and certificate / HR permissions are controlled separately in the “Admin progress & document access” section on this report.</div>
          <div className="flex gap-3 pt-2"><button type="button" onClick={closeEdit} className="btn-secondary flex-1">Cancel</button><button disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : <><Save size={15}/>Save changes</>}</button></div>
        </form>
      </Modal>
    </div>
  )
}
