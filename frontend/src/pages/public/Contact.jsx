import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Mail, Send } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const emptyForm = { name:'', email:'', phone:'', subject:'', message:'' }

export default function Contact() {
  const [form, setForm] = useState(emptyForm)
  const [sending, setSending] = useState(false)
  const change = e => setForm(current => ({ ...current, [e.target.name]: e.target.value }))
  const submit = async e => {
    e.preventDefault(); setSending(true)
    try { await api.post('/public/inquiries', form); toast.success('Message sent. Our team will contact you soon.'); setForm(emptyForm) }
    catch {} finally { setSending(false) }
  }
  return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950"><header className="max-w-6xl mx-auto px-5 py-5 flex justify-between items-center"><Link to="/" className="font-bold text-zinc-900 dark:text-white flex gap-2"><BookOpen className="text-violet-600"/>Aparaitech LMS</Link><div className="flex gap-2"><Link className="btn-secondary text-sm" to="/courses">Explore Courses</Link><Link className="btn-primary text-sm" to="/login">Login</Link></div></header><main className="max-w-4xl mx-auto px-5 py-14 grid md:grid-cols-2 gap-10"><section><span className="badge-violet">Contact & Support</span><h1 className="text-4xl font-bold mt-5 text-zinc-900 dark:text-white">Let’s plan your learning journey.</h1><p className="text-zinc-500 mt-4 leading-7">Ask about learning tracks, internships, enrolment, or platform support. This form is for prospective learners; enrolled students can use Support Tickets after login.</p><div className="mt-8 flex gap-3 items-center text-sm text-zinc-600 dark:text-zinc-300"><Mail className="text-violet-600" size={19}/><span>Our team will respond using your submitted email.</span></div></section><form onSubmit={submit} className="card p-6 space-y-4"><div><label className="label">Full name</label><input required name="name" value={form.name} onChange={change} className="input" maxLength="100" /></div><div><label className="label">Email</label><input required type="email" name="email" value={form.email} onChange={change} className="input" /></div><div><label className="label">Phone (optional)</label><input name="phone" value={form.phone} onChange={change} className="input" maxLength="30" /></div><div><label className="label">Subject</label><input required name="subject" value={form.subject} onChange={change} className="input" maxLength="160" /></div><div><label className="label">Message</label><textarea required name="message" value={form.message} onChange={change} className="input min-h-28" maxLength="4000" /></div><button disabled={sending} className="btn-primary w-full justify-center"> <Send size={16}/> {sending ? 'Sending…' : 'Send inquiry'}</button></form></main></div>
}
