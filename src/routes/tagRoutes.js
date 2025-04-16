// src/routes/tagRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getTags,
    createTag,
    getTag,
    updateTag,
    deleteTag,
    getTagTasks
} = require('../controllers/tagController');

// Route: /api/tags
router
    .route('/')
    .get(protect, getTags)
    .post(protect, createTag);

// Route: /api/tags/:id
router
    .route('/:id')
    .get(protect, getTag)
    .put(protect, updateTag)
    .delete(protect, deleteTag);

// Route: /api/tags/:id/tasks
router
    .route('/:id/tasks')
    .get(protect, getTagTasks);

module.exports = router;