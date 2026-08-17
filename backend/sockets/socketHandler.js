const jwt = require('jsonwebtoken');
const { Notification } = require('../models/Others');
const { TeamMessage } = require('../models/TeamChat');

// Track online users: userId -> { socketId, teamIds }
const onlineUsers = new Map();

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.role   = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.userId;
    onlineUsers.set(uid, { socketId: socket.id, teams: [] });
    socket.join(uid);
    io.emit('presence_update', { userId: uid, status: 'online' });

    // ── Notifications ──────────────────────────────────────────
    socket.on('mark_notification_read', async (notifId) => {
      await Notification.findByIdAndUpdate(notifId, { isRead: true, readAt: new Date() }).catch(() => {});
    });
    socket.on('mark_all_read', async () => {
      await Notification.updateMany({ recipient: uid, isRead: false }, { isRead: true, readAt: new Date() }).catch(() => {});
    });

    // ── Team rooms ─────────────────────────────────────────────
    socket.on('join_team', (teamId) => {
      socket.join(`team_${teamId}`);
      const u = onlineUsers.get(uid) || {};
      onlineUsers.set(uid, { ...u, teams: [...(u.teams || []), teamId] });
      // broadcast member is online to team
      io.to(`team_${teamId}`).emit('member_online', { userId: uid, teamId });
    });

    socket.on('leave_team', (teamId) => {
      socket.leave(`team_${teamId}`);
    });

    // ── Chat messages ──────────────────────────────────────────
    socket.on('team_message', async (data) => {
      try {
        const User = require('../models/User');
        const { TeamChannel } = require('../models/TeamChat');

        // Check channel lock — only admin can post in locked channels
        const channel = await TeamChannel.findOne({ team: data.teamId, name: data.channel || 'general' });
        const sender  = await User.findById(uid).select('name avatar role');
        if (channel?.isLocked && sender?.role !== 'admin') {
          socket.emit('channel_locked', { channel: data.channel, message: 'This channel is locked. Only admin can post.' });
          return;
        }

        const msg = await TeamMessage.create({
          team:    data.teamId,
          channel: data.channel || 'general',
          sender:  uid,
          content: data.content,
          type:    data.type || 'text',
          attachments: data.attachments || [],
          replyTo: data.replyTo || null,
        });
        const populated = await TeamMessage.findById(msg._id)
          .populate('sender', 'name avatar role')
          .populate('replyTo', 'content sender');
        io.to(`team_${data.teamId}`).emit('new_message', {
          ...populated.toObject(), channel: data.channel || 'general'
        });
      } catch (e) { console.error('team_message error', e.message); }
    });

    // ── Typing indicator ───────────────────────────────────────
    socket.on('typing_start', (data) => {
      socket.to(`team_${data.teamId}`).emit('user_typing', { userId: uid, name: data.name, channel: data.channel });
    });
    socket.on('typing_stop', (data) => {
      socket.to(`team_${data.teamId}`).emit('user_stop_typing', { userId: uid, channel: data.channel });
    });

    // ── Reactions ─────────────────────────────────────────────
    socket.on('add_reaction', async ({ messageId, emoji, teamId }) => {
      try {
        const msg = await TeamMessage.findById(messageId);
        if (!msg) return;
        const existing = msg.reactions.find(r => r.emoji === emoji);
        if (existing) {
          const idx = existing.users.indexOf(uid);
          if (idx > -1) existing.users.splice(idx, 1);
          else existing.users.push(uid);
          if (existing.users.length === 0) msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
        } else {
          msg.reactions.push({ emoji, users: [uid] });
        }
        await msg.save();
        io.to(`team_${teamId}`).emit('reaction_updated', { messageId, reactions: msg.reactions });
      } catch (e) { console.error('reaction error', e.message); }
    });

    // ── Message edit / delete ──────────────────────────────────
    socket.on('edit_message', async ({ messageId, content, teamId }) => {
      try {
        const msg = await TeamMessage.findOneAndUpdate(
          { _id: messageId, sender: uid },
          { content, edited: true, editedAt: new Date() },
          { new: true }
        ).populate('sender', 'name avatar');
        if (msg) io.to(`team_${teamId}`).emit('message_edited', msg);
      } catch (e) {}
    });

    socket.on('delete_message', async ({ messageId, teamId }) => {
      try {
        await TeamMessage.findOneAndUpdate({ _id: messageId, sender: uid }, { content: 'This message was deleted', deletedAt: new Date(), attachments: [] });
        io.to(`team_${teamId}`).emit('message_deleted', { messageId });
      } catch (e) {}
    });

    // ── Pin message ────────────────────────────────────────────
    socket.on('pin_message', async ({ messageId, teamId }) => {
      try {
        const msg = await TeamMessage.findByIdAndUpdate(messageId, [{ $set: { isPinned: { $not: '$isPinned' } } }], { new: true });
        if (msg) io.to(`team_${teamId}`).emit('message_pinned', { messageId, isPinned: msg.isPinned });
      } catch (e) {}
    });

    // ── Meet / call ────────────────────────────────────────────
    socket.on('start_call', (data) => {
      io.to(`team_${data.teamId}`).emit('incoming_call', { ...data, callerName: data.callerName, userId: uid });
    });

    // ── Get online members ────────────────────────────────────
    socket.on('get_online_members', (teamId) => {
      const online = [];
      onlineUsers.forEach((val, key) => {
        if (val.teams?.includes(teamId)) online.push(key);
      });
      socket.emit('online_members', { teamId, members: online });
    });

    // ── Disconnect ─────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(uid);
      io.emit('presence_update', { userId: uid, status: 'offline' });
    });
  });

  // Expose for controllers
  io.getOnlineUsers = () => onlineUsers;
};
