const express  = require('express');
const router   = express.Router();
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Payment  = require('../models/Payment');
const Intern   = require('../models/Intern');
const { Project } = require('../models/ProjectTask');
const { Notification } = require('../models/Others');
const { protect, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');
const { LearningEnrollment } = require('../models/Learning');

const activatePurchasedCourse = async (payment, intern, fallbackUserId) => {
  if (payment.type !== 'course_purchase' || !payment.course) return null;
  const enrolledBy = payment.recordedBy || fallbackUserId || intern.user;
  if (!enrolledBy) throw new Error('Course enrollment owner is missing');
  return LearningEnrollment.findOneAndUpdate(
    { course: payment.course, intern: intern._id },
    { $set: { status: 'active', source: 'payment', enrolledBy } },
    { new: true, upsert: true, runValidators: true }
  );
};

const rzp = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

// ── Admin: Assign project fee to intern ──────────────────────────────────────
router.post('/assign-fee', protect, authorize('admin'), async (req, res) => {
  try {
    const { internId, projectId, amount, title, description, dueDate } = req.body;

    const intern = await Intern.findById(internId).populate('user', 'name email');
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });

    const payment = await Payment.create({
      intern:      internId,
      project:     projectId || null,
      type:        'project_fee',
      title:       title || 'Project Fee',
      description: description || '',
      amount:      Number(amount),
      currency:    'INR',
      status:      'pending',
      dueDate:     dueDate || null,
      paymentMethod: 'razorpay',
      recordedBy:  req.user._id,
    });

    // Notify intern
    const io = req.app.get('io');
    const notif = await Notification.create({
      recipient: intern.user._id,
      sender:    req.user._id,
      type:      'announcement',
      title:     `Payment Due: ${payment.title}`,
      message:   `A fee of ₹${amount} has been assigned. Please complete payment.`,
      link:      '/intern/payments',
    });
    io?.to(intern.user._id.toString()).emit('notification', notif);

    // Email intern
    await emailService.sendPaymentAssigned(intern.user.email, intern.user.name, payment).catch(() => {});

    res.status(201).json({ success: true, data: payment });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Admin: List all project fees ─────────────────────────────────────────────
router.get('/fees', protect, authorize('admin'), async (req, res) => {
  try {
    const { internId, status, page = 1, limit = 20 } = req.query;
    const q = { type: 'project_fee' };
    if (internId) q.intern = internId;
    if (status)   q.status = status;
    const total = await Payment.countDocuments(q);
    const fees  = await Payment.find(q)
      .populate({ path: 'intern', populate: { path: 'user', select: 'name email avatar' } })
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, data: fees, pagination: { total, page: +page, pages: Math.ceil(total / limit) } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Admin: Delete fee ────────────────────────────────────────────────────────
router.delete('/fees/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Intern: Get my pending payments ─────────────────────────────────────────
router.get('/my-payments', protect, authorize('intern'), async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user._id });
    if (!intern) return res.status(404).json({ success: false, message: 'Intern not found' });
    const payments = await Payment.find({ intern: intern._id })
      .populate('project', 'title description')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Intern: Create Razorpay order ────────────────────────────────────────────
router.post('/create-order', protect, authorize('intern'), async (req, res) => {
  try {
    if (!rzp) {
      return res.status(503).json({ success: false, message: 'Razorpay is not configured' });
    }
    const { paymentId } = req.body;
    const intern  = await Intern.findOne({ user: req.user._id });
    const payment = await Payment.findOne({ _id: paymentId, intern: intern._id });

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status === 'paid') return res.status(400).json({ success: false, message: 'Already paid' });

    const receipt = `rcpt_${payment._id.toString().slice(-8)}_${Date.now()}`;
    const order = await rzp.orders.create({
      amount:   payment.amount * 100,  // paise
      currency: payment.currency || 'INR',
      receipt,
      notes: {
        paymentId:   payment._id.toString(),
        internId:    intern._id.toString(),
        title:       payment.title,
        invoiceNumber: payment.invoiceNumber,
      },
    });

    // Save order id
    payment.razorpayOrderId  = order.id;
    payment.razorpayReceipt  = receipt;
    payment.status           = 'initiated';
    await payment.save();

    res.json({
      success: true,
      data: {
        orderId:   order.id,
        amount:    order.amount,
        currency:  order.currency,
        keyId:     process.env.RAZORPAY_KEY_ID,
        payment:   payment,
        internName: req.user.name,
        internEmail: req.user.email,
      }
    });
  } catch (e) {
    console.error('Razorpay order error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Intern: Verify payment after success ─────────────────────────────────────
router.post('/verify', protect, authorize('intern'), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    // Signature verification
    const body      = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected  = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature mismatch. Contact support.' });
    }

    const intern  = await Intern.findOne({ user: req.user._id }).populate('user', 'name email');
    const existingPayment = await Payment.findOne({ _id: paymentId, intern: intern._id });
    if (!existingPayment) return res.status(404).json({ success: false, message: 'Payment record not found' });
    if (existingPayment.razorpayOrderId !== razorpay_order_id) return res.status(400).json({ success: false, message: 'Payment order does not match' });
    const payment = await Payment.findOneAndUpdate(
      { _id: paymentId, intern: intern._id, razorpayOrderId: razorpay_order_id },
      {
        status:            'paid',
        paidDate:          new Date(),
        paymentMethod:     'razorpay',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        transactionId:     razorpay_payment_id,
      },
      { new: true }
    ).populate('project', 'title').populate('course', 'title');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });
    await activatePurchasedCourse(payment, intern, req.user._id);

    // Notify admin
    const io = req.app.get('io');
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    for (const admin of admins) {
      const notif = await Notification.create({
        recipient: admin._id,
        type:      'announcement',
        title:     'Payment Received',
        message:   `${intern.user.name} paid ₹${payment.amount} — ${payment.title}`,
        link:      payment.type === 'course_purchase' ? '/admin/learning' : '/admin/revenue',
      });
      io?.to(admin._id.toString()).emit('notification', notif);
    }

    // Receipt email
    await emailService.sendPaymentReceipt(intern.user.email, intern.user.name, payment).catch(() => {});

    res.json({ success: true, data: payment });
  } catch (e) {
    console.error('Verify error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Razorpay Webhook (server-to-server) ──────────────────────────────────────
const webhookHandler = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const digest    = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(req.body).digest('hex');
    if (digest !== signature) return res.status(400).json({ error: 'Invalid signature' });

    const event = JSON.parse(req.body.toString());
    if (event.event === 'payment.captured') {
      const entity  = event.payload.payment.entity;
      const orderId = entity.order_id;
      const payment = await Payment.findOneAndUpdate(
        { razorpayOrderId: orderId },
        { status: 'paid', paidDate: new Date(), razorpayPaymentId: entity.id, transactionId: entity.id }, { new: true }
      );
      if (payment?.type === 'course_purchase') {
        const intern = await Intern.findById(payment.intern);
        if (intern) await activatePurchasedCourse(payment, intern);
      }
    }
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

router.post('/webhook', express.raw({ type: 'application/json' }), webhookHandler);

module.exports = router;
module.exports.webhookHandler = webhookHandler;
