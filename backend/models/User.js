const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'intern'], required: true },
  avatar: { type: String, default: null },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginHistory: [{ ip: String, device: String, timestamp: { type: Date, default: Date.now } }],
  refreshToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    notifications: { type: Boolean, default: true }
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.resetPasswordToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
