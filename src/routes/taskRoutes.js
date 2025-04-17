// src/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getTasks,
    createTask,
    getTask,
    updateTask,
    deleteTask,
    updateTaskTags,
    forceDeleteTask
} = require('../controllers/taskController');

// Import subtask routes
const subtaskRoutes = require('./subtaskRoutes');

// Route: /api/tasks
router
    .route('/')
    .get(protect, getTasks)
    .post(protect, createTask);

// Route: /api/tasks/:id
router
    .route('/:id')
    .get(protect, getTask)
    .put(protect, updateTask)
    .delete(protect, deleteTask);

// Route: /api/tasks/:id/force
router
    .route('/:id/force')
    .delete(protect, forceDeleteTask);

// Route: /api/tasks/:id/tags
router
    .route('/:id/tags')
    .patch(protect, updateTaskTags);

// Use subtask routes
router.use('/:id/subtasks', subtaskRoutes);

module.exports = router;