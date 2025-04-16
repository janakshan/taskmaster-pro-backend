// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    registerUser,
    loginUser,
    getMe,
    updateMe,
    changePassword
} = require('../controllers/authController');

// Route: /api/auth/register
router.post('/register', registerUser);

// Route: /api/auth/login
router.post('/login', loginUser);

// Route: /api/auth/me
router
    .route('/me')
    .get(protect, getMe)
    .put(protect, updateMe);

// Route: /api/auth/password
router.put('/password', protect, changePassword);

module.exports = router;