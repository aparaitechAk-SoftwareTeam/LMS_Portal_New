const mongoose = require('mongoose');

// Project Model
const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  completed: { type: Boolean, default: false },
  completedAt: Date
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  techStack: [String],
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Intern' }],
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  status: { type: String, enum: ['pending', 'ongoing', 'review', 'completed'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  startDate: Date,
  endDate: Date,
  progress: { type: Number, default: 0, min: 0, max: 100 },
  milestones: [milestoneSchema],
  documents: [{ name: String, url: String, publicId: String, uploadedAt: Date }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  githubRepo: String,
  liveUrl: String,
  tags: [String]
}, { timestamps: true });

// Task Model
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['daily', 'weekly', 'project'], default: 'daily' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Intern' }],
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  status: { type: String, enum: ['pending', 'in_progress', 'submitted', 'approved', 'rejected'], default: 'pending' },
  dueDate: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  attachments: [{ name: String, url: String, publicId: String }],
  tags: [String]
}, { timestamps: true });

// Submission Model
const submissionSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
  files: [{ name: String, url: String, publicId: String, fileType: String }],
  githubLink: String,
  liveLink: String,
  notes: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewComment: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  version: { type: Number, default: 1 },
  isResubmission: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = {
  Project: mongoose.model('Project', projectSchema),
  Task: mongoose.model('Task', taskSchema),
  Submission: mongoose.model('Submission', submissionSchema)
};
