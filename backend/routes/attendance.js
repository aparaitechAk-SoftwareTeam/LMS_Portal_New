// routes/attendance.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.post('/check-in', authorize('intern'), ctrl.checkIn);
router.post('/check-out', authorize('intern'), ctrl.checkOut);
router.get('/my', authorize('intern'), ctrl.getMyAttendance);
router.get('/', authorize('admin'), ctrl.getAllAttendance);
router.post('/override', authorize('admin'), ctrl.manualOverride);
module.exports = router;
