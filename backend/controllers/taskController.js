const { Task, Submission } = require('../models/ProjectTask');
const Intern = require('../models/Intern');
const { Notification } = require('../models/Others');
const cloudinaryUpload = require('../config/cloudinary');

const notifyInterns = async (internIds, notification, io) => {
  for (const internId of internIds) {
    const intern = await Intern.findById(internId).populate('user', '_id');
    if (intern?.user) {
      const notif = await Notification.create({ ...notification, recipient: intern.user._id });
      io?.to(intern.user._id.toString()).emit('notification', notif);
    }
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, type, internId, search } = req.query;
    const query = {};
    if (req.user.role === 'intern') {
      const intern = await Intern.findOne({ user: req.user._id });
      if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });
      query.assignedTo = intern._id;
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (internId) query.assignedTo = internId;
    if (search) query.title = { $regex: search, $options: 'i' };

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'user internId')
      .populate({ path: 'assignedTo', populate: { path: 'user', select: 'name avatar' } })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: tasks, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    const io = req.app.get('io');
    if (req.body.assignedTo?.length) {
      await notifyInterns(req.body.assignedTo, {
        sender: req.user._id, type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${task.title}"`,
        link: `/tasks/${task._id}`
      }, io);
    }
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const foundTask = await Task.findById(req.params.id);
    if (!foundTask) return res.status(404).json({ success: false, message: 'Task not found' });
    if (req.user.role === 'intern') {
      const intern = await Intern.findOne({ user: req.user._id });
      if (!intern || !foundTask.assignedTo.some(id => String(id) === String(intern._id))) {
        return res.status(403).json({ success: false, message: 'Task access denied' });
      }
    }
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { user: req.user._id, text: req.body.text } } },
      { new: true }
    ).populate('comments.user', 'name avatar role');
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user._id });
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });

    const { status, priority } = req.query;
    const query = { assignedTo: intern._id };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('project', 'title')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 });

    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitTask = async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user._id });
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });
    const { taskId, githubLink, liveLink, notes } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!task.assignedTo.some(id => String(id) === String(intern._id))) {
      return res.status(403).json({ success: false, message: 'Task access denied' });
    }

    const existingSubmission = await Submission.findOne({ task: taskId, intern: intern._id });
    const version = existingSubmission ? existingSubmission.version + 1 : 1;

    const files = req.files?.map(f => ({ name: f.originalname, url: f.path, publicId: f.filename, fileType: f.mimetype })) || [];

    const submission = await Submission.create({
      task: taskId, intern: intern._id, files, githubLink, liveLink, notes,
      version, isResubmission: !!existingSubmission
    });

    await Task.findByIdAndUpdate(taskId, { status: 'submitted' });

    const io = req.app.get('io');
    const notification = await Notification.create({
      recipient: task.createdBy, sender: req.user._id, type: 'submission_approved',
      title: 'Task Submitted', message: `An intern has submitted task: "${task.title}"`,
      link: `/tasks/${taskId}`
    });
    io?.to(task.createdBy.toString()).emit('notification', notification);

    res.status(201).json({ success: true, data: submission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reviewSubmission = async (req, res) => {
  try {
    const { status, reviewComment } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { status, reviewComment, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    ).populate('task', 'title').populate('intern');

    const taskStatus = status === 'approved' ? 'approved' : 'rejected';
    await Task.findByIdAndUpdate(submission.task._id, { status: taskStatus });

    const io = req.app.get('io');
    const internUser = await require('../models/User').findById(submission.intern.user);
    const notif = await Notification.create({
      recipient: internUser._id, sender: req.user._id,
      type: status === 'approved' ? 'submission_approved' : 'submission_rejected',
      title: `Submission ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your submission for "${submission.task.title}" has been ${status}. ${reviewComment || ''}`,
      link: `/tasks/${submission.task._id}`
    });
    io?.to(internUser._id.toString()).emit('notification', notif);

    res.json({ success: true, data: submission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
