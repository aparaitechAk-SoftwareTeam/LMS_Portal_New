const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { protect, authorize } = require('../middleware/auth');
const Intern = require('../models/Intern');
const { Task, Submission } = require('../models/ProjectTask');
const { Attendance } = require('../models/Others');
const { Certificate } = require('../models/Others');
const { LearningEnrollment } = require('../models/Learning');
const Payment = require('../models/Payment');

router.use(protect, authorize('admin'));

router.get('/interns/excel', async (req, res) => {
  try {
    const interns = await Intern.find().populate('user', 'name email phone');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Interns');
    sheet.columns = [
      { header: 'Intern ID', key: 'internId', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Start Date', key: 'start', width: 15 },
      { header: 'End Date', key: 'end', width: 15 },
      { header: 'Performance', key: 'score', width: 15 }
    ];
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    interns.forEach(i => sheet.addRow({
      internId: i.internId, name: i.user?.name, email: i.user?.email,
      department: i.department, status: i.status,
      start: i.internshipStart?.toDateString(), end: i.internshipEnd?.toDateString(),
      score: i.performanceScore
    }));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=interns.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/attendance/excel', async (req, res) => {
  try {
    const { month, year } = req.query;
    const start = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const records = await Attendance.find({ date: { $gte: start, $lte: end } })
      .populate({ path: 'intern', populate: { path: 'user', select: 'name email' } });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');
    sheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Login', key: 'login', width: 15 },
      { header: 'Logout', key: 'logout', width: 15 },
      { header: 'Hours', key: 'hours', width: 10 }
    ];
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    records.forEach(r => sheet.addRow({
      name: r.intern?.user?.name, date: r.date?.toDateString(),
      status: r.status, login: r.loginTime ? new Date(r.loginTime).toLocaleTimeString() : '-',
      logout: r.logoutTime ? new Date(r.logoutTime).toLocaleTimeString() : '-', hours: r.workHours
    }));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/learning/excel', async (req, res) => {
  try {
    const enrollments = await LearningEnrollment.find().populate('course', 'title domain').populate({ path: 'intern', populate: { path: 'user', select: 'name email' } }).sort({ updatedAt: -1 });
    const certificates = await Certificate.find({ learningCourse: { $exists: true } }).select('intern learningCourse type certificateId');
    const paidPurchases = await Payment.find({ type: 'course_purchase', status: 'paid' }).select('intern course amount');
    const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('Learning Progress');
    sheet.columns = [{ header:'Student',key:'student',width:25 },{ header:'Email',key:'email',width:30 },{ header:'Course',key:'course',width:28 },{ header:'Domain',key:'domain',width:18 },{ header:'Progress %',key:'progress',width:14 },{ header:'Status',key:'status',width:14 },{ header:'Source',key:'source',width:20 },{ header:'Paid Amount',key:'paid',width:14 },{ header:'75% Certificate',key:'progressCert',width:22 },{ header:'Completion Certificate',key:'completionCert',width:24 },{ header:'Last Updated',key:'updated',width:20 }];
    sheet.getRow(1).font = { bold:true, color:{ argb:'FFFFFFFF' } }; sheet.getRow(1).fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF7C3AED' } };
    enrollments.forEach(enrollment => { const internId=String(enrollment.intern?._id||enrollment.intern), courseId=String(enrollment.course?._id||enrollment.course); const cert=type=>certificates.find(item=>String(item.intern)===internId&&String(item.learningCourse)===courseId&&item.type===type)?.certificateId||'—'; const paid=paidPurchases.filter(item=>String(item.intern)===internId&&String(item.course)===courseId).reduce((sum,item)=>sum+item.amount,0); sheet.addRow({ student:enrollment.intern?.user?.name||'—',email:enrollment.intern?.user?.email||'—',course:enrollment.course?.title||'—',domain:enrollment.course?.domain||'—',progress:enrollment.progressPercent,status:enrollment.status,source:enrollment.source,paid,progressCert:cert('progress'),completionCert:cert('completion'),updated:enrollment.updatedAt?.toLocaleString() }); });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', 'attachment; filename=learning-progress.xlsx'); await workbook.xlsx.write(res); res.end();
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
