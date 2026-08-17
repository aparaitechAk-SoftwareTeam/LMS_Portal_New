// routes/tasks.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');
const cloudinaryStorage = require('../config/cloudinaryStorage');
const multer = require('multer');
const upload = multer({ storage: cloudinaryStorage });

router.use(protect);
router.get('/', ctrl.getAllTasks);
router.post('/', authorize('admin'), ctrl.createTask);
router.put('/:id', authorize('admin'), ctrl.updateTask);
router.delete('/:id', authorize('admin'), ctrl.deleteTask);
router.post('/:id/comment', ctrl.addComment);
router.get('/my-tasks', authorize('intern'), ctrl.getMyTasks);
router.post('/submit', authorize('intern'), upload.array('files', 10), ctrl.submitTask);
router.put('/submission/:id/review', authorize('admin'), ctrl.reviewSubmission);

module.exports = router;
