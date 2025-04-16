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

// Get tasks with their subtasks
router.get('/with-subtasks', taskController.getTasksWithSubtasks);

router.route('/:id')
    .get(taskController.getTask)
    .put(taskController.updateTask)
    .delete(taskController.deleteTask);

// Delete task with all its subtasks
router.delete('/:id/with-subtasks', taskController.deleteTaskWithSubtasks);

// Duplicate task
router.post('/:id/duplicate', taskController.duplicateTask);

// Status update endpoint
router.patch('/:id/status', taskController.updateTaskStatus);

// Update parent task
router.patch('/:id/parent', taskController.updateTaskParent);

// Subtask routes
router.get('/:id/subtasks', taskController.getSubtasks);
router.post('/:id/subtasks', taskController.createSubtask);

module.exports = router;