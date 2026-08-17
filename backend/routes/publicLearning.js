const express = require('express');
const router = express.Router();
const { LearningCourse } = require('../models/Learning');
const PublicInquiry = require('../models/PublicInquiry');

// Public catalog deliberately returns no private content, enrollments, or resource URLs.
router.get('/courses', async (req, res) => {
  try {
    const query = { status: 'published' };
    if (req.query.domain) query.domain = req.query.domain;
    const courses = await LearningCourse.find(query)
      .select('title description domain thumbnailUrl isTrending price discountPercent modules createdAt')
      .sort({ isTrending: -1, createdAt: -1 }).lean();
    res.json({ success: true, data: courses.map(course => ({
      ...course,
      modules: undefined,
      lessonCount: course.modules.reduce((count, module) => count + module.lessons.length, 0),
      durationMinutes: course.modules.reduce((count, module) => count + module.lessons.reduce((sum, lesson) => sum + (lesson.durationMinutes || 0), 0), 0)
    })) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/courses/:id', async (req, res) => {
  try {
    const course = await LearningCourse.findOne({ _id: req.params.id, status: 'published' }).lean();
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    course.modules = course.modules.map(module => ({
      moduleId: module.moduleId, title: module.title, order: module.order,
      lessons: module.lessons.map(lesson => ({ lessonId: lesson.lessonId, title: lesson.title, durationMinutes: lesson.durationMinutes, isPreview: lesson.isPreview, videoUrl: lesson.isPreview ? lesson.videoUrl : '' }))
    }));
    res.json({ success: true, data: course });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/inquiries', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (![name, email, subject, message].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'Name, email, subject and message are required' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    }
    const inquiry = await PublicInquiry.create({ name, email, phone, subject, message });
    res.status(201).json({ success: true, data: { id: inquiry._id }, message: 'Your inquiry has been sent' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
