const mongoose = require('mongoose');

// Attendance Model
const attendanceSchema = new mongoose.Schema({
  intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
  date: { type: Date, required: true },
  loginTime: Date,
  logoutTime: Date,
  workHours: { type: Number, default: 0 },
  status: { type: String, enum: ['present', 'absent', 'late', 'half_day', 'leave'], default: 'absent' },
  isManualOverride: { type: Boolean, default: false },
  overrideBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  ipAddress: String,
  deviceInfo: String,
  breaks: [{ start: Date, end: Date, duration: Number }]
}, { timestamps: true });
attendanceSchema.index({ intern: 1, date: 1 }, { unique: true });

// Team Model
const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Intern' }],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  sharedFiles: [{ name: String, url: String, publicId: String, uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, uploadedAt: Date }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Notification Model
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['task_assigned','submission_approved','submission_rejected','deadline_reminder','attendance_alert','announcement','project_assigned','certificate_ready'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: String,
  isRead: { type: Boolean, default: false },
  readAt: Date
}, { timestamps: true });

// Support Ticket Model
const ticketSchema = new mongoose.Schema({
  intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['technical','task','attendance','general','other'], default: 'general' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  attachments: [{ name: String, url: String }],
  replies: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  resolvedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Certificate Model
const certificateSchema = new mongoose.Schema({
  intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
  type: { type: String, enum: ['progress', 'completion', 'experience', 'appreciation', 'project_progress', 'project_completion', 'lor'], required: true },
  learningCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningCourse' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  certificateId: { type: String, unique: true },
  issuedDate: { type: Date, default: Date.now },
  pdfUrl: String,
  pdfPublicId: String,
  qrCode: String,
  isValid: { type: Boolean, default: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const feeStructureSchema = new mongoose.Schema({
  key: { type: String, default: 'default', unique: true },
  onboardingAmount: { type: Number, min: 0, default: 0 },
  finalAmount: { type: Number, min: 0, default: 0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Activity Log Model
const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  module: { type: String, required: true },
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

module.exports = {
  Attendance: mongoose.model('Attendance', attendanceSchema),
  Team: mongoose.model('Team', teamSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  SupportTicket: mongoose.model('SupportTicket', ticketSchema),
  Certificate: mongoose.model('Certificate', certificateSchema),
  FeeStructure: mongoose.model('FeeStructure', feeStructureSchema),
  ActivityLog: mongoose.model('ActivityLog', activityLogSchema)
};
