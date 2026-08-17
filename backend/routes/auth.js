// routes/auth.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', ctrl.login);
router.post('/logout', protect, ctrl.logout);
router.post('/refresh', ctrl.refreshToken);
router.get('/me', protect, ctrl.getMe);
router.post('/forgot-password', ctrl.forgotPassword);
router.put('/reset-password/:token', ctrl.resetPassword);
router.put('/preferences', protect, ctrl.updatePreferences);

module.exports = router;
