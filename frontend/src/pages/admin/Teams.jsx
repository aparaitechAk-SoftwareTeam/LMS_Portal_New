import { useEffect, useState } from 'react'
import { Plus, UsersRound, Edit, Trash2, Crown, Hash, Users, FolderOpen, MessageSquare } from 'lucide-react'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import { Empty, Skeleton, PageHeader, Badge } from '../../components/common/index'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function AdminTeams() {
  const [teams, setTeams]     = useState([])
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const { register, handleSubmit, reset } = useForm()

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const [tRes, iRes] = await Promise.all([
        api.get('/teams'),
        api.get('/interns?limit=100&status=active'),
      ])
      setTeams(tRes.data.data)
      setInterns(iRes.data.data)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchTeams() }, [])

  const onCreate = async (data) => {
    setSaving(true)
    try {
      const members = Array.isArray(data.members) ? data.members : data.members ? [data.members] : []
      await api.post('/teams', { ...data, members })
      toast.success('Team created with default channels!')
      setModal(false); reset(); fetchTeams()
    } catch {} finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this team and all its messages?')) return
    try { await api.delete(`/teams/${id}`); toast.success('Team deleted'); fetchTeams() } catch {}
  }

  const COLORS = ['from-violet-500 to-purple-600','from-emerald-500 to-teal-600','from-sky-500 to-cyan-600','from-amber-500 to-orange-600','from-rose-500 to-pink-600','from-indigo-500 to-blue-600']

  return (
    <div className="space-y-5 max-w-screen-xl">
      <PageHeader title="Teams" subtitle={`${teams.length} teams — Microsoft Teams-style collaboration`}
        actions={<button onClick={() => setModal(true)} className="btn-primary text-sm"><Plus size={15}/>Create Team</button>} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? Array(3).fill(0).map((_,i) => <div key={i} className="card p-5 h-56"><Skeleton lines={5}/></div>)
        : teams.length === 0 ? <div className="col-span-3"><Empty title="No teams yet" description="Create your first team to enable collaboration" icon={UsersRound}/></div>
        : teams.map((team, i) => (
          <motion.div key={team._id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}
            className="card overflow-hidden group">
            <div className={`h-2 bg-gradient-to-r ${COLORS[i % COLORS.length]}`} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                    {team.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white">{team.name}</h3>
                    <p className="text-xs text-zinc-400">{team.members?.length||0} members</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-zinc-400 hover:text-amber-500 transition-colors rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20"><Edit size={13}/></button>
                  <button onClick={() => handleDelete(team._id)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"><Trash2 size={13}/></button>
                </div>
              </div>

              {team.description && <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{team.description}</p>}

              {/* Leader */}
              {team.leader && (
                <div className="flex items-center gap-2 mb-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-2.5">
                  <Crown size={12} className="text-amber-500 flex-shrink-0"/>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{team.leader?.user?.name}</span>
                  <span className="text-xs text-amber-500 ml-auto">Leader</span>
                </div>
              )}

              {/* Members avatars */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex -space-x-2">
                  {team.members?.slice(0,5).map(m => (
                    <div key={m._id} title={m.user?.name}
                      className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-300 overflow-hidden">
                      {m.user?.avatar ? <img src={m.user.avatar} className="w-full h-full object-cover" alt=""/> : m.user?.name?.[0]}
                    </div>
                  ))}
                  {team.members?.length > 5 && (
                    <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-500">
                      +{team.members.length - 5}
                    </div>
                  )}
                </div>
                <span className="text-xs text-zinc-400">{team.members?.length||0} members</span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mb-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1"><Hash size={11}/>3 channels</span>
                <span className="flex items-center gap-1"><FolderOpen size={11}/>{team.projects?.length||0} projects</span>
              </div>

              <Link to={`/admin/teams/${team._id}`} className="btn-secondary w-full text-sm gap-2 justify-center">
                <MessageSquare size={14}/>Open Team
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => {setModal(false);reset()}} title="Create New Team" subtitle="Default channels (general, announcements, resources) will be created automatically" size="lg">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div><label className="label">Team Name <span className="text-red-500">*</span></label>
            <input {...register('name',{required:true})} className="input" placeholder="e.g. Frontend Squad"/></div>
          <div><label className="label">Description</label>
            <textarea {...register('description')} className="input h-20 resize-none" placeholder="What does this team work on?"/></div>
          <div><label className="label">Team Leader</label>
            <select {...register('leader')} className="input">
              <option value="">Select leader</option>
              {interns.map(i => <option key={i._id} value={i._id}>{i.user?.name} — {i.department}</option>)}
            </select>
          </div>
          <div><label className="label">Members (hold Ctrl/Cmd for multiple)</label>
            <select {...register('members')} multiple className="input h-36">
              {interns.map(i => <option key={i._id} value={i._id}>{i.user?.name} — {i.department}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => {setModal(false);reset()}} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating…</> : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
