const express = require('express');
const router = express.Router();
const PublicInquiry = require('../models/PublicInquiry');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/', async (req, res) => {
  try {
    const query = req.query.status ? { status: req.query.status } : {};
    const inquiries = await PublicInquiry.find(query)
      .populate('handledBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: inquiries });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/status', async (req, res) => {
  try {
    const status = req.body.status;
    if (!['new', 'in_progress', 'resolved', 'spam'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid inquiry status' });
    }
    const inquiry = await PublicInquiry.findByIdAndUpdate(req.params.id, {
      status,
      handledBy: req.user._id,
      handledAt: status === 'new' ? null : new Date()
    }, { new: true }).populate('handledBy', 'name email');
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, data: inquiry });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
