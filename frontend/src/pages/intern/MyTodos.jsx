import { useEffect, useState } from 'react'
import { Check, Plus, Star, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Empty, PageHeader, Skeleton } from '../../components/common'

export default function MyTodos() {
  const [todos, setTodos] = useState([]); const [loading, setLoading] = useState(true); const [title, setTitle] = useState('')
  const load = async () => { setLoading(true); try { const { data } = await api.get('/engagement/todos'); setTodos(data.data || []) } catch {} finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  const create = async e => { e.preventDefault(); if (!title.trim()) return; try { await api.post('/engagement/todos', { title }); setTitle(''); load() } catch { toast.error('Could not add to-do') } }
  const update = async (id, payload) => { try { await api.put(`/engagement/todos/${id}`, payload); load() } catch { toast.error('Could not update to-do') } }
  const remove = async id => { try { await api.delete(`/engagement/todos/${id}`); load() } catch { toast.error('Could not delete to-do') } }
  return <div className="space-y-6 max-w-3xl"><PageHeader title="My To-dos" subtitle="Keep your personal internship work organized"/>
    <form onSubmit={create} className="card p-3 flex gap-2"><input value={title} onChange={e => setTitle(e.target.value)} className="input flex-1" placeholder="Add a personal task…"/><button className="btn-primary px-4"><Plus size={17}/>Add</button></form>
    <div className="space-y-2">{loading ? Array.from({length:4},(_,i)=><div className="card p-4" key={i}><Skeleton lines={1}/></div>) : todos.length === 0 ? <Empty title="No personal to-dos" description="Add a task above to get started." icon={Check}/> : todos.map(todo => <div key={todo._id} className={`card p-4 flex items-center gap-3 ${todo.isCompleted ? 'opacity-60' : ''}`}>
      <button onClick={() => update(todo._id,{ isCompleted: !todo.isCompleted })} className={`w-6 h-6 rounded-full border flex items-center justify-center ${todo.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300'}`}>{todo.isCompleted && <Check size={14}/>}</button>
      <div className="flex-1"><p className={`font-medium text-zinc-800 dark:text-zinc-100 ${todo.isCompleted ? 'line-through' : ''}`}>{todo.title}</p><p className="text-xs text-zinc-400 capitalize">{todo.priority} priority · {todo.category}</p></div>
      <button onClick={() => update(todo._id,{isFavorite:!todo.isFavorite})} className={todo.isFavorite ? 'text-amber-500' : 'text-zinc-300'}><Star size={17} fill={todo.isFavorite ? 'currentColor' : 'none'}/></button><button onClick={() => remove(todo._id)} className="text-zinc-300 hover:text-red-500"><Trash2 size={17}/></button>
    </div>)}</div>
  </div>
}
