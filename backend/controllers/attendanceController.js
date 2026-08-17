const { Attendance } = require('../models/Others');
const Intern = require('../models/Intern');

exports.checkIn = async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user._id });
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({ intern: intern._id, date: today });
    if (existing?.loginTime) return res.status(400).json({ success: false, message: 'Already checked in' });

    const loginTime = new Date();
    const isLate = loginTime.getHours() >= 10;
    const attendance = existing
      ? await Attendance.findByIdAndUpdate(existing._id, { loginTime, status: isLate ? 'late' : 'present', ipAddress: req.ip, deviceInfo: req.headers['user-agent']?.substring(0, 100) }, { new: true })
      : await Attendance.create({ intern: intern._id, date: today, loginTime, status: isLate ? 'late' : 'present', ipAddress: req.ip, deviceInfo: req.headers['user-agent']?.substring(0, 100) });

    res.json({ success: true, data: attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user._id });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({ intern: intern._id, date: today });
    if (!attendance?.loginTime) return res.status(400).json({ success: false, message: 'Not checked in' });
    if (attendance.logoutTime) return res.status(400).json({ success: false, message: 'Already checked out' });

    const logoutTime = new Date();
    const workHours = ((logoutTime - attendance.loginTime) / (1000 * 60 * 60)).toFixed(2);
    const updated = await Attendance.findByIdAndUpdate(attendance._id, { logoutTime, workHours: Number(workHours) }, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user._id });
    const { month, year } = req.query;
    const start = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);

    const records = await Attendance.find({ intern: intern._id, date: { $gte: start, $lte: end } }).sort({ date: 1 });
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status !== 'absent').length;
    const percentage = totalDays ? Math.round((presentDays / totalDays) * 100) : 0;

    res.json({ success: true, data: records, stats: { totalDays, presentDays, percentage, totalHours: records.reduce((s, r) => s + (r.workHours || 0), 0).toFixed(1) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const { date, internId, month, year } = req.query;
    const query = {};
    if (internId) query.intern = internId;
    if (date) { const d = new Date(date); d.setHours(0,0,0,0); query.date = d; }
    else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query)
      .populate({ path: 'intern', populate: { path: 'user', select: 'name email avatar' } })
      .sort({ date: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.manualOverride = async (req, res) => {
  try {
    const { internId, date, status, loginTime, logoutTime, notes } = req.body;
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const workHours = loginTime && logoutTime ? ((new Date(logoutTime) - new Date(loginTime)) / (1000 * 60 * 60)).toFixed(2) : 0;
    const attendance = await Attendance.findOneAndUpdate(
      { intern: internId, date: d },
      { status, loginTime, logoutTime, workHours, notes, isManualOverride: true, overrideBy: req.user._id },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
