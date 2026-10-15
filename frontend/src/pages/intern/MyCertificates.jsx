import { useEffect, useState } from 'react'
import { Award, Download, Shield, ExternalLink, Trophy, BadgeCheck, Briefcase, Lock, Clock3, BookOpen } from 'lucide-react'
import api from '../../services/api'
import { Empty, Skeleton, PageHeader } from '../../components/common/index'
import { motion } from 'framer-motion'
import { COMPANY_NAME } from '../../utils/constants'

const TYPE_CONFIG = {
  completion: { label:'Certificate of Completion', color:'from-violet-500 to-purple-600', icon: Award },
  experience: { label:'Experience Letter',          color:'from-emerald-500 to-teal-600',  icon: Shield },
  appreciation:{ label:'Appreciation Certificate', color:'from-amber-500 to-orange-600',  icon: Award },
  project_progress: { label:'Project Progress Certificate', color:'from-emerald-500 to-green-600', icon: BadgeCheck },
  project_completion: { label:'Project Completion Certificate', color:'from-violet-500 to-purple-600', icon: Trophy },
  lor: { label:'Letter of Recommendation (LOR)', color:'from-blue-500 to-indigo-600', icon: Award },
}

export default function MyCertificates() {
  const [certs, setCerts]   = useState([])
  const [milestones, setMilestones] = useState([])
  const [learningMilestones, setLearningMilestones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/certificates/my'), api.get('/certificates/project-eligibility'), api.get('/certificates/learning-eligibility')])
      .then(([certRes, milestoneRes, learningRes]) => { setCerts(certRes.data.data); setMilestones(milestoneRes.data.data || []); setLearningMilestones(learningRes.data.data || []) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  const primaryMilestone = [...milestones].sort((a,b) => b.progressPercent - a.progressPercent)[0]
  const progress = primaryMilestone?.progressPercent || 0
  const issued = primaryMilestone?.issuedTypes || []
  const milestoneCards = [
    { type:'project_progress', threshold:50, title:'Project Progress Certificate', text:'Certificate for reaching 50% project completion', icon:BadgeCheck, issued:issued.includes('project_progress'), unlocked:primaryMilestone?.projectProgressEligible },
    { type:'project_completion', threshold:60, title:'Project Completion Certificate', text:'Official certificate of project completion', icon:Trophy, issued:issued.includes('project_completion'), unlocked:primaryMilestone?.projectCompletionEligible },
    { type:'lor', threshold:90, title:'Letter of Recommendation (LOR)', text:'Personalized recommendation from mentors', icon:Award, issued:issued.includes('lor'), unlocked:primaryMilestone?.lorEligible },
  ]

  return (
    <div className="space-y-6 max-w-screen-xl">
      <PageHeader title="My Certificates" subtitle="Download and share your earned certificates" />

      {!loading && primaryMilestone && <>
        <div className="card p-5">
          <div className="flex justify-between text-sm mb-2"><span className="font-semibold">{primaryMilestone.project?.title} — Project Progress</span><span className="font-bold text-violet-600">{progress}%</span></div>
          <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 via-violet-500 to-indigo-600" style={{width:`${progress}%`}}/></div>
          <div className="flex justify-between text-xs text-zinc-400 mt-2"><span>0%</span><span>50%</span><span>60%</span><span>90%</span><span>95%</span></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {milestoneCards.map(card => { const unlocked = card.unlocked; const Icon = card.icon; return <div key={card.type} className={`card overflow-hidden relative ${unlocked ? '' : 'opacity-75'}`}>
            {!unlocked && <div className="absolute right-0 top-0 bg-zinc-500 text-white text-xs px-3 py-1 rotate-45 translate-x-7 translate-y-2 font-bold">LOCKED</div>}
            <div className="p-6"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${unlocked ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}><Icon size={26}/></div><h3 className="font-bold text-zinc-800 dark:text-white mt-5">{card.title}</h3><p className="text-sm text-zinc-500 mt-2 min-h-11">{card.text}</p><span className="inline-flex mt-4 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-semibold text-zinc-600 dark:text-zinc-300"><Lock size={14} className="mr-1.5"/>Requires {card.threshold}% progress</span><div className="flex justify-between text-xs text-zinc-400 mt-6"><span>Progress Required</span><span>{card.threshold}%</span></div><div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 mt-2"><div className={`h-full rounded-full ${unlocked ? 'bg-emerald-500' : 'bg-zinc-300'}`} style={{width:`${Math.min(progress/card.threshold*100,100)}%`}}/></div><div className={`mt-5 rounded-xl p-3 text-sm text-center ${unlocked ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-zinc-50 text-zinc-500 dark:bg-zinc-800'}`}>{card.issued ? 'Certificate issued' : unlocked ? 'Eligible — admin will issue it' : <><Clock3 size={15} className="inline mr-1"/>Available at {card.threshold}% progress</>}</div></div></div> })}
          <div className={`card overflow-hidden relative ${primaryMilestone?.jobInterviewEligible ? '' : 'opacity-75'}`}><div className="p-6"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${primaryMilestone?.jobInterviewEligible ? 'bg-amber-100 text-amber-600' : 'bg-zinc-200 text-zinc-400'}`}><Briefcase size={26}/></div><h3 className="font-bold text-zinc-800 dark:text-white mt-5">Apply for Job / HR Interview</h3><p className="text-sm text-zinc-500 mt-2 min-h-11">Unlock job and interview opportunities after reaching 95% project progress.</p><span className="inline-flex mt-4 px-3 py-1.5 rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600"><Lock size={14} className="mr-1.5"/>Requires 95% progress</span><div className="mt-5 rounded-xl p-3 text-sm text-center bg-zinc-50 text-zinc-500">{primaryMilestone?.jobInterviewEligible ? 'Eligible — contact your manager' : 'Available at 95% progress'}</div></div></div>
        </div>
      </>}

      {!loading && learningMilestones.length > 0 && <section><h2 className="font-bold text-lg mb-3 flex items-center gap-2"><BookOpen size={19} className="text-violet-600"/>Learning certificates</h2><div className="grid md:grid-cols-2 gap-4">{learningMilestones.map(item => <div className="card p-5" key={item.course?._id}><div className="flex justify-between gap-3"><div><h3 className="font-bold">{item.course?.title || 'Learning course'}</h3><p className="text-sm text-zinc-500 mt-1">Course progress: {item.progressPercent}%</p></div><BookOpen className="text-violet-500"/></div><div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 mt-4 overflow-hidden"><div className="h-full bg-violet-600" style={{ width: `${item.progressPercent}%` }}/></div><div className="grid grid-cols-2 gap-2 mt-4 text-xs"><div className={item.progressEligible ? 'rounded-lg bg-emerald-50 text-emerald-700 p-2 dark:bg-emerald-950/30 dark:text-emerald-300' : 'rounded-lg bg-zinc-50 text-zinc-500 p-2 dark:bg-zinc-800'}><p className="font-semibold">75% Progress</p><p className="mt-1">{item.progressIssued ? 'Issued' : item.progressEligible ? 'Eligible — admin will issue' : 'Locked'}</p></div><div className={item.completionEligible ? 'rounded-lg bg-emerald-50 text-emerald-700 p-2 dark:bg-emerald-950/30 dark:text-emerald-300' : 'rounded-lg bg-zinc-50 text-zinc-500 p-2 dark:bg-zinc-800'}><p className="font-semibold">100% Completion</p><p className="mt-1">{item.completionIssued ? 'Issued' : item.completionEligible ? 'Eligible — admin will issue' : 'Locked'}</p></div></div></div>)}</div></section>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array(2).fill(0).map((_,i) => <div key={i} className="card p-6 h-48"><Skeleton lines={4} /></div>)}
        </div>
      ) : certs.length===0 ? (
        <div className="space-y-6">
          <Empty
            title="No certificates yet"
            description="Certificates will be generated upon completion of your internship program."
            icon={Award}
          />
          {/* Placeholder preview cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(TYPE_CONFIG).slice(0,2).map(([type, cfg]) => (
              <div key={type} className="card overflow-hidden opacity-40">
                <div className={`h-2 bg-gradient-to-r ${cfg.color}`} />
                <div className="p-6 flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cfg.color} flex items-center justify-center`}>
                    <cfg.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-white">{cfg.label}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Issued by {COMPANY_NAME}</p>
                    <p className="text-xs text-zinc-300 mt-2">Not yet issued</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certs.map((cert, i) => {
            const cfg = TYPE_CONFIG[cert.type] || TYPE_CONFIG.completion
            return (
              <motion.div key={cert._id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.1 }}
                className="card overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${cfg.color}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cfg.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <cfg.icon size={24} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-zinc-900 dark:text-white">{cfg.label}</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">Issued by {COMPANY_NAME}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {new Date(cert.issuedDate).toLocaleDateString('en-US',{ month:'long', day:'numeric', year:'numeric' })}
                        </p>
                      </div>
                    </div>

                    {cert.qrCode && (
                      <div className="flex-shrink-0">
                        <img src={cert.qrCode} alt="QR" className="w-16 h-16 rounded-xl border border-zinc-200 dark:border-zinc-700" />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                    <p className="text-xs text-zinc-400 mb-1">Certificate ID</p>
                    <p className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">{cert.certificateId}</p>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <a href={cert.pdfUrl} target="_blank"
                      className="btn-primary flex-1 text-sm">
                      <Download size={14} />Download PDF
                    </a>
                    <a href={`/verify/${cert.certificateId}`} target="_blank"
                      className="btn-secondary text-sm">
                      <Shield size={14} />Verify
                    </a>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
