import { useEffect, useState } from 'react'
import { BookOpen, Plus, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import { Empty, PageHeader, Skeleton } from '../../components/common'
import { Link } from 'react-router-dom'

const blankCourse = { title:'', description:'', domain:'', price:0, discountPercent:0, status:'draft', modules:[] }

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
    try { await api.post('/learning', form); toast.success('Learning course created'); setOpen(false); setForm(blankCourse); load() }
    catch (err) { toast.error(err.response?.data?.message || 'Could not create course') } finally { setSaving(false) }
  }
  const togglePublish = async course => {
    try { await api.put(`/learning/${course._id}`, { status: course.status === 'published' ? 'draft' : 'published' }); toast.success('Course status updated'); load() }
    catch { toast.error('Could not update course') }
  }
  return <div className="space-y-6 max-w-screen-xl">
    <PageHeader title="Learning Courses" subtitle="Create tracks, publish content and assign students"
      actions={<button className="btn-primary text-sm" onClick={() => setOpen(true)}><Plus size={15}/>New Course</button>} />
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {loading ? Array.from({length:3}, (_,i) => <div className="card p-5" key={i}><Skeleton lines={4}/></div>) : courses.length === 0 ? <div className="col-span-full"><Empty icon={BookOpen} title="No learning courses" description="Create your first course to start assigning learning tracks."/></div> : courses.map(course => <div className="card p-5" key={course._id}>
        <div className="flex justify-between gap-3"><div><span className={course.status === 'published' ? 'badge-green' : 'badge-amber'}>{course.status}</span><h2 className="font-bold text-zinc-900 dark:text-white mt-2">{course.title}</h2></div><BookOpen className="text-violet-500" size={22}/></div>
        <p className="text-sm text-zinc-500 mt-3 line-clamp-2">{course.description}</p>
        <div className="flex justify-between mt-4 text-xs text-zinc-400"><span>{course.domain || 'General'}</span><span>₹{course.price || 0}</span></div>
        <div className="flex gap-2 mt-4"><Link to={`/admin/learning/${course._id}`} className="btn-primary flex-1 text-xs">Edit Content</Link><button onClick={() => togglePublish(course)} className="btn-secondary flex-1 text-xs">{course.status === 'published' ? 'Draft' : 'Publish'}</button></div>
      </div>)}
    </div>
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Create Learning Course" size="lg"><form onSubmit={create} className="space-y-4">
      <div><label className="label">Course title</label><input required className="input" value={form.title} onChange={e => setForm({...form,title:e.target.value})}/></div>
      <div><label className="label">Description</label><textarea required className="input min-h-24" value={form.description} onChange={e => setForm({...form,description:e.target.value})}/></div>
      <div className="grid grid-cols-2 gap-4"><div><label className="label">Domain</label><input className="input" value={form.domain} onChange={e => setForm({...form,domain:e.target.value})}/></div><div><label className="label">Price</label><input type="number" min="0" className="input" value={form.price} onChange={e => setForm({...form,price:Number(e.target.value)})}/></div><div><label className="label">Discount (%)</label><input type="number" min="0" max="100" className="input" value={form.discountPercent} onChange={e => setForm({...form,discountPercent:Number(e.target.value)})}/></div></div>
      <div className="flex gap-3"><button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)}>Cancel</button><button disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Create Course'}</button></div>
    </form></Modal>
  </div>
}
