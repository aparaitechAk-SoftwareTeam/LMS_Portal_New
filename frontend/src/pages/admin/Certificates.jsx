import { useEffect, useState } from 'react'
import { Award, Plus, Download, QrCode } from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import { Empty, Skeleton } from '../../components/common/index'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

export default function Certificates() {
  const [certs, setCerts] = useState([])
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState('')
  const [courseEnrollments, setCourseEnrollments] = useState([])
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    Promise.all([
      api.get('/interns?status=completed&limit=100'),
      api.get('/interns?limit=100'),
      api.get('/learning')
    ]).then(([ciRes, iRes, courseRes]) => {
      setInterns(iRes.data.data)
      setCourses(courseRes.data.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const loadCourseEnrollments = async value => {
    setCourseId(value); setCourseEnrollments([])
    if (!value) return
    try { const { data } = await api.get(`/learning/${value}/enrollments`); setCourseEnrollments(data.data || []) } catch {}
  }

  const onGenerate = async (data) => {
    setGenerating(true)
    try {
      await api.post('/certificates/generate', data)
      toast.success('Certificate generated and emailed to intern!')
      setModal(false); reset(); setCourseId(''); setCourseEnrollments([])
    } catch {} finally { setGenerating(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-800 dark:text-white">Certificates</h1><p className="text-sm text-slate-400">Generate completion certificates and experience letters</p></div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={15} />Generate Certificate</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl"><Award size={22} className="text-primary-600" /></div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Completion Certificate</h3>
              <p className="text-xs text-slate-400">For interns who completed the program</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">Auto-generated PDF with QR verification code, intern details, and company seal.</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl"><QrCode size={22} className="text-emerald-600" /></div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Experience Letter</h3>
              <p className="text-xs text-slate-400">Official work experience documentation</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">Includes duration, department, skills, and performance highlights.</p>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => { setModal(false); reset() }} title="Generate Certificate">
        <form onSubmit={handleSubmit(data => onGenerate({ ...data, courseId: courseId || undefined }))} className="space-y-4">
          <div><label className="label">Certificate scope</label><select className="input" value={courseId} onChange={e => loadCourseEnrollments(e.target.value)}><option value="">Internship program</option>{courses.filter(course => course.status === 'published').map(course => <option key={course._id} value={course._id}>{course.title}</option>)}</select></div>
          <div><label className="label">Select Intern</label>
            <select {...register('internId', { required: true })} className="input">
              <option value="">Choose intern</option>
              {(courseId ? courseEnrollments.filter(item => item.progressPercent >= 75).map(item => item.intern) : interns).map(i => <option key={i._id} value={i._id}>{i.user?.name} — {courseId ? 'Course progress eligible' : `${i.department} (${i.status})`}</option>)}
            </select>
          </div>
          <div><label className="label">Certificate Type</label>
            <select {...register('type', { required: true })} className="input">
              {courseId ? <><option value="progress">Course Progress Certificate (75%)</option><option value="completion">Course Completion Certificate (100%)</option></> : <><option value="completion">Completion Certificate</option><option value="experience">Experience Letter</option></>}
            </select>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs text-amber-700 dark:text-amber-300">The certificate will be auto-generated as PDF with QR code and emailed to the intern.</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setModal(false); reset() }} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={generating} className="btn-primary flex-1">{generating ? 'Generating...' : 'Generate & Send'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
