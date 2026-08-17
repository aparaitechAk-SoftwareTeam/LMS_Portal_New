const User = require('../models/User');
const Intern = require('../models/Intern');
const { Notification } = require('../models/Others');
const emailService = require('../services/emailService');
const cloudinary = require('../config/cloudinary');
const ExcelJS = require('exceljs');

exports.getAllInterns = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, department, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    const query = {};
    if (status) query.status = status;
    if (department) query.department = department;

    let internIds = [];
    if (search) {
      const users = await User.find({ name: { $regex: search, $options: 'i' }, role: 'intern' }).select('_id');
      internIds = users.map(u => u._id);
      query.$or = [{ internId: { $regex: search, $options: 'i' } }, { user: { $in: internIds } }];
    }

    const total = await Intern.countDocuments(query);
    const interns = await Intern.find(query)
      .populate('user', 'name email phone avatar isActive lastLogin')
      .populate('team', 'name')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: interns, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createIntern = async (req, res) => {
  try {
    const { name, email, password, phone, department, techStack, college, internshipStart, internshipEnd, mentor, stipend } = req.body;

    if (!name || !email || !department || !internshipStart || !internshipEnd) {
      return res.status(400).json({ success: false, message: 'Name, email, department, internshipStart and internshipEnd are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already exists' });

    const parsedTechStack = typeof techStack === 'string' ? JSON.parse(techStack || '[]') : (techStack || []);
    const parsedCollege = typeof college === 'string' ? JSON.parse(college || '{}') : (college || {});

    const user = await User.create({ name, email, password: password || 'Intern@123', phone, role: 'intern' });
    const intern = await Intern.create({
      user: user._id, department, techStack: parsedTechStack,
      college: parsedCollege, internshipStart, internshipEnd, mentor, stipend
    });

    await emailService.sendWelcomeEmail(email, name, email, password || 'Intern@123');
    res.status(201).json({ success: true, data: { user: user.toJSON(), intern } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateIntern = async (req, res) => {
  try {
    const intern = await Intern.findById(req.params.id);
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });

    const { name, phone, avatar, ...internFields } = req.body;
    if (name || phone || avatar) {
      await User.findByIdAndUpdate(intern.user, { name, phone, avatar });
    }
    Object.assign(intern, internFields);
    await intern.save();

    const updated = await Intern.findById(req.params.id).populate('user', 'name email phone avatar');
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteIntern = async (req, res) => {
  try {
    const intern = await Intern.findById(req.params.id);
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });
    await User.findByIdAndUpdate(intern.user, { isActive: false });
    intern.status = 'terminated';
    await intern.save();
    res.json({ success: true, message: 'Intern deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInternById = async (req, res) => {
  try {
    const intern = await Intern.findById(req.params.id)
      .populate('user', 'name email phone avatar lastLogin loginHistory preferences')
      .populate('team', 'name members')
      .populate('projects', 'title status progress');
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });
    res.json({ success: true, data: intern });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.bulkImport = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];
    const results = { created: 0, failed: [], skipped: 0 };

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const email = row.getCell(2).value;
      if (!email) continue;
      try {
        const exists = await User.findOne({ email: email.toString() });
        if (exists) { results.skipped++; continue; }

        const password = 'Intern@' + Math.floor(1000 + Math.random() * 9000);
        const user = await User.create({ name: row.getCell(1).value, email: email.toString(), password, role: 'intern', phone: row.getCell(3).value });
        await Intern.create({ user: user._id, department: row.getCell(4).value, techStack: [row.getCell(5).value], internshipStart: new Date(row.getCell(6).value), internshipEnd: new Date(row.getCell(7).value) });
        await emailService.sendWelcomeEmail(email.toString(), row.getCell(1).value, email.toString(), password);
        results.created++;
      } catch (e) {
        results.failed.push({ row: i, error: e.message });
      }
    }
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user._id })
      .populate('user', 'name email phone avatar preferences')
      .populate('team', 'name leader members')
      .populate('projects', 'title status progress milestones');
    if (!intern) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, data: intern });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user._id });
    if (!intern) return res.status(404).json({ success: false, message: 'Profile not found' });

    const { name, phone, skills, github, linkedin, address, emergencyContact, college } = req.body;
    await User.findByIdAndUpdate(req.user._id, { name, phone });
    Object.assign(intern, { skills, github, linkedin, address, emergencyContact, college });
    await intern.save();
    res.json({ success: true, data: intern });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
