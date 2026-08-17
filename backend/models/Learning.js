const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  lessonId: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  durationMinutes: { type: Number, min: 0, default: 0 },
  videoUrl: { type: String, default: '' },
  resourceUrl: { type: String, default: '' },
  isPreview: { type: Boolean, default: false },
  order: { type: Number, required: true, min: 0 }
}, { _id: false });

const moduleSchema = new mongoose.Schema({
  moduleId: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  order: { type: Number, required: true, min: 0 },
  lessons: { type: [lessonSchema], default: [] }
}, { _id: false });

const learningCourseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 10000 },
  domain: { type: String, trim: true, default: '' },
  thumbnailUrl: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
  isLocked: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  price: { type: Number, min: 0, default: 0 },
  discountPercent: { type: Number, min: 0, max: 100, default: 0 },
  modules: { type: [moduleSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const learningEnrollmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningCourse', required: true, index: true },
  intern: { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true, index: true },
  enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String, enum: ['admin_assignment', 'self_enrollment', 'payment', 'migration'], default: 'admin_assignment' },
  status: { type: String, enum: ['active', 'revoked', 'completed'], default: 'active', index: true },
  completedLessonIds: { type: [String], default: [] },
  progressPercent: { type: Number, min: 0, max: 100, default: 0 },
  completedAt: { type: Date }
}, { timestamps: true });

learningEnrollmentSchema.index({ course: 1, intern: 1 }, { unique: true });

module.exports = {
  LearningCourse: mongoose.model('LearningCourse', learningCourseSchema),
  LearningEnrollment: mongoose.model('LearningEnrollment', learningEnrollmentSchema)
};
