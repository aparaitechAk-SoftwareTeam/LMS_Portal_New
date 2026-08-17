const mongoose = require('mongoose');

const publicInquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
  phone: { type: String, trim: true, maxlength: 30 },
  subject: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 4000 },
  status: { type: String, enum: ['new', 'in_progress', 'resolved', 'spam'], default: 'new' },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  handledAt: Date
}, { timestamps: true });

module.exports = mongoose.model('PublicInquiry', publicInquirySchema);
