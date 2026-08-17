const express = require('express');
const router = express.Router();
const Domain = require('../models/Domain');
const Intern = require('../models/Intern');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const domains = await Domain.find().populate('projects', 'title status').sort({ createdAt: -1 });
    const withCount = await Promise.all(domains.map(async d => {
      const count = await Intern.countDocuments({ department: d.name, status: 'active' });
      return { ...d.toObject(), currentCount: count };
    }));
    res.json({ success: true, data: withCount });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/', authorize('admin'), async (req, res) => {
  try {
    const domain = await Domain.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: domain });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const domain = await Domain.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: domain });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await Domain.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Curriculum mapping
router.post('/:id/curriculum', authorize('admin'), async (req, res) => {
  try {
    const domain = await Domain.findByIdAndUpdate(req.params.id, { $push: { curriculum: req.body } }, { new: true });
    res.json({ success: true, data: domain });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/:id/curriculum/:itemId', authorize('admin'), async (req, res) => {
  try {
    const domain = await Domain.findByIdAndUpdate(req.params.id, { $pull: { curriculum: { _id: req.params.itemId } } }, { new: true });
    res.json({ success: true, data: domain });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
