const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ActivityLog } = require('../models/Others');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'User not found or deactivated' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Role '${req.user.role}' not authorized` });
  }
  next();
};

exports.logActivity = (action, module) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode < 400 && req.user) {
      await ActivityLog.create({
        user: req.user._id,
        action, module,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(() => {});
    }
  });
  next();
};
