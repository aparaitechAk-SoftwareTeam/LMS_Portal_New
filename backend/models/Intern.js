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
  status: { type: String, enum: ['active', 'completed', 'terminated'], default: 'active' },
  performanceScore: { type: Number, default: 0, min: 0, max: 100 },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  mentor: { type: String },
  stipend: { type: Number, default: 0 },
  certificateGenerated: { type: Boolean, default: false },
  offerLetterSent: { type: Boolean, default: false }
}, { timestamps: true });

internSchema.pre('save', function(next) {
  if (!this.internId) {
    this.internId = 'INT' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
  }
  if (this.internshipStart && this.internshipEnd) {
    const months = Math.round((this.internshipEnd - this.internshipStart) / (1000 * 60 * 60 * 24 * 30));
    this.internshipDuration = `${months} months`;
  }
  next();
});

module.exports = mongoose.model('Intern', internSchema);
