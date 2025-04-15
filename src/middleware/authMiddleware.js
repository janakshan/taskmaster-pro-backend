const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Get token from header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token provided' });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Set user in request
            req.user = { id: decoded.id };

            next();
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Middleware to restrict access by role
exports.restrictTo = (...roles) => {
    return async (req, res, next) => {
        try {
            // Get user
            const user = await User.findById(req.user.id);

            // Check if user exists
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check user role
            if (!roles.includes(user.role)) {
                return res.status(403).json({
                    message: 'You do not have permission to perform this action'
                });
            }

            next();
        } catch (error) {
            console.error('Role restriction error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};