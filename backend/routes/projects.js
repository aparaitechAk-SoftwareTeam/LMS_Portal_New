const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Project } = require('../models/ProjectTask');
const Intern = require('../models/Intern');
const { generateProjectWorkflow } = require('../services/projectWorkflowService');

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
    const project = await Project.create({ ...req.body, assignedTo: [], isProjectTemplate: true, createdBy: req.user._id });
    if (req.body.assignedTo?.length) {
      await Intern.updateMany({ _id: { $in: req.body.assignedTo } }, { $addToSet: { projects: project._id } });
      await generateProjectWorkflow(project, req.user._id);
    }
    res.status(201).json({ success: true, data: project });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// The catalog shown to students. A student chooses one independent project per level.
router.get('/library', authorize('intern'), async (req, res) => {
  try {
    const [templates, intern] = await Promise.all([
      Project.find({ isProjectTemplate: true }).select('title description techStack level priority tags createdAt').sort({ level: 1, createdAt: -1 }),
      Intern.findOne({ user: req.user._id }),
    ]);
    const selected = intern ? await Project.find({ assignedTo: intern._id, isProjectTemplate: false }).select('level templateProject status') : [];
    res.json({ success: true, data: templates, selectedLevels: selected.map(project => project.level), selectedTemplateIds: selected.map(project => String(project.templateProject || '')) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/select', authorize('intern'), async (req, res) => {
  try {
    const [template, intern] = await Promise.all([Project.findOne({ _id: req.params.id, isProjectTemplate: true }), Intern.findOne({ user: req.user._id })]);
    if (!template || !intern) return res.status(404).json({ success: false, message: 'Project or student profile not found' });
    const alreadySelected = await Project.exists({ assignedTo: intern._id, isProjectTemplate: false, level: template.level });
    if (alreadySelected) return res.status(400).json({ success: false, message: `You have already selected one ${template.level} project.` });
    const start = new Date(); const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    const project = await Project.create({
      title: template.title, description: template.description, techStack: template.techStack, priority: template.priority,
      level: template.level, tags: template.tags, milestones: [], assignedTo: [intern._id], createdBy: template.createdBy,
      templateProject: template._id, isProjectTemplate: false, startDate: start, endDate: end, status: 'pending', progress: 0,
    });
    await Intern.findByIdAndUpdate(intern._id, { $addToSet: { projects: project._id } });
    await generateProjectWorkflow(project, template.createdBy);
    res.status(201).json({ success: true, data: project });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/generate-workflow', authorize('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!project.assignedTo?.length) return res.status(400).json({ success: false, message: 'Only a student-selected project can receive a workflow' });
    const result = await generateProjectWorkflow(project, req.user._id);
    res.status(201).json({ success: true, data: result });
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
