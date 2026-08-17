const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Project } = require('../models/ProjectTask');
const Intern = require('../models/Intern');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    if (req.user.role === 'intern') {
      const intern = await Intern.findOne({ user: req.user._id });
      query.assignedTo = intern._id;
    }
    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate({ path: 'assignedTo', populate: { path: 'user', select: 'name avatar' } })
      .populate('team', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: projects, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', authorize('admin'), async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, createdBy: req.user._id });
    if (req.body.assignedTo?.length) {
      await Intern.updateMany({ _id: { $in: req.body.assignedTo } }, { $addToSet: { projects: project._id } });
    }
    res.status(201).json({ success: true, data: project });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate({ path: 'assignedTo', populate: { path: 'user', select: 'name avatar email' } })
      .populate('team', 'name members').populate('createdBy', 'name');
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.user.role === 'intern') {
      const intern = await Intern.findOne({ user: req.user._id });
      if (!intern || !project.assignedTo.some(id => String(id._id || id) === String(intern._id))) {
        return res.status(403).json({ success: false, message: 'Project access denied' });
      }
    }
    res.json({ success: true, data: project });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: project });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id/milestone/:milestoneId', protect, async (req, res) => {
  try {
    if (req.user.role === 'intern') {
      const intern = await Intern.findOne({ user: req.user._id });
      const allowed = intern && await Project.exists({ _id: req.params.id, assignedTo: intern._id });
      if (!allowed) return res.status(403).json({ success: false, message: 'Project access denied' });
    }
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, 'milestones._id': req.params.milestoneId },
      { $set: { 'milestones.$.completed': req.body.completed, 'milestones.$.completedAt': req.body.completed ? new Date() : null } },
      { new: true }
    );
    res.json({ success: true, data: project });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
