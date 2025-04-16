// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - middleware to check if user is authenticated
 */
exports.protect = async (req, res, next) => {
    let token;

    // Check if token exists in Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
    // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');

            // Update last active time
            if (req.user) {
                req.user.lastActive = Date.now();
                await req.user.save({ validateBeforeSave: false });
            } else {
                return res.status(401).json({
                    success: false,
                    error: 'Not authorized, user not found'
                });
            }

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(401).json({
                success: false,
                error: 'Not authorized, invalid token'
            });
        }
    } else {
        res.status(401).json({
            success: false,
            error: 'Not authorized, no token'
        });
    }
};

/**
 * Admin only middleware - check if user is an admin
 */
exports.admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            error: 'Not authorized as an admin'
        });
    }
};