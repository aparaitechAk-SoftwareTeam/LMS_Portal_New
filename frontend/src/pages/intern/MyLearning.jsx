import { useEffect, useState } from 'react'
import { BookOpen, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'
import { Empty, PageHeader, Skeleton } from '../../components/common'
import { Link } from 'react-router-dom'

export default function MyLearning() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/learning/my-courses').then(({data}) => setItems(data.data || [])).catch(() => setItems([])).finally(() => setLoading(false)) }, [])
  return <div className="space-y-6 max-w-screen-xl"><PageHeader title="My Learning" subtitle="Your assigned learning tracks and progress"/>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{loading ? Array.from({length:3},(_,i)=><div key={i} className="card p-5"><Skeleton lines={4}/></div>) : items.length === 0 ? <div className="col-span-full"><Empty icon={BookOpen} title="No courses assigned" description="Your manager will assign a learning track soon."/></div> : items.map(item => <div className="card p-5" key={item._id}><div className="flex justify-between"><BookOpen className="text-violet-500"/><span className="text-sm font-bold text-violet-600">{item.progressPercent || 0}%</span></div><h2 className="font-bold text-zinc-900 dark:text-white mt-4">{item.course?.title || 'Course unavailable'}</h2><p className="text-sm text-zinc-500 mt-2 line-clamp-2">{item.course?.description}</p><div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 mt-5 overflow-hidden"><div className="h-full bg-violet-600" style={{width:`${item.progressPercent || 0}%`}}/></div><p className="text-xs text-zinc-400 mt-2 flex items-center gap-1"><CheckCircle2 size={12}/>{item.status}</p><Link className="btn-primary w-full mt-4 text-xs" to={`/intern/learning/${item.course?._id}`}>Continue Learning</Link></div>)}</div>
  </div>
}
