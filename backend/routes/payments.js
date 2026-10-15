const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Intern = require('../models/Intern');
const { FeeStructure } = require('../models/Others');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/fee-structure', async (req, res) => {
  try { const setting = await FeeStructure.findOneAndUpdate({ key: 'default' }, { $setOnInsert: { key: 'default' } }, { new: true, upsert: true }); res.json({ success: true, data: setting }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/fee-structure', async (req, res) => {
  try { const { onboardingAmount, finalAmount } = req.body; if (![onboardingAmount, finalAmount].every(value => Number.isFinite(Number(value)) && Number(value) >= 0)) return res.status(400).json({ success:false, message:'Enter valid non-negative amounts' }); const setting = await FeeStructure.findOneAndUpdate({ key:'default' }, { onboardingAmount:Number(onboardingAmount), finalAmount:Number(finalAmount), updatedBy:req.user._id }, { new:true, upsert:true, runValidators:true }); res.json({ success:true, data:setting }); }
  catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/apply-fee-structure/:internId', async (req, res) => {
  try {
    const [intern, setting] = await Promise.all([Intern.findById(req.params.internId), FeeStructure.findOne({ key:'default' })]);
    if (!intern || !setting) return res.status(404).json({ success:false, message:'Student or fee structure not found' });
    const entries = [['onboarding', setting.onboardingAmount, 'Onboarding Fee'], ['final', setting.finalAmount, 'Final Internship Fee']];
    const results = [];
    for (const [type, amount, title] of entries) {
      let payment = await Payment.findOne({ intern: intern._id, type }).sort({ createdAt:-1 });
      if (!payment) payment = await Payment.create({ intern:intern._id, type, title, description:`${title} set by the current admin fee structure.`, amount, status:'pending', paymentMethod:'razorpay', recordedBy:req.user._id });
      else if (payment.status !== 'paid') { payment.amount=amount; payment.title=title; payment.description=`${title} set by the current admin fee structure.`; await payment.save(); }
      results.push(payment);
    }
    res.json({ success:true, data:results });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// Analytics summary
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const now = new Date();

    // Total revenue
    const [totalPaid, totalPending, totalOverdue] = await Promise.all([
      Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'overdue' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    // Time-series revenue (last 12 periods)
    let groupId, periods = 12;
    if (period === 'daily')   groupId = { year: { $year: '$paidDate' }, month: { $month: '$paidDate' }, day: { $dayOfMonth: '$paidDate' } };
    if (period === 'weekly')  groupId = { year: { $year: '$paidDate' }, week: { $isoWeek: '$paidDate' } };
    if (period === 'monthly') groupId = { year: { $year: '$paidDate' }, month: { $month: '$paidDate' } };
    if (period === 'yearly')  groupId = { year: { $year: '$paidDate' } };

    const timeSeries = await Payment.aggregate([
      { $match: { status: 'paid', paidDate: { $exists: true } } },
      { $group: { _id: groupId, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: periods }
    ]);

    // Domain-wise breakdown
    const domainRevenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $lookup: { from: 'domains', localField: 'domain', foreignField: '_id', as: 'domainData' } },
      { $unwind: { path: '$domainData', preserveNullAndEmpty: true } },
      { $group: { _id: { $ifNull: ['$domainData.name', 'Unassigned'] }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    // Payment type breakdown
    const typeBreakdown = await Payment.aggregate([
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // Status distribution
    const statusDist = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
    ]);

    // Recent payments
    const recent = await Payment.find()
      .populate({ path: 'intern', populate: { path: 'user', select: 'name email' } })
      .populate('domain', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        summary: {
          totalPaid: totalPaid[0]?.total || 0,
          totalPending: totalPending[0]?.total || 0,
          totalOverdue: totalOverdue[0]?.total || 0,
        },
        timeSeries: timeSeries.reverse(),
        domainRevenue,
        typeBreakdown,
        statusDist,
        recent
      }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Internship plan payments are intentionally separated from project fees.
router.get('/course-sales', async (req, res) => {
  try {
    const { status } = req.query;
    const query = { type: 'onboarding' };
    if (status) query.status = status;
    const sales = await Payment.find(query)
      .populate({ path: 'intern', populate: { path: 'user', select: 'name email' } })
      .populate('course', 'title domain')
      .sort({ createdAt: -1 });
    const summary = sales.reduce((result, sale) => {
      result.count += 1;
      if (sale.status === 'paid') result.collected += sale.amount;
      else if (['pending', 'initiated'].includes(sale.status)) result.pending += sale.amount;
      return result;
    }, { count: 0, collected: 0, pending: 0 });
    res.json({ success: true, data: sales, summary });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// List payments
router.get('/', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const q = {};
    if (status) q.status = status;
    if (type)   q.type   = type;
    const total = await Payment.countDocuments(q);
    const payments = await Payment.find(q)
      .populate({ path: 'intern', populate: { path: 'user', select: 'name email' } })
      .populate('domain', 'name color')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, data: payments, pagination: { total, page: +page, pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Create payment record
router.post('/', async (req, res) => {
  try {
    const payment = await Payment.create({ ...req.body, recordedBy: req.user._id });
    res.status(201).json({ success: true, data: payment });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Update payment status
router.put('/:id', async (req, res) => {
  try {
    if (req.body.status === 'paid' && !req.body.paidDate) req.body.paidDate = new Date();
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate({ path: 'intern', populate: { path: 'user', select: 'name email' } });
    res.json({ success: true, data: payment });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Excel export
router.get('/export/excel', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({ path: 'intern', populate: { path: 'user', select: 'name email' } })
      .populate('domain', 'name').sort({ createdAt: -1 });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Payments');
    ws.columns = [
      { header: 'Invoice',     key: 'inv',    width: 16 },
      { header: 'Student',     key: 'name',   width: 24 },
      { header: 'Email',       key: 'email',  width: 28 },
      { header: 'Type',        key: 'type',   width: 14 },
      { header: 'Amount (₹)', key: 'amount', width: 14 },
      { header: 'Status',      key: 'status', width: 12 },
      { header: 'Domain',      key: 'domain', width: 18 },
      { header: 'Due Date',    key: 'due',    width: 14 },
      { header: 'Paid Date',   key: 'paid',   width: 14 },
      { header: 'Method',      key: 'method', width: 14 },
    ];
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
    payments.forEach(p => ws.addRow({
      inv: p.invoiceNumber, name: p.intern?.user?.name, email: p.intern?.user?.email,
      type: p.type, amount: p.amount, status: p.status, domain: p.domain?.name || '—',
      due: p.dueDate ? new Date(p.dueDate).toDateString() : '—',
      paid: p.paidDate ? new Date(p.paidDate).toDateString() : '—',
      method: p.paymentMethod,
    }));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=payments.xlsx');
    await wb.xlsx.write(res); res.end();
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PDF export
router.get('/export/pdf', async (req, res) => {
  try {
    const payments = await Payment.find({ status: { $in: ['paid','pending','overdue'] } })
      .populate({ path: 'intern', populate: { path: 'user', select: 'name email' } })
      .populate('domain', 'name').sort({ createdAt: -1 }).limit(100);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=revenue-report.pdf');
    doc.pipe(res);
    doc.rect(0, 0, doc.page.width, 70).fill('#7c3aed');
    doc.fillColor('#fff').fontSize(18).font('Helvetica-Bold').text('Revenue Report', 40, 22);
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toDateString()}`, 40, 46);
    doc.fillColor('#1e1b4b').fontSize(11).font('Helvetica-Bold');
    let y = 90;
    const paid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const pending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
    doc.text(`Total Collected: ₹${paid.toLocaleString()}`, 40, y);
    doc.text(`Pending: ₹${pending.toLocaleString()}`, 240, y); y += 30;
    const cols = [40, 150, 290, 360, 430, 500];
    const headers = ['Invoice', 'Student', 'Type', 'Amount', 'Status', 'Date'];
    doc.rect(30, y, doc.page.width - 60, 20).fill('#ede9fe');
    doc.fillColor('#4c1d95').fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, cols[i], y + 5));
    y += 22;
    payments.slice(0, 40).forEach((p, idx) => {
      if (idx % 2 === 0) doc.rect(30, y, doc.page.width - 60, 18).fill('#fafafa');
      doc.fillColor('#374151').fontSize(8).font('Helvetica');
      doc.text(p.invoiceNumber || '—', cols[0], y + 4);
      doc.text(p.intern?.user?.name?.slice(0, 16) || '—', cols[1], y + 4);
      doc.text(p.type, cols[2], y + 4);
      doc.text(`₹${p.amount}`, cols[3], y + 4);
      doc.text(p.status, cols[4], y + 4);
      doc.text(p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—', cols[5], y + 4);
      y += 18; if (y > 760) { doc.addPage(); y = 40; }
    });
    doc.end();
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
