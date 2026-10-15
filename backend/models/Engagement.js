const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 2000 },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  category: { type: String, default: 'personal', trim: true, maxlength: 80 },
  dueDate: Date,
  isFavorite: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  completedAt: Date
}, { timestamps: true });

const teamCalendarEventSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 3000 },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  type: { type: String, enum: ['team_meeting', 'class', 'deadline', 'presentation', 'review', 'mentor_session', 'workshop', 'social'], default: 'team_meeting' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  location: { type: String, default: '', maxlength: 300 },
  reminderMinutes: { type: [Number], default: [] }
}, { timestamps: true });

const assessmentQuestionSchema = new mongoose.Schema({
  domain: { type: String, required: true, trim: true, lowercase: true, index: true },
  topic: { type: String, required: true, trim: true, lowercase: true, index: true },
  difficulty: { type: String, enum: ['basic', 'medium', 'hard'], required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  options: { type: [String], validate: value => value.length >= 2 && value.length <= 6 },
  correctOption: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  source: { type: String, enum: ['admin', 'ai'], default: 'admin' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
assessmentQuestionSchema.index({ domain: 1, topic: 1, difficulty: 1 });

const assessmentAttemptSchema = new mongoose.Schema({
  intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
  domain: String,
  topic: String,
  difficulty: { type: String, enum: ['basic', 'medium', 'hard'] },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  percentage: { type: Number, required: true },
  answers: [{ question: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentQuestion' }, selectedOption: String, isCorrect: Boolean }]
}, { timestamps: true });

const projectReviewSubmissionSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
  githubUrl: { type: String, default: '' },
  liveUrl: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  weekNumber: { type: Number, min: 1, max: 52, default: 1 },
  codeZip: { name: String, url: String, publicId: String, mimeType: String },
  screenRecording: { name: String, url: String, publicId: String, mimeType: String },
  screenshots: [{ name: String, url: String, publicId: String, mimeType: String }],
  notes: { type: String, default: '', maxlength: 5000 },
  attachments: [{ name: String, url: String, publicId: String, mimeType: String }],
  requestedReviewAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['submitted', 'in_review', 'changes_requested', 'approved', 'rejected'], default: 'submitted', index: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: { type: String, default: '', maxlength: 5000 },
  reviewedAt: Date
}, { timestamps: true });

const jobApplicationSchema = new mongoose.Schema({
  intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  resumeUrl: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
  notes: { type: String, default: '', maxlength: 3000 },
  status: { type: String, enum: ['submitted', 'under_review', 'interview_scheduled', 'selected', 'rejected'], default: 'submitted', index: true },
  interviewAt: Date,
  adminNotes: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
jobApplicationSchema.index({ intern: 1, project: 1 }, { unique: true });

module.exports = {
  PersonalTodo: mongoose.model('PersonalTodo', todoSchema),
  TeamCalendarEvent: mongoose.model('TeamCalendarEvent', teamCalendarEventSchema),
  AssessmentQuestion: mongoose.model('AssessmentQuestion', assessmentQuestionSchema),
  AssessmentAttempt: mongoose.model('AssessmentAttempt', assessmentAttemptSchema),
  ProjectReviewSubmission: mongoose.model('ProjectReviewSubmission', projectReviewSubmissionSchema)
  ,JobApplication: mongoose.model('JobApplication', jobApplicationSchema)
};
