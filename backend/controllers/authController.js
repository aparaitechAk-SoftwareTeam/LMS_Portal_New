const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Intern = require('../models/Intern');
const emailService = require('../services/emailService');

const signToken   = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRE        });
const signRefresh = (id)       => jwt.sign({ id },      process.env.JWT_REFRESH_SECRET,  { expiresIn: process.env.JWT_REFRESH_EXPIRE });

const populateIntern = (userId) =>
  Intern.findOne({ user: userId })
    .populate('team',     '_id name description')
    .populate('projects', 'title status progress');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive)
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });

    const token        = signToken(user._id, user.role);
    const refreshToken = signRefresh(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin    = new Date();
    user.loginHistory.push({
      ip:     req.ip,
      device: req.headers['user-agent']?.substring(0, 100),
    });
    if (user.loginHistory.length > 20) user.loginHistory = user.loginHistory.slice(-20);
    await user.save();

    const internData = user.role === 'intern' ? await populateIntern(user._id) : null;

    res.json({ success: true, token, refreshToken, user: user.toJSON(), internData });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ success: false, message: 'No refresh token' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findOne({ _id: decoded.id, refreshToken });
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const newToken = signToken(user._id, user.role);
    res.json({ success: true, token: newToken });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Refresh token expired' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user       = await User.findById(req.user._id);
    const internData = user.role === 'intern' ? await populateIntern(user._id) : null;
    res.json({ success: true, user, internData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(404).json({ success: false, message: 'No account with that email' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await emailService.sendPasswordReset(user.email, user.name, resetUrl);

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hash, resetPasswordExpire: { $gt: Date.now() } });
    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    user.password            = req.body.password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { preferences: req.body }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
