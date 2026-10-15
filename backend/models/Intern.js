const mongoose = require('mongoose');

const internSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  internId: { type: String, unique: true },
  department: { type: String, required: true },
  techStack: [{ type: String }],
  college: {
    name: String, degree: String, branch: String, year: String, rollNo: String
  },
  skills: [{ type: String }],
  resume: { url: String, publicId: String },
  github: { type: String },
  linkedin: { type: String },
  address: { street: String, city: String, state: String, pincode: String },
  emergencyContact: { name: String, phone: String, relation: String },
  internshipStart: { type: Date, required: true },
  internshipEnd: { type: Date, required: true },
  internshipDuration: { type: String },
  internshipPlan: { type: String, enum: ['1 Month Internship', '2 Month Internship', '3 Month Internship'] },
  internshipFee: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['active', 'completed', 'terminated'], default: 'active' },
  performanceScore: { type: Number, default: 0, min: 0, max: 100 },
  projectKpiProgress: { type: Number, default: 0, min: 0, max: 50 },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  mentor: { type: String },
  stipend: { type: Number, default: 0 },
  certificateGenerated: { type: Boolean, default: false },
  offerLetterSent: { type: Boolean, default: false },
  // Admin can keep the normal milestone rule, unlock early, or keep an item locked.
  accessControls: {
    projectProgress: { type: String, enum: ['auto', 'unlocked', 'locked'], default: 'auto' },
    projectCompletion: { type: String, enum: ['auto', 'unlocked', 'locked'], default: 'auto' },
    lor: { type: String, enum: ['auto', 'unlocked', 'locked'], default: 'auto' },
    hrInterview: { type: String, enum: ['auto', 'unlocked', 'locked'], default: 'auto' }
  }
}, { timestamps: true });

internSchema.pre('save', function(next) {
  if (!this.internId) {
    this.internId = 'INT' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
  }
  if (this.internshipPlan) {
    this.internshipDuration = this.internshipPlan.replace(' Internship', '').toLowerCase();
  } else if (this.internshipStart && this.internshipEnd) {
    const months = Math.round((this.internshipEnd - this.internshipStart) / (1000 * 60 * 60 * 24 * 30));
    this.internshipDuration = `${months} months`;
  }
  next();
});

module.exports = mongoose.model('Intern', internSchema);
