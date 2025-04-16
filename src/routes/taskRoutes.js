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

// Individual task routes
router.route('/:id')
    .get(taskController.getTask)
    .put(taskController.updateTask)
    .delete(taskController.deleteTask);

// Tags route - using the controller's method directly
router.route('/:id/tags')
    .patch(taskController.updateTaskTags);

module.exports = router;