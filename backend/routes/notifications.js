// routes/notifications.js
const express = require('express');
const r1 = express.Router();
const { Notification } = require('../models/Others');
const { protect } = require('../middleware/auth');
r1.use(protect);
r1.get('/', async (req, res) => {
  const notifs = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50);
  const unread = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ success: true, data: notifs, unread });
});
r1.put('/:id/read', async (req, res) => {
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true, readAt: new Date() });
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.json({ success: true });
});
r1.put('/read-all', async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ success: true });
});
module.exports = r1;
