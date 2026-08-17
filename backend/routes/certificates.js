// certificates.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.post('/generate', authorize('admin'), ctrl.generateCertificate);
router.get('/verify/:id', ctrl.verifyCertificate);
router.get('/my', authorize('intern'), ctrl.getMyCertificates);
router.get('/learning-eligibility', authorize('intern'), ctrl.getLearningEligibility);
router.get('/project-eligibility', authorize('intern'), ctrl.getProjectEligibility);
module.exports = router;
