// src/routes/subtaskRoutes.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // Important to access parent task ID
const { protect } = require('../middleware/authMiddleware');
const {
    getSubtasks,
    createSubtask,
    getSubtask,
    updateSubtask,
    deleteSubtask,
    completeAllSubtasks,
    getSubtaskStatus
} = require('../controllers/subtaskController');

// Route: /api/tasks/:id/subtasks
router
    .route('/')
    .get(protect, getSubtasks)
    .post(protect, createSubtask);

// Route: /api/tasks/:id/subtasks/status
router
    .route('/status')
    .get(protect, getSubtaskStatus);

// Route: /api/tasks/:id/subtasks/complete-all
router
    .route('/complete-all')
    .patch(protect, completeAllSubtasks);

// Route: /api/tasks/:id/subtasks/:subtaskId
router
    .route('/:subtaskId')
    .get(protect, getSubtask)
    .put(protect, updateSubtask)
    .delete(protect, deleteSubtask);

module.exports = router;