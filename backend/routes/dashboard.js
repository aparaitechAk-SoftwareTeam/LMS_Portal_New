const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.get('/admin', authorize('admin'), ctrl.getAdminDashboard);
router.get('/intern', authorize('intern'), ctrl.getInternDashboard);
module.exports = router;
