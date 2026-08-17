const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  intern:        { type: mongoose.Schema.Types.ObjectId, ref: 'Intern', required: true },
  project:       { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  course:        { type: mongoose.Schema.Types.ObjectId, ref: 'LearningCourse' },
  domain:        { type: mongoose.Schema.Types.ObjectId, ref: 'Domain' },
  type:          { type: String, enum: ['onboarding','final','project_fee','course_purchase'], required: true },
  title:         { type: String },  // e.g. "Project Fee - E-Commerce App"
  description:   { type: String },
  amount:        { type: Number, required: true },
  currency:      { type: String, default: 'INR' },
  status:        { type: String, enum: ['paid','pending','overdue','waived','initiated'], default: 'pending' },
  dueDate:       Date,
  paidDate:      Date,
  // Manual payment
  paymentMethod: { type: String, enum: ['cash','upi','bank_transfer','card','razorpay','other'], default: 'razorpay' },
  transactionId: String,
  notes:         String,
  invoiceNumber: { type: String, unique: true, sparse: true },
  recordedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Razorpay fields
  razorpayOrderId:   { type: String, unique: true, sparse: true },
  razorpayPaymentId: String,
  razorpaySignature: String,
  razorpayReceipt:   String,
}, { timestamps: true });

paymentSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    const prefix = this.type === 'onboarding' ? 'I1025' : this.type === 'final' ? 'I4025' : this.type === 'course_purchase' ? 'COURSE' : 'PROJ';
    this.invoiceNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
