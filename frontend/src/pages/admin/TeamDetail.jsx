import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ArrowLeft, Hash, Volume2, Plus, Send, Paperclip, Smile,
  Pin, X, Edit3, Trash2, Crown, ChevronRight, FolderOpen,
  Download, FileText, Archive, Image as ImageIcon,
  MessageSquare, Users, Video, Search, Wifi, WifiOff, Lock, Unlock, ShieldAlert
} from 'lucide-react'
import api from '../../services/api'
import { initSocket } from '../../socket/socket'
import { Badge, Skeleton } from '../../components/common/index'
import Modal from '../../components/common/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

// ── helpers ─────────────────────────────────────────────────────
const fmt = (d) => {
  if (!d) return ''
  const diff = Date.now() - new Date(d)
  if (diff < 60000)    return 'just now'
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return new Date(d).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
  return new Date(d).toLocaleDateString([],{month:'short',day:'numeric'})
}
const EMOJI_LIST = ['👍','❤️','😂','😮','😢','🔥','✅','🎉','💯','⚡']
const FileIcon = ({mime}) => {
  if (mime?.startsWith('image/')) return <ImageIcon size={14} className="text-violet-500"/>
  if (mime?.includes('pdf'))      return <FileText   size={14} className="text-red-500"/>
  if (mime?.includes('zip'))      return <Archive    size={14} className="text-amber-500"/>
  return <FileText size={14} className="text-zinc-400"/>
}

// ── EmojiPicker ──────────────────────────────────────────────────
const EmojiPicker = ({onPick,onClose}) => {
  const ref = useRef(null)
  useEffect(()=>{
    const h=(e)=>{ if(ref.current&&!ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown',h)
    return()=>document.removeEventListener('mousedown',h)
  },[onClose])
  return (
    <div ref={ref} className="absolute bottom-8 right-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-3 z-50 flex flex-wrap gap-1.5 w-56">
      {EMOJI_LIST.map(e=>(
        <button key={e} type="button" onClick={()=>{onPick(e);onClose()}}
          className="text-xl hover:scale-125 transition-transform p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700">{e}</button>
      ))}
    </div>
  )
}

// ── MessageBubble ────────────────────────────────────────────────
const MessageBubble = ({msg,isMine,onReact,onReply,onDelete,onPin,userId,teamId}) => {
  const [showAct,  setShowAct]  = useState(false)
  const [showEmoji,setShowEmoji]= useState(false)
  const [editing,  setEditing]  = useState(false)
  const [editVal,  setEditVal]  = useState(msg.content||'')
  const sock = ()=> window._teamSocket

  const doEdit = () => {
    if(!editVal.trim()) return
    sock()?.emit('edit_message',{messageId:msg._id,content:editVal,teamId})
    setEditing(false)
  }
  const doDelete = () => {
    if(!confirm('Delete this message?')) return
    sock()?.emit('delete_message',{messageId:msg._id,teamId})
    onDelete(msg._id)
  }

  if(msg.deletedAt) return (
    <div className={`flex gap-3 px-3 py-1 ${isMine?'flex-row-reverse':''}`}>
      <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0"/>
      <div className="text-xs text-zinc-400 italic px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">Message deleted</div>
    </div>
  )

  return (
    <div className={`group flex gap-3 px-3 py-1.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${isMine?'flex-row-reverse':''}`}
      onMouseEnter={()=>setShowAct(true)} onMouseLeave={()=>{setShowAct(false);setShowEmoji(false)}}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 overflow-hidden
        ${isMine ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'}`}>
        {msg.sender?.avatar ? <img src={msg.sender.avatar} className="w-full h-full object-cover" alt=""/> : (msg.sender?.name?.[0]||'?')}
      </div>

      <div className={`flex-1 min-w-0 flex flex-col ${isMine?'items-end':'items-start'}`}>
        <div className={`flex items-baseline gap-2 mb-1 ${isMine?'flex-row-reverse':''}`}>
          <span className={`text-xs font-bold ${isMine?'text-indigo-600 dark:text-indigo-400':'text-zinc-800 dark:text-zinc-200'}`}>
            {isMine ? 'You (Admin)' : msg.sender?.name||'Unknown'}
          </span>
          <span className="text-xs text-zinc-400">{fmt(msg.createdAt)}</span>
          {msg.isPinned && <Pin size={10} className="text-amber-500"/>}
          {msg.edited   && <span className="text-xs text-zinc-400 italic">(edited)</span>}
        </div>

        {msg.replyTo && (
          <div className={`mb-1 pl-2 border-l-2 border-violet-400 text-xs text-zinc-400 max-w-xs truncate ${isMine?'text-right pl-0 pr-2 border-l-0 border-r-2':''}`}>
            <span className="font-semibold">{msg.replyTo?.sender?.name}: </span>
            {String(msg.replyTo?.content||'').slice(0,80)}
          </div>
        )}

        {editing ? (
          <div className="flex gap-2 w-full max-w-sm">
            <input value={editVal} onChange={e=>setEditVal(e.target.value)} autoFocus
              className="input flex-1 text-sm py-1.5"
              onKeyDown={e=>{if(e.key==='Enter')doEdit();if(e.key==='Escape')setEditing(false)}}/>
            <button onClick={doEdit} className="btn-primary text-xs px-3 py-1.5">Save</button>
            <button onClick={()=>setEditing(false)} className="btn-secondary text-xs px-2 py-1.5">✕</button>
          </div>
        ) : (
          <div className={`max-w-sm lg:max-w-md rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words
            ${isMine
              ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
              : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-tl-none shadow-sm'}`}>
            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
            {msg.attachments?.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {msg.attachments.map((att,i) =>
                  att.mimeType?.startsWith('image/') ? (
                    <a key={i} href={att.url} target="_blank" rel="noreferrer">
                      <img src={att.url} alt={att.name} className="rounded-xl max-h-44 max-w-full object-cover hover:opacity-90 transition-opacity"/>
                    </a>
                  ) : (
                    <a key={i} href={att.url} target="_blank" rel="noreferrer"
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-colors ${isMine?'bg-white/20 hover:bg-white/30':'bg-zinc-50 dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600'}`}>
                      <FileIcon mime={att.mimeType}/><span className="flex-1 truncate font-medium">{att.name}</span><Download size={12}/>
                    </a>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {msg.reactions?.filter(r=>r.users?.length>0).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {msg.reactions.filter(r=>r.users?.length>0).map(r=>(
              <button key={r.emoji} onClick={()=>onReact(msg._id,r.emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all
                  ${r.users?.some(u=>u?.toString()===userId?.toString())
                    ?'bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 text-violet-700'
                    :'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-violet-50 dark:hover:bg-violet-950/30'}`}>
                {r.emoji} <span className="font-bold">{r.users?.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showAct && !editing && (
        <div className={`flex items-center gap-0.5 self-start mt-1.5 flex-shrink-0 ${isMine?'order-first mr-1':'order-last ml-1'}`}>
          <div className="relative">
            <button type="button" onClick={()=>setShowEmoji(!showEmoji)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"><Smile size={14}/></button>
            {showEmoji && <EmojiPicker onPick={e=>onReact(msg._id,e)} onClose={()=>setShowEmoji(false)}/>}
          </div>
          <button type="button" onClick={()=>onReply(msg)} className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors"><MessageSquare size={14}/></button>
          <button type="button" onClick={()=>onPin(msg._id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"><Pin size={14}/></button>
          {isMine && (
            <>
              <button type="button" onClick={()=>{setEditing(true);setShowAct(false)}} className="p-1.5 rounded-lg text-zinc-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-colors"><Edit3 size={14}/></button>
              <button type="button" onClick={doDelete} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"><Trash2 size={14}/></button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────
export default function AdminTeamDetail() {
  const { id } = useParams()
  const { user } = useSelector(s => s.auth)
  const [team,        setTeam]        = useState(null)
  const [channels,    setChannels]    = useState([])
  const [activeChannel,setActiveChannel] = useState('general')
  const [messages,    setMessages]    = useState([])
  const [msgLoading,  setMsgLoading]  = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [input,       setInput]       = useState('')
  const [replyTo,     setReplyTo]     = useState(null)
  const [files,       setFiles]       = useState([])
  const [uploading,   setUploading]   = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [onlineMembers,setOnlineMembers]=useState([])
  const [showPinned,  setShowPinned]  = useState(false)
  const [pinnedMsgs,  setPinnedMsgs]  = useState([])
  const [showFiles,   setShowFiles]   = useState(false)
  const [sharedFiles, setSharedFiles] = useState([])
  const [showMembers, setShowMembers] = useState(true)
  const [channelModal,setChannelModal]= useState(false)
  const [newChannel,  setNewChannel]  = useState('')
  const [socketReady, setSocketReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [lockedChannels, setLockedChannels] = useState({}) // channelName -> bool
  const { register, handleSubmit, reset } = useForm()
  const bottomRef   = useRef(null)
  const fileInputRef= useRef(null)
  const typingTimer = useRef(null)
  const socketRef   = useRef(null)

  // ── Load team ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [tRes, chRes] = await Promise.all([
          api.get(`/teams/${id}`),
          api.post(`/teams/${id}/ensure-channels`),
        ])
        setTeam(tRes.data.data)
        const chs = chRes.data.data || []
        setChannels(chs)
        // build locked map
        const lockMap = {}
        chs.forEach(c => { lockMap[c.name] = c.isLocked||false })
        setLockedChannels(lockMap)
        setActiveChannel(chs.find(c=>c.name==='general')?.name || chs[0]?.name || 'general')
      } catch { toast.error('Failed to load team') } finally { setLoading(false) }
    }
    load()
  }, [id])

  // ── Socket ───────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !user) return
    const token = localStorage.getItem('token')
    const sock  = initSocket(token)
    socketRef.current = sock
    window._teamSocket = sock   // shared ref for MessageBubble

    const onConnect = () => {
      setSocketReady(true)
      sock.emit('join_team', id)
      sock.emit('get_online_members', id)
    }
    if (sock.connected) onConnect()
    else sock.on('connect', onConnect)
    sock.on('disconnect', () => setSocketReady(false))
    // reconnect handled via connect event re-fire

    return () => { sock.off('connect', onConnect); sock.emit('leave_team', id) }
  }, [id, user?._id])

  // ── Socket events ────────────────────────────────────────────
  useEffect(() => {
    const sock = socketRef.current
    if (!sock) return
    const onMsg  = (msg) => { if(msg.channel===activeChannel) setMessages(p=>p.find(m=>m._id===msg._id)?p:[...p,msg]) }
    const onEdit = (msg) => setMessages(p=>p.map(m=>m._id===msg._id?{...m,...msg}:m))
    const onDel  = ({messageId}) => setMessages(p=>p.map(m=>m._id===messageId?{...m,deletedAt:new Date(),content:'',attachments:[]}:m))
    const onReact= ({messageId,reactions}) => setMessages(p=>p.map(m=>m._id===messageId?{...m,reactions}:m))
    const onPin  = ({messageId,isPinned})  => setMessages(p=>p.map(m=>m._id===messageId?{...m,isPinned}:m))
    const onType = ({userId:uid,name,channel}) => { if(channel===activeChannel&&uid!==user?._id?.toString()) setTypingUsers(p=>p.includes(name)?p:[...p,name]) }
    const onStop = () => setTypingUsers([])
    const onOnline = ({members}) => setOnlineMembers(members.map(String))
    const onPresence = ({userId,status}) => { const s=String(userId); setOnlineMembers(p=>status==='online'?(p.includes(s)?p:[...p,s]):p.filter(u=>u!==s)) }

    sock.on('new_message',onMsg); sock.on('message_edited',onEdit); sock.on('message_deleted',onDel)
    sock.on('reaction_updated',onReact); sock.on('message_pinned',onPin)
    sock.on('user_typing',onType); sock.on('user_stop_typing',onStop)
    const onLockChanged = ({channelName, isLocked}) => {
      setLockedChannels(p => ({...p, [channelName]: isLocked}))
      setChannels(p => p.map(c => c.name===channelName ? {...c, isLocked} : c))
    }
    sock.on('channel_locked',    (d) => toast.error(d.message||'Channel is locked'))
    sock.on('channel_lock_changed', onLockChanged)
    sock.on('online_members',onOnline); sock.on('presence_update',onPresence)

    // fix: rename conflict
    return () => {
      sock.off('new_message',onMsg); sock.off('message_edited',onEdit); sock.off('message_deleted',onDel)
      sock.off('reaction_updated',onReact); sock.off('message_pinned',onPin)
      sock.off('user_typing',onType); sock.off('user_stop_typing',onStop)
      sock.off('channel_locked')
      sock.off('channel_lock_changed', onLockChanged)
      sock.off('online_members',onOnline); sock.off('presence_update',onPresence)
    }
  }, [socketReady, activeChannel, id, user?._id])

  // ── Load messages ────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    setMsgLoading(true); setMessages([])
    api.get(`/teams/${id}/messages?channel=${encodeURIComponent(activeChannel)}&limit=60`)
      .then(r=>setMessages(r.data.data||[])).finally(()=>setMsgLoading(false))
  }, [id, activeChannel])

  useEffect(() => { if(showPinned) api.get(`/teams/${id}/messages/pinned?channel=${activeChannel}`).then(r=>setPinnedMsgs(r.data.data||[])) }, [showPinned,id,activeChannel])
  useEffect(() => { if(showFiles)  api.get(`/teams/${id}/files`).then(r=>setSharedFiles(r.data.data||[])) }, [showFiles,id])
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages])

  const handleTyping = (val) => {
    setInput(val)
    socketRef.current?.emit('typing_start',{teamId:id,name:user?.name,channel:activeChannel})
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(()=>{ socketRef.current?.emit('typing_stop',{teamId:id,channel:activeChannel}); setTypingUsers([]) }, 1500)
  }

  const toggleChannelLock = async (ch) => {
    try {
      const r = await api.put(`/teams/${id}/channels/${ch._id}/lock`)
      const newLocked = r.data.data.isLocked
      setLockedChannels(p => ({...p, [ch.name]: newLocked}))
      setChannels(p => p.map(c => c._id===ch._id ? {...c, isLocked: newLocked} : c))
      toast.success(`#${ch.name} ${newLocked ? 'locked — only admin can post' : 'unlocked — everyone can post'}`)
    } catch { toast.error('Failed to toggle lock') }
  }

  const sendMessage = async () => {
    const content = input.trim()
    if (!content && files.length===0) return
    socketRef.current?.emit('typing_stop',{teamId:id,channel:activeChannel})
    setInput('')
    if (files.length > 0) {
      setUploading(true)
      try {
        const fd = new FormData()
        files.forEach(f=>fd.append('files',f))
        fd.append('channel',activeChannel); fd.append('content',content)
        await api.post(`/teams/${id}/messages/upload`,fd,{headers:{'Content-Type':'multipart/form-data'}})
        setFiles([])
      } catch { toast.error('Upload failed') } finally { setUploading(false) }
    } else {
      if (!socketRef.current?.connected) {
        const sock = initSocket(localStorage.getItem('token'))
        socketRef.current = sock; window._teamSocket = sock
        await new Promise(r=>setTimeout(r,800))
      }
      socketRef.current?.emit('team_message',{teamId:id,channel:activeChannel,content,replyTo:replyTo?._id||null,type:'text'})
    }
    setReplyTo(null)
  }

  const handleReact  = (msgId,emoji) => socketRef.current?.emit('add_reaction',{messageId:msgId,emoji,teamId:id})
  const handlePin    = (msgId)       => socketRef.current?.emit('pin_message',{messageId:msgId,teamId:id})
  const handleDelete = (msgId)       => setMessages(p=>p.map(m=>m._id===msgId?{...m,deletedAt:new Date(),content:'',attachments:[]}:m))

  const addChannel = async () => {
    const name = newChannel.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')
    if (!name) return
    try {
      const r = await api.post(`/teams/${id}/channels`,{name,type:'text'})
      setChannels(p=>[...p,r.data.data]); setNewChannel(''); setChannelModal(false); toast.success(`#${name} created`)
    } catch(e){ toast.error(e?.response?.data?.message||'Failed') }
  }

  const CH_ICON = { text:<Hash size={14}/>, announcement:<Volume2 size={14}/> }

  if (loading) return (
    <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto"/>
        <p className="text-zinc-400 text-sm">Loading team…</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Link to="/admin/teams" className="btn-secondary p-2.5"><ArrowLeft size={16}/></Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{team?.name}</h1>
          <p className="text-sm text-zinc-400">{team?.members?.length||0} members · Admin chat view</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs">
          {socketReady
            ? <span className="flex items-center gap-1 text-emerald-600"><Wifi size={13}/>Connected</span>
            : <span className="flex items-center gap-1 text-zinc-400 animate-pulse"><WifiOff size={13}/>Connecting…</span>}
        </div>
      </div>

      {/* Teams UI */}
      <div className="flex h-[calc(100vh-11rem)] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg">

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{width:0}} animate={{width:240}} exit={{width:0}} transition={{duration:.2}}
              className="flex-shrink-0 flex flex-col overflow-hidden" style={{background:'#18181b',borderRight:'1px solid #27272a'}}>
              <div className="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{team?.name?.[0]?.toUpperCase()}</div>
                  <div className="min-w-0 flex-1"><p className="text-white font-bold text-sm truncate">{team?.name}</p><p className="text-zinc-500 text-xs">Admin View</p></div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-2 hide-scrollbar">
                <div className="px-3 mb-1 flex items-center justify-between py-1">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Channels</span>
                  <button onClick={()=>setChannelModal(true)} className="text-zinc-500 hover:text-white transition-colors p-0.5 rounded"><Plus size={13}/></button>
                </div>
                {channels.map(ch=>(
                  <button key={ch._id||ch.name} onClick={()=>setActiveChannel(ch.name)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg mx-1 transition-all ${activeChannel===ch.name?'bg-zinc-700 text-white':'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                    style={{width:'calc(100% - 8px)'}}>
                    <span className="flex-shrink-0">{CH_ICON[ch.type]||<Hash size={14}/>}</span>
                    <span className="truncate flex-1">{ch.name}</span>
                    {lockedChannels[ch.name] && <Lock size={10} className="flex-shrink-0 text-amber-400 ml-1"/>}
                  </button>
                ))}

                <div className="px-3 mt-3 mb-1">
                  <button onClick={()=>setShowMembers(!showMembers)} className="flex items-center justify-between w-full py-1 text-xs font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors">
                    <span>Members ({team?.members?.length||0})</span>
                    <ChevronRight size={12} className={`transition-transform ${showMembers?'rotate-90':''}`}/>
                  </button>
                </div>
                {showMembers && team?.members?.map(m=>{
                  const uid=m.user?._id?.toString()||m._id?.toString()
                  const isOnline=onlineMembers.includes(uid)
                  const isLeader=team.leader?._id?.toString()===m._id?.toString()
                  return (
                    <div key={m._id} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-zinc-800 rounded-lg mx-1 transition-colors" style={{width:'calc(100% - 8px)'}}>
                      <div className="relative flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-violet-600/30 flex items-center justify-center text-xs font-bold text-violet-300 overflow-hidden">
                          {m.user?.avatar?<img src={m.user.avatar} className="w-full h-full object-cover" alt=""/>:m.user?.name?.[0]}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${isOnline?'bg-emerald-400':'bg-zinc-600'}`}/>
                      </div>
                      <span className="truncate flex-1 text-xs text-zinc-400">{m.user?.name}</span>
                      {isLeader && <Crown size={10} className="text-amber-400 flex-shrink-0"/>}
                    </div>
                  )
                })}
              </div>

              {/* Admin user strip */}
              <div className="px-3 py-3 border-t border-zinc-800 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-600/40 flex items-center justify-center text-xs font-bold text-indigo-300">{user?.name?.[0]}</div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-zinc-900"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                    <p className="text-indigo-400 text-xs">Admin</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950">
          {/* Header */}
          <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 flex-shrink-0 bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <ChevronRight size={16} className={`transition-transform ${sidebarOpen?'rotate-180':''}`}/>
              </button>
              <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                {CH_ICON[channels.find(c=>c.name===activeChannel)?.type]||<Hash size={16}/>}
                <span className="font-bold text-sm">{activeChannel}</span>
              </div>
              {typingUsers.length>0 && <span className="text-xs text-violet-500 italic animate-pulse ml-2">{typingUsers.slice(0,2).join(', ')} typing…</span>}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={()=>{setShowPinned(!showPinned);setShowFiles(false)}} className={`p-2 rounded-lg transition-colors ${showPinned?'bg-amber-100 dark:bg-amber-950/30 text-amber-600':'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300'}`} title="Pinned"><Pin size={16}/></button>
              <button onClick={()=>{setShowFiles(!showFiles);setShowPinned(false)}} className={`p-2 rounded-lg transition-colors ${showFiles?'bg-violet-100 dark:bg-violet-950/30 text-violet-600':'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300'}`} title="Files"><FolderOpen size={16}/></button>
              <button onClick={()=>{ const ch=channels.find(c=>c.name===activeChannel); if(ch) toggleChannelLock(ch) }}
                className={`p-2 rounded-lg transition-colors ${lockedChannels[activeChannel]?'bg-amber-100 dark:bg-amber-950/30 text-amber-600':'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                title={lockedChannels[activeChannel]?'Unlock channel (allow all)':'Lock channel (admin only)'}>
                {lockedChannels[activeChannel] ? <Lock size={16}/> : <Unlock size={16}/>}
              </button>
            </div>
          </div>

          {/* Pinned panel */}
          <AnimatePresence>
            {showPinned && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                className="border-b border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 flex-shrink-0">
                <div className="px-4 py-3 max-h-32 overflow-y-auto">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1"><Pin size={11}/>Pinned</p>
                  {pinnedMsgs.length===0 ? <p className="text-xs text-amber-500">No pinned messages</p>
                    : pinnedMsgs.map(m=><div key={m._id} className="text-xs text-amber-800 dark:text-amber-300 mb-1 flex gap-2"><span className="font-bold">{m.sender?.name}:</span><span className="line-clamp-1">{m.content}</span></div>)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Files panel */}
          <AnimatePresence>
            {showFiles && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                className="border-b border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/20 flex-shrink-0">
                <div className="px-4 py-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-bold text-violet-700 dark:text-violet-400 mb-1.5 flex items-center gap-1"><FolderOpen size={11}/>Files</p>
                  {sharedFiles.length===0 ? <p className="text-xs text-violet-500">No files shared yet</p>
                    : sharedFiles.flatMap(m=>m.attachments?.map((att,i)=>(
                      <a key={`${m._id}-${i}`} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-violet-700 dark:text-violet-300 mb-1.5 hover:underline">
                        <FileIcon mime={att.mimeType}/><span className="truncate flex-1">{att.name}</span><Download size={11}/>
                      </a>
                    ))||[])}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-0.5">
            {msgLoading ? (
              <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin"/></div>
            ) : messages.length===0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center mb-3"><Hash size={24} className="text-violet-400"/></div>
                <p className="font-bold text-zinc-700 dark:text-zinc-300">#{activeChannel}</p>
                <p className="text-sm text-zinc-400 mt-1">No messages yet. Start the conversation!</p>
              </div>
            ) : messages.map((msg,i)=>{
              const senderId = msg.sender?._id?.toString()||msg.sender?.toString()
              const myId     = user?._id?.toString()
              const isMine   = senderId===myId
              const prev     = messages[i-1]
              const grouped  = (prev?.sender?._id?.toString()||prev?.sender?.toString())===senderId && new Date(msg.createdAt)-new Date(prev?.createdAt)<300000
              return (
                <div key={msg._id||i}>
                  {!grouped && i>0 && <div className="h-2"/>}
                  <MessageBubble msg={msg} isMine={isMine} onReact={handleReact} onReply={setReplyTo}
                    onDelete={handleDelete} onPin={handlePin} userId={myId} teamId={id}/>
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </div>

          {/* Reply preview */}
          <AnimatePresence>
            {replyTo && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                className="flex items-center gap-3 px-4 py-2.5 bg-violet-50 dark:bg-violet-950/20 border-t border-violet-200 dark:border-violet-900 flex-shrink-0">
                <div className="flex-1 border-l-2 border-violet-500 pl-2">
                  <p className="text-xs font-bold text-violet-600">Replying to {replyTo.sender?.name}</p>
                  <p className="text-xs text-zinc-500 line-clamp-1">{replyTo.content}</p>
                </div>
                <button onClick={()=>setReplyTo(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex-shrink-0"><X size={15}/></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File preview */}
          <AnimatePresence>
            {files.length>0 && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                className="flex gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex-wrap flex-shrink-0">
                {files.map((f,i)=>(
                  <div key={i} className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs">
                    <FileIcon mime={f.type}/><span className="max-w-[100px] truncate">{f.name}</span>
                    <button onClick={()=>setFiles(files.filter((_,j)=>j!==i))} className="text-zinc-400 hover:text-red-500 ml-1"><X size={11}/></button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="flex-shrink-0 px-4 pb-4 pt-2">
            <div className="flex items-end gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-3 py-2.5 focus-within:border-indigo-400 dark:focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-200 dark:focus-within:ring-indigo-900/50 transition-all">
              <button type="button" onClick={()=>fileInputRef.current?.click()}
                className="text-zinc-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 mb-0.5 flex-shrink-0" title="Attach">
                <Paperclip size={17}/>
              </button>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e=>setFiles(Array.from(e.target.files))}/>
              <textarea value={input} onChange={e=>handleTyping(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}}}
                placeholder={`Message #${activeChannel} as Admin…`} rows={1}
                className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none resize-none placeholder:text-zinc-400 leading-5 max-h-28 overflow-y-auto py-1"/>
              <button onClick={sendMessage} disabled={(!input.trim()&&files.length===0)||uploading}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white flex items-center justify-center transition-colors disabled:cursor-not-allowed mb-0.5">
                {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={15}/>}
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 px-1">{lockedChannels[activeChannel] ? <span className="text-amber-600">Channel locked — students cannot post here</span> : "Admin messages appear with indigo bubble"} · Enter to send</p>
          </div>
        </div>

        {/* Right members panel */}
        <AnimatePresence>
          {showMembers && (
            <motion.div initial={{width:0,opacity:0}} animate={{width:200,opacity:1}} exit={{width:0,opacity:0}} transition={{duration:.2}}
              className="border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden flex-shrink-0">
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Members</h3>
                  <p className="text-xs text-emerald-500">{onlineMembers.length} online</p>
                </div>
                <button onClick={()=>setShowMembers(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"><X size={14}/></button>
              </div>
              <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 hide-scrollbar">
                {team?.members?.map(m=>{
                  const uid=m.user?._id?.toString()||m._id?.toString()
                  const isOnline=onlineMembers.includes(uid)
                  const isLeader=team.leader?._id?.toString()===m._id?.toString()
                  return (
                    <div key={m._id} className={`flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${!isOnline?'opacity-50':''}`}>
                      <div className="relative flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-300 overflow-hidden">
                          {m.user?.avatar?<img src={m.user.avatar} className="w-full h-full object-cover" alt=""/>:m.user?.name?.[0]}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${isOnline?'bg-emerald-400':'bg-zinc-400'}`}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{m.user?.name}</p>
                        <p className="text-xs text-zinc-400">{isOnline?'Online':'Offline'}</p>
                      </div>
                      {isLeader && <Crown size={10} className="text-amber-400 flex-shrink-0"/>}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add channel modal */}
      <AnimatePresence>
        {channelModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setChannelModal(false)}>
            <motion.div initial={{scale:.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.95,opacity:0}}
              onClick={e=>e.stopPropagation()} className="card w-full max-w-sm p-6">
              <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Add Channel</h3>
              <input value={newChannel} onChange={e=>setNewChannel(e.target.value)} className="input mb-4" placeholder="channel-name"
                onKeyDown={e=>e.key==='Enter'&&addChannel()} autoFocus/>
              <div className="flex gap-3">
                <button onClick={()=>setChannelModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={addChannel} className="btn-primary flex-1">Create</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
