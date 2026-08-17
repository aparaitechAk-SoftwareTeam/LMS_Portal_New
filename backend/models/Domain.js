const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, unique: true },
  description: String,
  icon: { type: String, default: 'Code' },
  color: { type: String, default: '#7c3aed' },
  maxCapacity: { type: Number, default: 20 },
  currentCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  skills: [String],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  curriculum: [{
    week: Number,
    title: String,
    description: String,
    type: { type: String, enum: ['assignment','project','test','lecture'], default: 'assignment' },
    linkedItem: { type: mongoose.Schema.Types.ObjectId },
    linkedModel: { type: String, enum: ['Project','Task'] }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

domainSchema.pre('save', function(next) {
  if (this.isModified('name')) this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  next();
});

module.exports = mongoose.model('Domain', domainSchema);
