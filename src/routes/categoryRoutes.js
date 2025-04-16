// src/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getCategories,
    createCategory,
    getCategory,
    updateCategory,
    deleteCategory,
    getCategoryTasks
} = require('../controllers/categoryController');

// Route: /api/categories
router
    .route('/')
    .get(protect, getCategories)
    .post(protect, createCategory);

// Route: /api/categories/:id
router
    .route('/:id')
    .get(protect, getCategory)
    .put(protect, updateCategory)
    .delete(protect, deleteCategory);

// Route: /api/categories/:id/tasks
router
    .route('/:id/tasks')
    .get(protect, getCategoryTasks);

module.exports = router;