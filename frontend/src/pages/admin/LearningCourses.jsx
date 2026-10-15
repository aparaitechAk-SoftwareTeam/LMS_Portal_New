import { useEffect, useState } from 'react'
import { Briefcase, CalendarDays, ChevronRight, IndianRupee, Plus, Rocket } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import { Empty, PageHeader, Skeleton } from '../../components/common'
import { Link } from 'react-router-dom'

const blankCourse = { title:'', description:'', domain:'', price:0, discountPercent:0, status:'draft', modules:[] }
const planDetails = {
  '1 Month Internship': { duration:'1 month', accent:'from-sky-500 to-indigo-600', outcome:'One guided live project', label:'Starter' },
  '2 Month Internship': { duration:'2 months', accent:'from-violet-500 to-fuchsia-600', outcome:'Two live project milestones', label:'Professional' },
  '3 Month Internship': { duration:'3 months', accent:'from-emerald-500 to-cyan-600', outcome:'Capstone project & placement readiness', label:'Career track' },
}

export default function LearningCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blankCourse)
  const [saving, setSaving] = useState(false)
  const load = async () => { setLoading(true); try { const { data } = await api.get('/learning'); setCourses(data.data || []) } catch {} finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  const create = async e => {
    e.preventDefault(); setSaving(true)
    try { await api.post('/learning', form); toast.success('Live project plan created'); setOpen(false); setForm(blankCourse); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Could not create plan') } finally { setSaving(false) }
  }
  const togglePublish = async course => {
    try { await api.put(`/learning/${course._id}`, { status: course.status === 'published' ? 'draft' : 'published' }); toast.success('Plan status updated'); load() }
    catch { toast.error('Could not update plan') }
  }
  return <div className="space-y-6 max-w-screen-xl">
    <PageHeader title="Live Project Internships" subtitle="Manage internship plans, live-project deliverables and student assignments"
      actions={<button className="btn-primary text-sm" onClick={() => setOpen(true)}><Plus size={15}/>New Internship Plan</button>} />
    <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-cyan-50 p-5 dark:border-violet-900/40 dark:from-violet-950/30 dark:via-zinc-900 dark:to-cyan-950/20">
      <div className="flex flex-wrap items-center gap-3"><div className="rounded-xl bg-violet-600 p-2.5 text-white"><Rocket size={19}/></div><div><p className="font-bold text-zinc-900 dark:text-white">Internship plans are built around live project delivery</p><p className="text-sm text-zinc-500">Open any plan card to review deliverables, modules, assignments and enrolled students.</p></div></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {loading ? Array.from({length:3}, (_,i) => <div className="card p-5" key={i}><Skeleton lines={4}/></div>) : courses.length === 0 ? <div className="col-span-full"><Empty icon={Briefcase} title="No internship plans yet" description="Create an internship plan to start assigning students to live projects."/></div> : courses.map(course => { const details = planDetails[course.title] || { duration:'Custom duration', accent:'from-violet-500 to-indigo-600', outcome:'Live project internship', label:'Custom plan' }; return <Link to={`/admin/learning/${course._id}`} className="group card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl" key={course._id}>
        <div className={`h-1.5 bg-gradient-to-r ${details.accent}`}/><div className="p-5">
          <div className="flex justify-between gap-3"><div><span className={course.status === 'published' ? 'badge-green' : 'badge-amber'}>{course.status}</span><h2 className="font-bold text-lg text-zinc-900 dark:text-white mt-3">{course.title}</h2></div><div className={`rounded-xl bg-gradient-to-br ${details.accent} p-2.5 text-white shadow-lg`}><Briefcase size={21}/></div></div>
          <p className="text-sm text-zinc-500 mt-3 line-clamp-2">{course.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800"><span className="text-zinc-400 flex items-center gap-1"><CalendarDays size={12}/>Duration</span><b className="mt-1 block text-zinc-800 dark:text-white">{details.duration}</b></div><div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800"><span className="text-zinc-400 flex items-center gap-1"><IndianRupee size={12}/>Investment</span><b className="mt-1 block text-zinc-800 dark:text-white">₹{course.price || 0}</b></div></div>
          <p className="mt-3 text-xs font-medium text-violet-600">{details.outcome}</p>
          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-sm font-semibold text-violet-600 dark:border-zinc-800"><span>View complete plan</span><ChevronRight size={17} className="transition-transform group-hover:translate-x-1"/></div>
        </div>
      </Link> })}
    </div>
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Create Live Project Internship Plan" size="lg"><form onSubmit={create} className="space-y-4">
      <div><label className="label">Internship plan title</label><input required className="input" placeholder="e.g. 1 Month Internship" value={form.title} onChange={e => setForm({...form,title:e.target.value})}/></div>
      <div><label className="label">Description</label><textarea required className="input min-h-24" value={form.description} onChange={e => setForm({...form,description:e.target.value})}/></div>
      <div className="grid grid-cols-2 gap-4"><div><label className="label">Domain</label><input className="input" value={form.domain} onChange={e => setForm({...form,domain:e.target.value})}/></div><div><label className="label">Price</label><input type="number" min="0" className="input" value={form.price} onChange={e => setForm({...form,price:Number(e.target.value)})}/></div><div><label className="label">Discount (%)</label><input type="number" min="0" max="100" className="input" value={form.discountPercent} onChange={e => setForm({...form,discountPercent:Number(e.target.value)})}/></div></div>
      <div className="flex gap-3"><button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)}>Cancel</button><button disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Create Plan'}</button></div>
    </form></Modal>
  </div>
}
