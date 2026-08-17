const express = require('express');
const router = express.Router();
const { protect, authorize, logActivity } = require('../middleware/auth');
const Intern = require('../models/Intern');
const { LearningCourse, LearningEnrollment } = require('../models/Learning');

const sortModules = (modules = []) => [...modules]
  .sort((a, b) => a.order - b.order)
  .map(module => ({ ...module.toObject?.() || module, lessons: [...(module.lessons || [])].sort((a, b) => a.order - b.order) }));

const lessonIdsFor = course => course.modules.flatMap(module => module.lessons.map(lesson => lesson.lessonId));

const internForRequest = async userId => Intern.findOne({ user: userId });

router.use(protect);

// Admin course management. Courses stay private until explicitly published.
router.post('/', authorize('admin'), logActivity('create_learning_course', 'learning'), async (req, res) => {
  try {
    const { title, description, domain, thumbnailUrl, status, isLocked, isTrending, price, discountPercent, modules } = req.body;
    if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description are required' });
    const course = await LearningCourse.create({ title, description, domain, thumbnailUrl, status, isLocked, isTrending, price, discountPercent, modules, createdBy: req.user._id });
    res.status(201).json({ success: true, data: course });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.get('/', async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { status: 'published' };
    if (req.query.domain) query.domain = req.query.domain;
    const courses = await LearningCourse.find(query).select('-modules').sort({ isTrending: -1, createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/my-courses', authorize('intern'), async (req, res) => {
  try {
    const intern = await internForRequest(req.user._id);
    if (!intern) return res.status(404).json({ success: false, message: 'Intern profile not found' });
    const enrollments = await LearningEnrollment.find({ intern: intern._id, status: { $in: ['active', 'completed'] } })
      .populate('course', 'title description domain thumbnailUrl status isLocked')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: enrollments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// A student can enrol immediately only when the published course is free.
router.post('/:id/self-enroll', authorize('intern'), logActivity('self_enroll_learning_course', 'learning'), async (req, res) => {
  try {
    const [course, intern] = await Promise.all([LearningCourse.findById(req.params.id), internForRequest(req.user._id)]);
    if (!course || course.status !== 'published') return res.status(404).json({ success: false, message: 'Course not found' });
    if (!intern) return res.status(404).json({ success: false, message: 'Intern profile not found' });
    const payableAmount = Math.round(Number(course.price || 0) * (100 - Number(course.discountPercent || 0))) / 100;
    if (payableAmount > 0) return res.status(402).json({ success: false, message: 'Payment is required for this course', code: 'PAYMENT_REQUIRED' });
    const enrollment = await LearningEnrollment.findOneAndUpdate(
      { course: course._id, intern: intern._id },
      { $set: { status: 'active', source: 'self_enrollment', enrolledBy: req.user._id } },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ success: true, data: enrollment });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// Creates a payment record only; enrollment is created after Razorpay signature verification.
router.post('/:id/purchase', authorize('intern'), logActivity('start_learning_purchase', 'learning'), async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const [course, intern] = await Promise.all([LearningCourse.findById(req.params.id), internForRequest(req.user._id)]);
    if (!course || course.status !== 'published') return res.status(404).json({ success: false, message: 'Course not found' });
    if (!intern) return res.status(404).json({ success: false, message: 'Intern profile not found' });
    const amount = Math.round(Number(course.price || 0) * (100 - Number(course.discountPercent || 0))) / 100;
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Use free enrollment for this course' });
    const alreadyEnrolled = await LearningEnrollment.exists({ course: course._id, intern: intern._id, status: { $in: ['active', 'completed'] } });
    if (alreadyEnrolled) return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
    let payment = await Payment.findOne({ course: course._id, intern: intern._id, type: 'course_purchase', status: { $in: ['pending', 'initiated'] } }).sort({ createdAt: -1 });
    if (!payment || payment.amount !== amount) {
      payment = await Payment.create({ intern: intern._id, course: course._id, type: 'course_purchase', title: `Course: ${course.title}`, description: course.description.slice(0, 500), amount, currency: 'INR', status: 'pending', paymentMethod: 'razorpay', recordedBy: req.user._id });
    }
    res.status(201).json({ success: true, data: payment });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.get('/:id/enrollments', authorize('admin'), async (req, res) => {
  try {
    const enrollments = await LearningEnrollment.find({ course: req.params.id })
      .populate({ path: 'intern', populate: { path: 'user', select: 'name email' } }).sort({ createdAt: -1 });
    res.json({ success: true, data: enrollments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const course = await LearningCourse.findById(req.params.id);
    if (!course || (req.user.role !== 'admin' && course.status !== 'published')) return res.status(404).json({ success: false, message: 'Course not found' });
    const intern = req.user.role === 'intern' ? await internForRequest(req.user._id) : null;
    const enrollment = intern ? await LearningEnrollment.findOne({ course: course._id, intern: intern._id, status: { $in: ['active', 'completed'] } }) : null;
    const data = course.toObject();
    data.modules = sortModules(data.modules).map(module => ({
      ...module,
      lessons: module.lessons.map(lesson => enrollment || lesson.isPreview
        ? lesson
        : { ...lesson, videoUrl: '', resourceUrl: '' })
    }));
    data.enrollment = enrollment ? { progressPercent: enrollment.progressPercent, status: enrollment.status, completedLessonIds: enrollment.completedLessonIds } : null;
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', authorize('admin'), logActivity('update_learning_course', 'learning'), async (req, res) => {
  try {
    const allowed = ['title', 'description', 'domain', 'thumbnailUrl', 'status', 'isLocked', 'isTrending', 'price', 'discountPercent', 'modules'];
    const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    changes.updatedBy = req.user._id;
    const course = await LearningCourse.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.post('/:id/enrollments', authorize('admin'), logActivity('assign_learning_course', 'learning'), async (req, res) => {
  try {
    const { internId, source = 'admin_assignment' } = req.body;
    const [course, intern] = await Promise.all([LearningCourse.findById(req.params.id), Intern.findById(internId)]);
    if (!course || !intern) return res.status(404).json({ success: false, message: 'Course or intern not found' });
    const enrollment = await LearningEnrollment.findOneAndUpdate(
      { course: course._id, intern: intern._id },
      { $set: { status: 'active', source, enrolledBy: req.user._id } },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ success: true, data: enrollment });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/:id/enrollments/:internId', authorize('admin'), logActivity('revoke_learning_course', 'learning'), async (req, res) => {
  try {
    const enrollment = await LearningEnrollment.findOneAndUpdate(
      { course: req.params.id, intern: req.params.internId }, { status: 'revoked' }, { new: true }
    );
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });
    res.json({ success: true, data: enrollment });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.post('/:id/progress', authorize('intern'), logActivity('complete_learning_lesson', 'learning'), async (req, res) => {
  try {
    const { lessonId } = req.body;
    const intern = await internForRequest(req.user._id);
    const [course, enrollment] = await Promise.all([
      LearningCourse.findById(req.params.id),
      intern && LearningEnrollment.findOne({ course: req.params.id, intern: intern._id, status: 'active' })
    ]);
    if (!course || !enrollment) return res.status(403).json({ success: false, message: 'An active enrollment is required' });
    if (!lessonIdsFor(course).includes(lessonId)) return res.status(400).json({ success: false, message: 'Lesson does not belong to this course' });
    if (!enrollment.completedLessonIds.includes(lessonId)) enrollment.completedLessonIds.push(lessonId);
    const total = lessonIdsFor(course).length;
    enrollment.progressPercent = total ? Math.round((enrollment.completedLessonIds.length / total) * 100) : 0;
    if (enrollment.progressPercent === 100) { enrollment.status = 'completed'; enrollment.completedAt = new Date(); }
    await enrollment.save();
    res.json({ success: true, data: enrollment });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;
