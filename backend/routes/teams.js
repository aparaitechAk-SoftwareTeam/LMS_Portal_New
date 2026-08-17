const express = require('express');
const router = express.Router();
const { Team } = require('../models/Others');
const { TeamMessage, TeamChannel } = require('../models/TeamChat');
const Intern = require('../models/Intern');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const cloudinaryStorage = require('../config/cloudinaryStorage');
const upload = multer({ storage: cloudinaryStorage });

router.use(protect);

const canAccessTeam = async (user, teamId) => {
  if (user.role === 'admin') return true;
  const intern = await Intern.findOne({ user: user._id });
  return !!(intern && await Team.exists({ _id: teamId, $or: [{ leader: intern._id }, { members: intern._id }] }));
};

// ── Teams CRUD ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const intern = req.user.role === 'intern' ? await Intern.findOne({ user: req.user._id }) : null;
    const teams = await Team.find(req.user.role === 'admin' ? {} : intern ? { $or: [{ leader: intern._id }, { members: intern._id }] } : { _id: null })
      .populate({ path: 'members', populate: { path: 'user', select: 'name avatar email' } })
      .populate({ path: 'leader',  populate: { path: 'user', select: 'name avatar' } })
      .populate('projects', 'title status progress');
    res.json({ success: true, data: teams });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    if (!await canAccessTeam(req.user, req.params.id)) return res.status(403).json({ success: false, message: 'Team access denied' });
    const team = await Team.findById(req.params.id)
      .populate({ path: 'members', populate: { path: 'user', select: 'name avatar email role' } })
      .populate({ path: 'leader',  populate: { path: 'user', select: 'name avatar' } })
      .populate('projects', 'title status progress');
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    res.json({ success: true, data: team });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', authorize('admin'), async (req, res) => {
  try {
    const team = await Team.create({ ...req.body, createdBy: req.user._id });
    if (req.body.members?.length) {
      await Intern.updateMany({ _id: { $in: req.body.members } }, { team: team._id });
    }
    // Create default channels
    await TeamChannel.insertMany([
      { team: team._id, name: 'general',       description: 'General discussion', type: 'text',         isDefault: true, createdBy: req.user._id },
      { team: team._id, name: 'announcements', description: 'Team announcements', type: 'announcement',  isDefault: true, createdBy: req.user._id },
      { team: team._id, name: 'resources',     description: 'Shared resources',   type: 'text',          isDefault: true, createdBy: req.user._id },
    ]);
    res.status(201).json({ success: true, data: team });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: team });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    await TeamChannel.deleteMany({ team: req.params.id });
    await TeamMessage.deleteMany({ team: req.params.id });
    res.json({ success: true, message: 'Team deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Channels ───────────────────────────────────────────────────────────────
router.get('/:id/channels', async (req, res) => {
  try {
    if (!await canAccessTeam(req.user, req.params.id)) return res.status(403).json({ success: false, message: 'Team access denied' });
    const channels = await TeamChannel.find({ team: req.params.id }).sort({ isDefault: -1, createdAt: 1 });
    res.json({ success: true, data: channels });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/channels', async (req, res) => {
  try {
    if (!await canAccessTeam(req.user, req.params.id)) return res.status(403).json({ success: false, message: 'Team access denied' });
    if (req.user.role !== 'admin') {
      const intern = await Intern.findOne({ user: req.user._id });
      const isLeader = intern && await Team.exists({ _id: req.params.id, leader: intern._id });
      if (!isLeader) return res.status(403).json({ success: false, message: 'Only the team leader can create channels' });
    }
    const channel = await TeamChannel.create({ team: req.params.id, ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: channel });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id/channels/:channelId', authorize('admin'), async (req, res) => {
  try {
    await TeamChannel.findByIdAndDelete(req.params.channelId);
    await TeamMessage.deleteMany({ team: req.params.id, channel: req.params.channelId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Messages ───────────────────────────────────────────────────────────────
router.get('/:id/messages', async (req, res) => {
  try {
    if (!await canAccessTeam(req.user, req.params.id)) return res.status(403).json({ success: false, message: 'Team access denied' });
    const { channel = 'general', page = 1, limit = 50 } = req.query;
    const messages = await TeamMessage.find({ team: req.params.id, channel, deletedAt: { $exists: false } })
      .populate('sender', 'name avatar role')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: messages.reverse() });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id/messages/pinned', async (req, res) => {
  try {
    if (!await canAccessTeam(req.user, req.params.id)) return res.status(403).json({ success: false, message: 'Team access denied' });
    const { channel = 'general' } = req.query;
    const pinned = await TeamMessage.find({ team: req.params.id, channel, isPinned: true })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: pinned });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Upload file in chat
router.post('/:id/messages/upload', upload.array('files', 5), async (req, res) => {
  try {
    if (!await canAccessTeam(req.user, req.params.id)) return res.status(403).json({ success: false, message: 'Team access denied' });
    const files = req.files.map(f => ({
      name: f.originalname, url: f.path,
      size: f.size, mimeType: f.mimetype, publicId: f.filename
    }));
    const msg = await TeamMessage.create({
      team: req.params.id, channel: req.body.channel || 'general',
      sender: req.user._id, content: req.body.content || '',
      type: 'file', attachments: files,
    });
    const populated = await TeamMessage.findById(msg._id).populate('sender', 'name avatar role');
    const io = req.app.get('io');
    io?.to(`team_${req.params.id}`).emit('new_message', { ...populated.toObject(), channel: req.body.channel || 'general' });
    res.status(201).json({ success: true, data: populated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Shared files ───────────────────────────────────────────────────────────
router.get('/:id/files', async (req, res) => {
  try {
    if (!await canAccessTeam(req.user, req.params.id)) return res.status(403).json({ success: false, message: 'Team access denied' });
    const files = await TeamMessage.find({ team: req.params.id, type: { $in: ['file','image'] }, 'attachments.0': { $exists: true } })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: files });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;

// Ensure default channels exist (called when opening a team that has none)
router.post('/:id/ensure-channels', async (req, res) => {
  try {
    if (!await canAccessTeam(req.user, req.params.id)) return res.status(403).json({ success: false, message: 'Team access denied' });
    const existing = await TeamChannel.countDocuments({ team: req.params.id });
    if (existing === 0) {
      await TeamChannel.insertMany([
        { team: req.params.id, name: 'general',       description: 'General discussion', type: 'text',         isDefault: true, createdBy: req.user._id },
        { team: req.params.id, name: 'announcements', description: 'Team announcements', type: 'announcement', isDefault: true, createdBy: req.user._id },
        { team: req.params.id, name: 'resources',     description: 'Shared resources',   type: 'text',         isDefault: true, createdBy: req.user._id },
      ]);
    }
    const channels = await TeamChannel.find({ team: req.params.id }).sort({ isDefault: -1, createdAt: 1 });
    res.json({ success: true, data: channels });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Toggle channel lock (admin only)
router.put('/:id/channels/:channelId/lock', authorize('admin'), async (req, res) => {
  try {
    const channel = await TeamChannel.findById(req.params.channelId);
    if (!channel) return res.status(404).json({ success: false, message: 'Channel not found' });
    channel.isLocked = !channel.isLocked;
    await channel.save();
    // Notify team members via socket
    const io = req.app.get('io');
    io?.to(`team_${req.params.id}`).emit('channel_lock_changed', {
      channelName: channel.name,
      isLocked: channel.isLocked
    });
    res.json({ success: true, data: channel });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
