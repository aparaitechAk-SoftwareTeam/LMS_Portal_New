// routes/interns.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/internController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);
router.get('/', authorize('admin'), ctrl.getAllInterns);
router.post('/', authorize('admin'), ctrl.createIntern);
router.post('/bulk-import', authorize('admin'), upload.single('file'), ctrl.bulkImport);
router.get('/me', authorize('intern'), ctrl.getMyProfile);
router.put('/me', authorize('intern'), ctrl.updateMyProfile);
router.get('/:id', ctrl.getInternById);
router.put('/:id', authorize('admin'), ctrl.updateIntern);
router.delete('/:id', authorize('admin'), ctrl.deleteIntern);

module.exports = router;
