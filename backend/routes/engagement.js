const express = require('express');
const router = express.Router();
const { protect, authorize, logActivity } = require('../middleware/auth');
const Intern = require('../models/Intern');
const { Team } = require('../models/Others');
const { Project } = require('../models/ProjectTask');
const { PersonalTodo, TeamCalendarEvent, AssessmentQuestion, AssessmentAttempt, ProjectReviewSubmission, JobApplication } = require('../models/Engagement');

const generateAiQuestions = async ({ domain, topic, difficulty, count }) => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('AI assessment generation is not configured');
  const models = [process.env.AI_MODEL, ...(process.env.AI_FALLBACK_MODELS || '').split(',')]
    .map(model => model && model.trim()).filter(Boolean);
  const prompt = `Generate ${count} multiple-choice assessment questions for domain "${domain}", topic "${topic}", difficulty "${difficulty}". Return only a JSON array. Each item must have text, options (exactly 4 strings), and correctOption (one exact value from options). Do not include markdown.`;
  let lastError;
  for (const model of models.length ? models : ['gemini-1.5-flash']) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.4 } })
      });
      if (!response.ok) { lastError = new Error(`AI provider returned ${response.status}`); continue; }
      const body = await response.json();
      const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(text);
      const valid = Array.isArray(parsed) && parsed.filter(question => question.text && Array.isArray(question.options) && question.options.length === 4 && question.options.includes(question.correctOption));
      if (!valid || !valid.length) throw new Error('AI returned invalid questions');
      return valid.slice(0, count);
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error('AI assessment generation failed');
};

router.use(protect);
const getIntern = userId => Intern.findOne({ user: userId });
const isTeamLeader = async (userId, teamId) => {
  const intern = await getIntern(userId);
  return intern && (await Team.exists({ _id: teamId, leader: intern._id }));
};
const canSeeTeam = async (user, teamId) => {
  if (user.role === 'admin') return true;
  const intern = await getIntern(user._id);
  return !!(intern && await Team.exists({ _id: teamId, $or: [{ leader: intern._id }, { members: intern._id }] }));
};

// Personal to-dos: every query is permanently scoped to the signed-in user.
router.get('/todos', async (req, res) => {
  const todos = await PersonalTodo.find({ user: req.user._id }).sort({ isCompleted: 1, dueDate: 1, createdAt: -1 });
  res.json({ success: true, data: todos });
});
router.post('/todos', logActivity('create_personal_todo', 'engagement'), async (req, res) => {
  try { const todo = await PersonalTodo.create({ ...req.body, user: req.user._id }); res.status(201).json({ success: true, data: todo }); }
  catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.put('/todos/:id', logActivity('update_personal_todo', 'engagement'), async (req, res) => {
  try {
    const allowed = ['title', 'description', 'priority', 'category', 'dueDate', 'isFavorite', 'isCompleted'];
    const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (changes.isCompleted === true) changes.completedAt = new Date();
    if (changes.isCompleted === false) changes.completedAt = null;
    const todo = await PersonalTodo.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, changes, { new: true, runValidators: true });
    if (!todo) return res.status(404).json({ success: false, message: 'To-do not found' });
    res.json({ success: true, data: todo });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.delete('/todos/:id', logActivity('delete_personal_todo', 'engagement'), async (req, res) => {
  const todo = await PersonalTodo.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!todo) return res.status(404).json({ success: false, message: 'To-do not found' });
  res.json({ success: true });
});

// Team calendar: members view; only team leader or admin changes events.
router.get('/calendar/:teamId', async (req, res) => {
  if (!await canSeeTeam(req.user, req.params.teamId)) return res.status(403).json({ success: false, message: 'Team access denied' });
  const events = await TeamCalendarEvent.find({ team: req.params.teamId }).sort({ startAt: 1 });
  res.json({ success: true, data: events });
});
router.post('/calendar/:teamId', logActivity('create_team_calendar_event', 'calendar'), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !await isTeamLeader(req.user._id, req.params.teamId)) return res.status(403).json({ success: false, message: 'Only the team leader can create events' });
    if (new Date(req.body.endAt) < new Date(req.body.startAt)) return res.status(400).json({ success: false, message: 'End time must be after start time' });
    const event = await TeamCalendarEvent.create({ ...req.body, team: req.params.teamId, createdBy: req.user._id });
    res.status(201).json({ success: true, data: event });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.put('/calendar/:id', logActivity('update_team_calendar_event', 'calendar'), async (req, res) => {
  const event = await TeamCalendarEvent.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  if (req.user.role !== 'admin' && !await isTeamLeader(req.user._id, event.team)) return res.status(403).json({ success: false, message: 'Only the team leader can update events' });
  const allowed = ['title', 'description', 'startAt', 'endAt', 'type', 'priority', 'location', 'reminderMinutes'];
  Object.assign(event, Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key))));
  if (event.endAt < event.startAt) return res.status(400).json({ success: false, message: 'End time must be after start time' });
  await event.save(); res.json({ success: true, data: event });
});
router.delete('/calendar/:id', logActivity('delete_team_calendar_event', 'calendar'), async (req, res) => {
  const event = await TeamCalendarEvent.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  if (req.user.role !== 'admin' && !await isTeamLeader(req.user._id, event.team)) return res.status(403).json({ success: false, message: 'Only the team leader can delete events' });
  await event.deleteOne(); res.json({ success: true });
});

// Assessment question bank and attempts. Correct answers never leave the server before submission.
router.post('/assessments/questions', authorize('admin'), logActivity('create_assessment_question', 'assessment'), async (req, res) => {
  try {
    const question = await AssessmentQuestion.create({ ...req.body, createdBy: req.user._id, source: 'admin' });
    if (!question.options.includes(question.correctOption)) { await question.deleteOne(); return res.status(400).json({ success: false, message: 'Correct option must be one of the supplied options' }); }
    res.status(201).json({ success: true, data: question });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.get('/assessments/questions', authorize('admin'), async (req, res) => {
  const questions = await AssessmentQuestion.find(req.query.domain ? { domain: String(req.query.domain).toLowerCase() } : {}).sort({ createdAt: -1 });
  res.json({ success: true, data: questions });
});
router.post('/assessments/generate', authorize('intern'), async (req, res) => {
  const { domain, topic, difficulty, count = 10 } = req.body;
  const safeCount = Math.min(Math.max(Number(count) || 10, 1), 25);
  const match = { domain: String(domain || '').toLowerCase(), topic: String(topic || '').toLowerCase(), difficulty, isActive: true };
  let questions = await AssessmentQuestion.aggregate([{ $match: match }, { $sample: { size: safeCount } }, { $project: { correctOption: 0 } }]);
  if (!questions.length) {
    try {
      const generated = await generateAiQuestions({ domain: match.domain, topic: match.topic, difficulty, count: safeCount });
      await AssessmentQuestion.insertMany(generated.map(question => ({ ...question, domain: match.domain, topic: match.topic, difficulty, source: 'ai' })));
      questions = await AssessmentQuestion.aggregate([{ $match: match }, { $sample: { size: safeCount } }, { $project: { correctOption: 0 } }]);
    } catch (error) {
      return res.status(503).json({ success: false, message: `Assessment questions are unavailable: ${error.message}` });
    }
  }
  res.json({ success: true, data: questions });
});
router.post('/assessments/submit', authorize('intern'), logActivity('submit_assessment_attempt', 'assessment'), async (req, res) => {
  try {
    const intern = await getIntern(req.user._id);
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    if (!intern || !answers.length || answers.length > 25) return res.status(400).json({ success: false, message: 'Invalid assessment submission' });
    const ids = answers.map(answer => answer.questionId);
    const questions = await AssessmentQuestion.find({ _id: { $in: ids }, isActive: true });
    if (questions.length !== new Set(ids.map(String)).size) return res.status(400).json({ success: false, message: 'Assessment contains invalid questions' });
    const byId = new Map(questions.map(question => [String(question._id), question]));
    const graded = answers.map(answer => ({ question: answer.questionId, selectedOption: answer.selectedOption, isCorrect: byId.get(String(answer.questionId)).correctOption === answer.selectedOption }));
    const score = graded.filter(answer => answer.isCorrect).length;
    const attempt = await AssessmentAttempt.create({ intern: intern._id, domain: req.body.domain, topic: req.body.topic, difficulty: req.body.difficulty, score, totalQuestions: graded.length, percentage: Math.round(score * 10000 / graded.length) / 100, answers: graded });
    res.status(201).json({ success: true, data: { id: attempt._id, score, totalQuestions: graded.length, percentage: attempt.percentage } });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.get('/assessments/my-attempts', authorize('intern'), async (req, res) => {
  const intern = await getIntern(req.user._id);
  const attempts = intern ? await AssessmentAttempt.find({ intern: intern._id }).sort({ createdAt: -1 }) : [];
  res.json({ success: true, data: attempts });
});

// Standalone project-review process (separate from daily task submissions).
router.post('/project-reviews', authorize('intern'), logActivity('submit_project_review', 'project_review'), async (req, res) => {
  try {
    const intern = await getIntern(req.user._id);
    const project = intern && await Project.findOne({ _id: req.body.projectId, assignedTo: intern._id });
    if (!project) return res.status(403).json({ success: false, message: 'Project access denied' });
    const submission = await ProjectReviewSubmission.create({ project: project._id, intern: intern._id, githubUrl: req.body.githubUrl, liveUrl: req.body.liveUrl, videoUrl: req.body.videoUrl, notes: req.body.notes, attachments: req.body.attachments || [] });
    res.status(201).json({ success: true, data: submission });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.get('/project-reviews/my', authorize('intern'), async (req, res) => {
  const intern = await getIntern(req.user._id);
  const submissions = intern ? await ProjectReviewSubmission.find({ intern: intern._id }).populate('project', 'title').sort({ createdAt: -1 }) : [];
  res.json({ success: true, data: submissions });
});
router.get('/project-reviews', authorize('admin'), async (req, res) => {
  const query = req.query.status ? { status: req.query.status } : {};
  const submissions = await ProjectReviewSubmission.find(query).populate('project', 'title').populate({ path: 'intern', populate: { path: 'user', select: 'name email' } }).sort({ createdAt: -1 });
  res.json({ success: true, data: submissions });
});
router.put('/project-reviews/:id/review', authorize('admin'), logActivity('review_project_submission', 'project_review'), async (req, res) => {
  const { status, reviewNotes } = req.body;
  if (!['in_review', 'changes_requested', 'approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid review status' });
  const submission = await ProjectReviewSubmission.findByIdAndUpdate(req.params.id, { status, reviewNotes, reviewer: req.user._id, reviewedAt: new Date() }, { new: true, runValidators: true });
  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
  res.json({ success: true, data: submission });
});

// Job/HR workflow unlocks only when an assigned project reaches 100%.
router.post('/job-applications', authorize('intern'), logActivity('submit_job_application', 'job_application'), async (req, res) => {
  try {
    const intern = await getIntern(req.user._id);
    const project = intern && await Project.findOne({ _id: req.body.projectId, assignedTo: intern._id });
    if (!project || project.progress < 100) return res.status(403).json({ success: false, message: 'Job applications unlock after 100% project progress' });
    const application = await JobApplication.create({ intern: intern._id, project: project._id, resumeUrl: req.body.resumeUrl, portfolioUrl: req.body.portfolioUrl, notes: req.body.notes });
    res.status(201).json({ success: true, data: application });
  } catch (err) { res.status(400).json({ success: false, message: err.code === 11000 ? 'You have already applied for this project' : err.message }); }
});
router.get('/job-applications/my', authorize('intern'), async (req, res) => {
  const intern = await getIntern(req.user._id);
  const applications = intern ? await JobApplication.find({ intern: intern._id }).populate('project', 'title').sort({ createdAt: -1 }) : [];
  res.json({ success: true, data: applications });
});
router.get('/job-applications', authorize('admin'), async (req, res) => {
  const applications = await JobApplication.find(req.query.status ? { status: req.query.status } : {}).populate('project', 'title').populate({ path: 'intern', populate: { path: 'user', select: 'name email' } }).sort({ createdAt: -1 });
  res.json({ success: true, data: applications });
});
router.put('/job-applications/:id', authorize('admin'), logActivity('review_job_application', 'job_application'), async (req, res) => {
  const allowed = ['status', 'interviewAt', 'adminNotes'];
  const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  changes.reviewedBy = req.user._id;
  const application = await JobApplication.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
  res.json({ success: true, data: application });
});

module.exports = router;
