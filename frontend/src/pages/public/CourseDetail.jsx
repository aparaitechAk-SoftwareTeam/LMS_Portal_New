import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ArrowLeft, BookOpen, Lock, PlayCircle, ShoppingCart } from 'lucide-react'
import api from '../../services/api'
import { Skeleton } from '../../components/common'
import toast from 'react-hot-toast'

const loadRazorpay = () => new Promise(resolve => {
  if (window.Razorpay) return resolve(true)
  const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script)
})

export default function CourseDetail(){
  const {id}=useParams(); const navigate=useNavigate(); const { token, user }=useSelector(s=>s.auth); const [course,setCourse]=useState(null); const [buying,setBuying]=useState(false)
  useEffect(()=>{api.get(`/public/courses/${id}`).then(({data})=>setCourse(data.data)).catch(()=>setCourse(false))},[id])
  const finalPrice=Math.round(Number(course?.price||0)*(100-Number(course?.discountPercent||0)))/100
  const accessCourse=async()=>{
    if(!token) return navigate('/login')
    if(user?.role!=='intern') return navigate('/admin/learning')
    setBuying(true)
    try {
      if(finalPrice===0){ await api.post(`/learning/${id}/self-enroll`); toast.success('You are enrolled. Start learning!'); return navigate('/intern/learning') }
      const {data:purchase}=await api.post(`/learning/${id}/purchase`)
      const {data:order}=await api.post('/razorpay/create-order',{paymentId:purchase.data._id})
      if(!await loadRazorpay()) throw new Error('Could not load Razorpay checkout')
      new window.Razorpay({ key:order.data.keyId, amount:order.data.amount, currency:order.data.currency, name:'Aparaitech LMS', description:course.title, order_id:order.data.orderId, prefill:{name:order.data.internName,email:order.data.internEmail}, handler:async response=>{try{await api.post('/razorpay/verify',{...response,paymentId:purchase.data._id});toast.success('Payment verified. Course added to My Learning.');navigate('/intern/learning')}catch{}}, theme:{color:'#7c3aed'} }).open()
    } catch(error) { toast.error(error.response?.data?.message || error.message || 'Could not start enrollment') } finally { setBuying(false) }
  }
  if(course===null)return <div className="p-8"><Skeleton lines={5}/></div>;if(!course)return <div className="p-8">Course not found.</div>
  return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950"><header className="max-w-5xl mx-auto px-5 py-5"><Link className="text-violet-600 text-sm flex gap-1" to="/courses"><ArrowLeft size={15}/>All Learning Tracks</Link></header><main className="max-w-5xl mx-auto px-5 pb-16"><div className="card p-7"><span className="badge-violet">{course.domain||'General'}</span><h1 className="text-3xl font-bold mt-4">{course.title}</h1><p className="text-zinc-500 mt-3 max-w-3xl">{course.description}</p><div className="mt-6 flex flex-wrap items-center gap-3">{course.price>0?<div><span className="text-2xl font-bold">₹{finalPrice}</span>{course.discountPercent>0&&<span className="ml-2 text-sm text-zinc-400 line-through">₹{course.price}</span>}</div>:<span className="font-bold text-emerald-600">Free course</span>}<button disabled={buying} onClick={accessCourse} className="btn-primary">{finalPrice===0?'Enrol for free':<><ShoppingCart size={16}/> {buying?'Opening checkout…':'Buy & enrol'}</>}</button></div></div><div className="card p-6 mt-5"><h2 className="font-bold text-xl">Course Content</h2><div className="mt-4 space-y-3">{course.modules.map(module=><div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4" key={module.moduleId}><h3 className="font-semibold">{module.title}</h3>{module.lessons.map(lesson=><div className="flex justify-between items-center text-sm py-2 mt-2 border-t border-zinc-100 dark:border-zinc-800" key={lesson.lessonId}><span className="flex gap-2"><PlayCircle size={16} className="text-violet-500"/>{lesson.title}</span>{lesson.isPreview?<span className="text-emerald-600 text-xs">Preview</span>:<Lock size={14} className="text-zinc-400"/>}</div>)}</div>)}</div></div></main></div>
}
