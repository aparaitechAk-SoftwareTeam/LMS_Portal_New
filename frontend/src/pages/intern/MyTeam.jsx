import { useEffect, useState, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  Hash, Volume2, Plus, Search, Send, Paperclip, Smile,
  Video, Users, Pin, X, Edit3, Trash2, Crown,
  ChevronDown, ChevronRight, FolderOpen, Settings,
  Download, Image as ImageIcon, FileText, Archive,
  MessageSquare, Wifi, WifiOff
} from 'lucide-react'
import api from '../../services/api'
import { initSocket, waitForSocket, getSocket } from '../../socket/socket'
import { motion, AnimatePresence } from 'framer-motion'
import { Empty } from '../../components/common/index'
import { COMPANY_NAME } from '../../utils/constants'
import toast from 'react-hot-toast'
import { useSelector as useReduxSelector } from 'react-redux'

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (d) => {
  if (!d) return ''
  const date = new Date(d), now = new Date(), diff = now - date
  if (diff < 60000)    return 'just now'
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const getTeamId = (internData) => {
  if (!internData?.team) return null
  if (typeof internData.team === 'string') return internData.team
  if (typeof internData.team === 'object') return internData.team._id?.toString() || internData.team.toString()
  return null
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥', '✅', '🎉', '💯', '⚡']

// ── FileIcon ─────────────────────────────────────────────────────────────────
const FileIcon = ({ mime }) => {
  if (mime?.startsWith('image/')) return <ImageIcon size={15} className="text-violet-500" />
  if (mime?.includes('pdf'))      return <FileText   size={15} className="text-red-500" />
  if (mime?.includes('zip'))      return <Archive    size={15} className="text-amber-500" />
  return <FileText size={15} className="text-zinc-400" />
}

// ── EmojiPicker ───────────────────────────────────────────────────────────────
const EmojiPicker = ({ onPick, onClose }) => {
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])
  return (
    <div ref={ref} className="absolute bottom-8 right-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-3 z-50 flex flex-wrap gap-1.5 w-56">
      {EMOJI_LIST.map(e => (
        <button key={e} type="button" onClick={() => { onPick(e); onClose() }}
          className="text-xl hover:scale-125 transition-transform p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700">
          {e}
        </button>
      ))}
    </div>
  )
}

// ── Message Bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isMine, onReact, onReply, onDelete, onPin, userId, teamId }) => {
  const [showActions, setShowActions] = useState(false)
  const [showEmoji,   setShowEmoji]   = useState(false)
  const [editing,     setEditing]     = useState(false)
  const [editVal,     setEditVal]     = useState(msg.content || '')
  const isDeleted = !!msg.deletedAt

  const handleEdit = () => {
    if (!editVal.trim()) return
    const socket = getSocket()
    socket?.emit('edit_message', {
      messageId: msg._id,
      content:   editVal,
      teamId:    teamId,
    })
    setEditing(false)
  }

  const handleDelete = () => {
    if (!confirm('Delete this message?')) return
    const socket = getSocket()
    socket?.emit('delete_message', { messageId: msg._id, teamId })
    onDelete(msg._id)
  }

  return (
    <div
      className={`group flex gap-3 px-3 py-1.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${isMine ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmoji(false) }}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-xs font-bold text-violet-700 dark:text-violet-300 flex-shrink-0 mt-0.5 overflow-hidden">
        {msg.sender?.avatar
          ? <img src={msg.sender.avatar} className="w-full h-full object-cover" alt="" />
          : (msg.sender?.name?.[0] || '?')}
      </div>

      <div className={`flex-1 min-w-0 flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Name + time */}
        <div className={`flex items-baseline gap-2 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            {isMine ? 'You' : (msg.sender?.name || 'Unknown')}
          </span>
          <span className="text-xs text-zinc-400">{fmt(msg.createdAt)}</span>
          {msg.isPinned  && <Pin  size={10} className="text-amber-500" />}
          {msg.edited    && <span className="text-xs text-zinc-400 italic">(edited)</span>}
        </div>

        {/* Reply quote */}
        {msg.replyTo && (
          <div className={`mb-1 pl-2 border-l-2 border-violet-400 text-xs text-zinc-400 max-w-xs truncate ${isMine ? 'text-right pl-0 pr-2 border-l-0 border-r-2' : ''}`}>
            <span className="font-semibold text-zinc-500">{msg.replyTo?.sender?.name || 'User'}: </span>
            {String(msg.replyTo?.content || '').slice(0, 80)}
          </div>
        )}

        {/* Bubble */}
        {isDeleted ? (
          <div className="text-xs text-zinc-400 italic px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
            This message was deleted
          </div>
        ) : editing ? (
          <div className="flex gap-2 w-full max-w-sm">
            <input value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus
              className="input flex-1 text-sm py-1.5"
              onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setEditing(false) }} />
            <button onClick={handleEdit}  className="btn-primary text-xs px-3 py-1.5">Save</button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-xs px-3 py-1.5">✕</button>
          </div>
        ) : (
          <div className={`max-w-sm lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words
            ${isMine
              ? 'bg-violet-600 text-white rounded-tr-none shadow-md shadow-violet-500/20'
              : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-tl-none shadow-sm'}`}>
            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

            {/* Attachments */}
            {msg.attachments?.length > 0 && (
              <div className="mt-2 space-y-2">
                {msg.attachments.map((att, i) =>
                  att.mimeType?.startsWith('image/') ? (
                    <a key={i} href={att.url} target="_blank" rel="noreferrer">
                      <img src={att.url} alt={att.name} className="rounded-xl max-h-48 max-w-full object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                    </a>
                  ) : (
                    <a key={i} href={att.url} target="_blank" rel="noreferrer"
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-xs transition-colors
                        ${isMine ? 'bg-white/20 hover:bg-white/30' : 'bg-zinc-50 dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600'}`}>
                      <FileIcon mime={att.mimeType} />
                      <span className="flex-1 truncate font-medium">{att.name}</span>
                      <Download size={12} className="flex-shrink-0" />
                    </a>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Reactions */}
        {msg.reactions?.filter(r => r.users?.length > 0).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {msg.reactions.filter(r => r.users?.length > 0).map(r => (
              <button key={r.emoji} onClick={() => onReact(msg._id, r.emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all
                  ${r.users?.some(u => u === userId || u?._id === userId || u?.toString() === userId?.toString())
                    ? 'bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-violet-50 dark:hover:bg-violet-950/30'}`}>
                {r.emoji} <span className="font-bold">{r.users?.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {showActions && !isDeleted && !editing && (
        <div className={`flex items-center gap-0.5 self-start mt-1.5 flex-shrink-0 ${isMine ? 'order-first mr-1' : 'order-last ml-1'}`}>
          <div className="relative">
            <button type="button" onClick={() => setShowEmoji(!showEmoji)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" title="React">
              <Smile size={14} />
            </button>
            {showEmoji && <EmojiPicker onPick={e => onReact(msg._id, e)} onClose={() => setShowEmoji(false)} />}
          </div>
          <button type="button" onClick={() => onReply(msg)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors" title="Reply">
            <MessageSquare size={14} />
          </button>
          <button type="button" onClick={() => onPin(msg._id)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors" title="Pin">
            <Pin size={14} />
          </button>
          {isMine && (
            <>
              <button type="button" onClick={() => { setEditing(true); setShowActions(false) }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-colors" title="Edit">
                <Edit3 size={14} />
              </button>
              <button type="button" onClick={handleDelete}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors" title="Delete">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MyTeam() {
  const { user, internData } = useSelector(s => s.auth)

  const teamId = getTeamId(internData)

  const [team,          setTeam]          = useState(null)
  const [channels,      setChannels]      = useState([])
  const [activeChannel, setActiveChannel] = useState('general')
  const [messages,      setMessages]      = useState([])
  const [msgLoading,    setMsgLoading]    = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [input,         setInput]         = useState('')
  const [replyTo,       setReplyTo]       = useState(null)
  const [typingUsers,   setTypingUsers]   = useState([])
  const [onlineMembers, setOnlineMembers] = useState([])
  const [pinnedMsgs,    setPinnedMsgs]    = useState([])
  const [showPinned,    setShowPinned]    = useState(false)
  const [showMembers,   setShowMembers]   = useState(true)
  const [showFiles,     setShowFiles]     = useState(false)
  const [sharedFiles,   setSharedFiles]   = useState([])
  const [files,         setFiles]         = useState([])
  const [uploading,     setUploading]     = useState(false)
  const [searchQuery,   setSearchQuery]   = useState('')
  const [channelModal,  setChannelModal]  = useState(false)
  const [newChannel,    setNewChannel]    = useState('')
  const [sidebarOpen,   setSidebarOpen]   = useState(true)
  const [socketReady,   setSocketReady]   = useState(false)
  const [error,         setError]         = useState(null)
  const [lockedChannels,setLockedChannels]= useState({})

  const bottomRef    = useRef(null)
  const typingTimer  = useRef(null)
  const fileInputRef = useRef(null)
  const socketRef    = useRef(null)

  // ── Load team data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!teamId) { setLoading(false); return }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        // ensure channels exist (for old teams created before channels feature)
        const [tRes, chRes] = await Promise.all([
          api.get(`/teams/${teamId}`),
          api.post(`/teams/${teamId}/ensure-channels`),
        ])
        setTeam(tRes.data.data)
        const chs = chRes.data.data || []
        setChannels(chs)
        // set default active channel
        const lockMap = {}; chs.forEach(c => { lockMap[c.name] = c.isLocked||false }); setLockedChannels(lockMap)
        const defaultCh = chs.find(c => c.name === 'general') || chs[0]
        if (defaultCh) setActiveChannel(defaultCh.name)
      } catch (e) {
        console.error('Team load error:', e)
        setError('Failed to load team. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [teamId])

  // ── Init socket and join team room ──────────────────────────────────────
  useEffect(() => {
    if (!teamId || !user) return

    const token = localStorage.getItem('token')
    const sock  = initSocket(token)
    socketRef.current = sock

    const onConnect = () => {
      setSocketReady(true)
      sock.emit('join_team', teamId)
      sock.emit('get_online_members', teamId)
    }

    if (sock.connected) onConnect()
    else sock.on('connect', onConnect)

    sock.on('disconnect', () => setSocketReady(false))
    sock.on('reconnect',  () => {
      setSocketReady(true)
      sock.emit('join_team', teamId)
      sock.emit('get_online_members', teamId)
    })

    return () => {
      sock.off('connect', onConnect)
      sock.emit('leave_team', teamId)
    }
  }, [teamId, user?._id])

  // ── Socket event listeners ──────────────────────────────────────────────
  useEffect(() => {
    const sock = socketRef.current
    if (!sock) return

    const onNewMessage = (msg) => {
      if (msg.channel === activeChannel && msg.team?.toString() === teamId) {
        setMessages(prev => {
          // avoid duplicates
          if (prev.find(m => m._id === msg._id)) return prev
          return [...prev, msg]
        })
      }
    }
    const onEdited   = (msg)              => setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, ...msg } : m))
    const onDeleted  = ({ messageId })    => setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deletedAt: new Date(), content: 'This message was deleted', attachments: [] } : m))
    const onReaction = ({ messageId, reactions }) => setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m))
    const onPinned   = ({ messageId, isPinned }) => setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isPinned } : m))

    const onTypingStart = ({ userId: uid, name, channel }) => {
      if (channel === activeChannel && uid !== user?._id?.toString())
        setTypingUsers(prev => prev.includes(name) ? prev : [...prev, name])
    }
    const onTypingStop = ({ userId: uid }) => {
      setTypingUsers(prev => prev.filter((_, i) => i !== 0)) // simplistic clear
    }

    const onOnlineMembers  = ({ members })         => setOnlineMembers(members.map(String))
    const onMemberOnline   = ({ userId })          => setOnlineMembers(prev => { const s = String(userId); return prev.includes(s) ? prev : [...prev, s] })
    sock.on('channel_locked', (d) => {
      toast.error(d.message || 'This channel is locked by admin')
    })
    sock.on('channel_lock_changed', ({channelName, isLocked}) => {
      setLockedChannels(p => ({...p, [channelName]: isLocked}))
      setChannels(p => p.map(c => c.name===channelName ? {...c, isLocked} : c))
      if (isLocked) toast(`#${channelName} has been locked by admin`, {icon:'🔒'})
      else toast(`#${channelName} is now open for everyone`, {icon:'🔓'})
    })

    const onPresenceUpdate = ({ userId, status }) => {
      const s = String(userId)
      setOnlineMembers(prev => status === 'online' ? (prev.includes(s) ? prev : [...prev, s]) : prev.filter(id => id !== s))
    }

    sock.on('new_message',     onNewMessage)
    sock.on('message_edited',  onEdited)
    sock.on('message_deleted', onDeleted)
    sock.on('reaction_updated',onReaction)
    sock.on('message_pinned',  onPinned)
    sock.on('user_typing',     onTypingStart)
    sock.on('user_stop_typing',onTypingStop)
    sock.on('online_members',  onOnlineMembers)
    sock.on('member_online',   onMemberOnline)
    sock.on('presence_update', onPresenceUpdate)

    return () => {
      sock.off('new_message',     onNewMessage)
      sock.off('message_edited',  onEdited)
      sock.off('message_deleted', onDeleted)
      sock.off('reaction_updated',onReaction)
      sock.off('message_pinned',  onPinned)
      sock.off('channel_locked')
    sock.off('channel_lock_changed')
    sock.off('user_typing',     onTypingStart)
      sock.off('user_stop_typing',onTypingStop)
      sock.off('online_members',  onOnlineMembers)
      sock.off('member_online',   onMemberOnline)
      sock.off('presence_update', onPresenceUpdate)
    }
  }, [socketRef.current, activeChannel, teamId, user?._id])

  // ── Load messages when channel changes ─────────────────────────────────
  useEffect(() => {
    if (!teamId) return
    setMsgLoading(true)
    setMessages([])
    api.get(`/teams/${teamId}/messages?channel=${encodeURIComponent(activeChannel)}&limit=60`)
      .then(r => setMessages(r.data.data || []))
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false))
  }, [teamId, activeChannel])

  // ── Load pinned ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!teamId || !showPinned) return
    api.get(`/teams/${teamId}/messages/pinned?channel=${activeChannel}`)
      .then(r => setPinnedMsgs(r.data.data || []))
  }, [showPinned, teamId, activeChannel])

  // ── Load shared files ───────────────────────────────────────────────────
  useEffect(() => {
    if (!teamId || !showFiles) return
    api.get(`/teams/${teamId}/files`).then(r => setSharedFiles(r.data.data || []))
  }, [showFiles, teamId])

  // ── Auto scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Typing indicator ────────────────────────────────────────────────────
  const handleTyping = (val) => {
    setInput(val)
    if (!teamId) return
    socketRef.current?.emit('typing_start', { teamId, name: user?.name, channel: activeChannel })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', { teamId, channel: activeChannel })
      setTypingUsers([])
    }, 1500)
  }

  // ── Send message ────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const content = input.trim()
    if (!content && files.length === 0) return
    if (!teamId) return

    socketRef.current?.emit('typing_stop', { teamId, channel: activeChannel })
    setInput('')

    if (files.length > 0) {
      setUploading(true)
      try {
        const fd = new FormData()
        files.forEach(f => fd.append('files', f))
        fd.append('channel', activeChannel)
        fd.append('content', content)
        await api.post(`/teams/${teamId}/messages/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        setFiles([])
      } catch { toast.error('File upload failed') } finally { setUploading(false) }
    } else {
      if (!socketRef.current?.connected) {
        toast.error('Not connected. Reconnecting…')
        const token = localStorage.getItem('token')
        const sock  = initSocket(token)
        socketRef.current = sock
        await waitForSocket()
      }
      socketRef.current?.emit('team_message', {
        teamId,
        channel:  activeChannel,
        content,
        replyTo:  replyTo?._id || null,
        type:     'text',
      })
    }
    setReplyTo(null)
  }

  const handleReact  = (msgId, emoji) => socketRef.current?.emit('add_reaction', { messageId: msgId, emoji, teamId })
  const handlePin    = (msgId)        => socketRef.current?.emit('pin_message',   { messageId: msgId, teamId })
  const handleDelete = (msgId)        => setMessages(prev => prev.map(m => m._id === msgId ? { ...m, deletedAt: new Date(), content: 'This message was deleted', attachments: [] } : m))

  const addChannel = async () => {
    const name = newChannel.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (!name) return
    try {
      const r = await api.post(`/teams/${teamId}/channels`, { name, type: 'text' })
      setChannels(prev => [...prev, r.data.data])
      setNewChannel(''); setChannelModal(false)
      toast.success(`#${name} created`)
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed') }
  }

  const startMeeting = () => {
    const url = `https://meet.google.com/new`
    window.open(url, '_blank')
    socketRef.current?.emit('start_call', { teamId, callerName: user?.name, meetUrl: url })
    toast.success('Meeting started! Link shared with the team.')
  }

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages

  const CH_ICON = { text: <Hash size={14} />, announcement: <Volume2 size={14} /> }

  // ── Loading / error / no-team states ───────────────────────────────────
  if (loading) return (
    <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto" />
        <p className="text-zinc-400 text-sm">Loading your team workspace…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto">
          <WifiOff size={24} className="text-red-500" />
        </div>
        <p className="font-bold text-zinc-800 dark:text-zinc-200">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary text-sm">Retry</button>
      </div>
    </div>
  )

  if (!teamId || !team) return (
    <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
      <Empty
        title="You are not in a team yet"
        description="Ask your admin to assign you to a team. Once assigned, you can collaborate here with your teammates."
        icon={Users}
      />
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-5rem)] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-950">

      {/* ── LEFT SIDEBAR ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0 }} animate={{ width: 240 }} exit={{ width: 0 }}
            transition={{ duration: .2 }}
            className="flex-shrink-0 flex flex-col overflow-hidden"
            style={{ background: '#18181b', borderRight: '1px solid #27272a' }}>

            {/* Team header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-lg shadow-violet-600/30">
                  {team?.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold text-sm truncate">{team?.name}</p>
                  <p className="text-zinc-500 text-xs">{team?.members?.length || 0} members</p>
                </div>
                {/* Connection indicator */}
                <div title={socketReady ? 'Connected' : 'Connecting…'}>
                  {socketReady
                    ? <Wifi size={13} className="text-emerald-500 flex-shrink-0" />
                    : <WifiOff size={13} className="text-zinc-600 flex-shrink-0 animate-pulse" />}
                </div>
              </div>
            </div>

            {/* Channels */}
            <div className="flex-1 overflow-y-auto py-2 hide-scrollbar">
              <div className="px-3 mb-1 flex items-center justify-between py-1">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Channels</span>
                <button onClick={() => setChannelModal(true)} className="text-zinc-500 hover:text-white transition-colors p-0.5 rounded">
                  <Plus size={13} />
                </button>
              </div>
              {channels.map(ch => (
                <button key={ch._id || ch.name} onClick={() => setActiveChannel(ch.name)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg mx-1 transition-all
                    ${activeChannel === ch.name ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                  style={{ width: 'calc(100% - 8px)' }}>
                  <span className="flex-shrink-0">{CH_ICON[ch.type] || <Hash size={14} />}</span>
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}

              {/* Members */}
              <div className="px-3 mt-3 mb-1">
                <button onClick={() => setShowMembers(!showMembers)}
                  className="flex items-center justify-between w-full py-1 text-xs font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors">
                  <span>Members — {onlineMembers.length} online</span>
                  <ChevronRight size={12} className={`transition-transform ${showMembers ? 'rotate-90' : ''}`} />
                </button>
              </div>
              {showMembers && team?.members?.map(m => {
                const uid       = m.user?._id?.toString() || m._id?.toString()
                const isOnline  = onlineMembers.includes(uid)
                const isLeader  = team.leader?._id?.toString() === m._id?.toString()
                return (
                  <div key={m._id} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-zinc-800 rounded-lg mx-1 transition-colors cursor-default"
                    style={{ width: 'calc(100% - 8px)' }}>
                    <div className="relative flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-violet-600/30 flex items-center justify-center text-xs font-bold text-violet-300 overflow-hidden">
                        {m.user?.avatar ? <img src={m.user.avatar} className="w-full h-full object-cover" alt="" /> : m.user?.name?.[0]}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${isOnline ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    </div>
                    <span className="truncate flex-1 text-xs text-zinc-400">{m.user?.name}</span>
                    {isLeader && <Crown size={10} className="text-amber-400 flex-shrink-0" />}
                  </div>
                )
              })}
            </div>

            {/* Current user strip */}
            <div className="px-3 py-3 border-t border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-violet-600/30 flex items-center justify-center text-xs font-bold text-violet-300">
                    {user?.name?.[0]}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-zinc-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
                  <p className="text-emerald-400 text-xs">● Active</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CHAT AREA ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950">

        {/* Channel header */}
        <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 flex-shrink-0 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ChevronRight size={16} className={`transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              {CH_ICON[channels.find(c => c.name === activeChannel)?.type] || <Hash size={16} />}
              <span className="font-bold text-sm">{activeChannel}</span>
              {lockedChannels[activeChannel] && <span className="flex items-center gap-1 ml-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full"><Lock size={10}/>Locked</span>}
            </div>
            {typingUsers.length > 0 && (
              <span className="text-xs text-violet-500 italic animate-pulse ml-2">
                {typingUsers.slice(0, 2).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Search */}
            <div className="relative hidden sm:block mr-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="input pl-8 py-1.5 text-xs w-32 focus:w-44 transition-all duration-300" />
            </div>
            <button onClick={() => { setShowPinned(!showPinned); setShowFiles(false) }}
              className={`p-2 rounded-lg transition-colors ${showPinned ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300'}`} title="Pinned">
              <Pin size={16} />
            </button>
            <button onClick={() => { setShowFiles(!showFiles); setShowPinned(false) }}
              className={`p-2 rounded-lg transition-colors ${showFiles ? 'bg-violet-100 dark:bg-violet-950/30 text-violet-600' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300'}`} title="Files">
              <FolderOpen size={16} />
            </button>
            <button onClick={startMeeting}
              className="p-2 rounded-lg text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 transition-colors" title="Start meeting">
              <Video size={16} />
            </button>
            <button onClick={() => setShowMembers(!showMembers)}
              className={`p-2 rounded-lg transition-colors ${showMembers ? 'bg-violet-100 dark:bg-violet-950/30 text-violet-600' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300'}`} title="Members">
              <Users size={16} />
            </button>
          </div>
        </div>

        {/* Pinned panel */}
        <AnimatePresence>
          {showPinned && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-b border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 overflow-hidden flex-shrink-0">
              <div className="px-4 py-3 max-h-36 overflow-y-auto">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1"><Pin size={11} />Pinned Messages</p>
                {pinnedMsgs.length === 0
                  ? <p className="text-xs text-amber-500">No pinned messages in #{activeChannel}</p>
                  : pinnedMsgs.map(m => (
                    <div key={m._id} className="text-xs text-amber-800 dark:text-amber-300 mb-1.5 flex gap-2">
                      <span className="font-bold flex-shrink-0">{m.sender?.name}:</span>
                      <span className="line-clamp-1">{m.content}</span>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Files panel */}
        <AnimatePresence>
          {showFiles && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-b border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/20 overflow-hidden flex-shrink-0">
              <div className="px-4 py-3 max-h-44 overflow-y-auto">
                <p className="text-xs font-bold text-violet-700 dark:text-violet-400 mb-2 flex items-center gap-1"><FolderOpen size={11} />Shared Files</p>
                {sharedFiles.length === 0
                  ? <p className="text-xs text-violet-500">No files shared yet</p>
                  : sharedFiles.flatMap(m => m.attachments?.map((att, i) => (
                    <a key={`${m._id}-${i}`} href={att.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-violet-700 dark:text-violet-300 mb-2 hover:underline">
                      <FileIcon mime={att.mimeType} />
                      <span className="truncate flex-1">{att.name}</span>
                      <span className="text-violet-400 flex-shrink-0 hidden sm:block">{m.sender?.name}</span>
                      <Download size={11} className="flex-shrink-0" />
                    </a>
                  )) || [])
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-0.5">
          {msgLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center mb-4">
                <Hash size={24} className="text-violet-400" />
              </div>
              <p className="font-bold text-zinc-700 dark:text-zinc-300">Welcome to #{activeChannel}</p>
              <p className="text-sm text-zinc-400 mt-1">This is the start of the channel. Send the first message!</p>
            </div>
          ) : (
            filteredMessages.map((msg, i) => {
              const senderId = msg.sender?._id?.toString() || msg.sender?.toString()
              const myId     = user?._id?.toString()
              const isMine   = senderId === myId
              const prev     = filteredMessages[i - 1]
              const prevSenderId = prev?.sender?._id?.toString() || prev?.sender?.toString()
              const grouped  = prevSenderId === senderId && new Date(msg.createdAt) - new Date(prev?.createdAt) < 300000
              return (
                <div key={msg._id || i}>
                  {!grouped && i > 0 && <div className="h-2" />}
                  <MessageBubble
                    msg={msg}
                    isMine={isMine}
                    onReact={handleReact}
                    onReply={setReplyTo}
                    onDelete={handleDelete}
                    onPin={handlePin}
                    userId={myId}
                    teamId={teamId}
                  />
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-3 px-4 py-2.5 bg-violet-50 dark:bg-violet-950/20 border-t border-violet-200 dark:border-violet-900 flex-shrink-0">
              <div className="flex-1 border-l-2 border-violet-500 pl-2">
                <p className="text-xs font-bold text-violet-600">Replying to {replyTo.sender?.name}</p>
                <p className="text-xs text-zinc-500 line-clamp-1">{replyTo.content}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex-shrink-0"><X size={15} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File preview */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="flex gap-2 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex-wrap flex-shrink-0">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs">
                  <FileIcon mime={f.type} />
                  <span className="max-w-[100px] truncate">{f.name}</span>
                  <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-zinc-400 hover:text-red-500 ml-1"><X size={11} /></button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2">
          <div className="flex items-end gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-3 py-2.5 focus-within:border-violet-400 dark:focus-within:border-violet-600 focus-within:ring-2 focus-within:ring-violet-200 dark:focus-within:ring-violet-900/50 transition-all">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="text-zinc-400 hover:text-violet-600 transition-colors p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/20 mb-0.5 flex-shrink-0" title="Attach file">
              <Paperclip size={17} />
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden"
              onChange={e => setFiles(Array.from(e.target.files))} />
            <textarea
              value={input}
              onChange={e => handleTyping(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={lockedChannels[activeChannel] ? `#${activeChannel} is locked by admin` : `Message #${activeChannel}…`}
              rows={1}
              className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none resize-none placeholder:text-zinc-400 leading-5 max-h-28 overflow-y-auto py-1"
            />
            <button onClick={sendMessage}
              disabled={(!input.trim() && files.length === 0) || uploading}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white flex items-center justify-center transition-colors disabled:cursor-not-allowed mb-0.5">
              {uploading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={15} />}
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      {/* ── RIGHT: Members panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showMembers && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ duration: .2 }}
            className="border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden flex-shrink-0">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Members</h3>
              <p className="text-xs text-emerald-500 mt-0.5">{onlineMembers.length} of {team?.members?.length || 0} online</p>
            </div>
            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 hide-scrollbar">
              {team?.members?.map(m => {
                const uid      = m.user?._id?.toString() || m._id?.toString()
                const isOnline = onlineMembers.includes(uid)
                const isLeader = team.leader?._id?.toString() === m._id?.toString()
                return (
                  <div key={m._id} className={`flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${!isOnline ? 'opacity-50' : ''}`}>
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-300 overflow-hidden">
                        {m.user?.avatar ? <img src={m.user.avatar} className="w-full h-full object-cover" alt="" /> : m.user?.name?.[0]}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${isOnline ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{m.user?.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{m.department || (isOnline ? 'Online' : 'Offline')}</p>
                    </div>
                    {isLeader && <Crown size={11} className="text-amber-400 flex-shrink-0" />}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add channel modal */}
      <AnimatePresence>
        {channelModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setChannelModal(false)}>
            <motion.div initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .95, opacity: 0 }}
              onClick={e => e.stopPropagation()} className="card w-full max-w-sm p-6">
              <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Add Channel</h3>
              <input value={newChannel} onChange={e => setNewChannel(e.target.value)}
                className="input mb-4" placeholder="e.g. design-review"
                onKeyDown={e => e.key === 'Enter' && addChannel()} autoFocus />
              <div className="flex gap-3">
                <button onClick={() => setChannelModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={addChannel} className="btn-primary flex-1">Create</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
