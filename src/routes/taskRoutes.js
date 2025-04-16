// src/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Task routes
router.route('/')
    .get(taskController.getTasks)
    .post(taskController.createTask);

router.route('/:id')
    .get(taskController.getTask)
    .put(taskController.updateTask)
    .delete(taskController.deleteTask);

// Status update endpoint
router.patch('/:id/status', taskController.updateTaskStatus);

// Subtask routes
router.get('/:id/subtasks', taskController.getSubtasks);
router.post('/:id/subtasks', taskController.createSubtask);

module.exports = router;