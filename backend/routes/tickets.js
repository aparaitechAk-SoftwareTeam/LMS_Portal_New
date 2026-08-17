const express = require('express');
const router = express.Router();
const { SupportTicket, Notification } = require('../models/Others');
const Intern = require('../models/Intern');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { intern: (await Intern.findOne({ user: req.user._id }))?._id };
    const { status } = req.query;
    if (status) query.status = status;
    const tickets = await SupportTicket.find(query)
      .populate({ path: 'intern', populate: { path: 'user', select: 'name avatar email' } })
      .populate('replies.user', 'name role avatar').sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', authorize('intern'), async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user._id });
    if (!intern) return res.status(404).json({ success: false, message: 'Intern profile not found' });
    const ticket = await SupportTicket.create({ ...req.body, intern: intern._id });
    res.status(201).json({ success: true, data: ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/reply', async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ success: false, message: 'Reply message is required' });
    const ticket = await SupportTicket.findById(req.params.id).populate({ path: 'intern', populate: { path: 'user', select: 'name email' } });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (['resolved', 'closed'].includes(ticket.status)) return res.status(400).json({ success: false, message: 'This ticket is closed for replies' });
    if (req.user.role === 'intern') {
      const intern = await Intern.findOne({ user: req.user._id });
      if (!intern || String(ticket.intern._id) !== String(intern._id)) return res.status(403).json({ success: false, message: 'Ticket access denied' });
    }
    ticket.replies.push({ user: req.user._id, message, isAdmin: req.user.role === 'admin' });
    await ticket.save();
    const io = req.app.get('io');
    if (req.user.role === 'admin') {
      const notification = await Notification.create({ recipient: ticket.intern.user._id, sender: req.user._id, type: 'announcement', title: 'Support ticket reply', message: `Support replied to: ${ticket.subject}`, link: '/intern/tickets' });
      io?.to(ticket.intern.user._id.toString()).emit('notification', notification);
    } else {
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      for (const admin of admins) {
        const notification = await Notification.create({ recipient: admin._id, sender: req.user._id, type: 'announcement', title: 'New support ticket reply', message: `${req.user.name} replied to: ${ticket.subject}`, link: '/admin/tickets' });
        io?.to(admin._id.toString()).emit('notification', notification);
      }
    }
    await ticket.populate('replies.user', 'name role avatar');
    res.json({ success: true, data: ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/status', authorize('admin'), async (req, res) => {
  try {
    if (!['open', 'in_progress', 'resolved', 'closed'].includes(req.body.status)) return res.status(400).json({ success: false, message: 'Invalid ticket status' });
    const update = { status: req.body.status };
    if (req.body.status === 'resolved') { update.resolvedAt = new Date(); update.resolvedBy = req.user._id; }
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, data: ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
