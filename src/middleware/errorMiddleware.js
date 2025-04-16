/**
 * Error handling middleware
 */

// Not found middleware
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Generic error handler
// const errorHandler = (err, req, res, next) => {
//     // Log the error for server-side debugging
//     console.error(err.stack);

//     // Set status code (default to 500 if response doesn't already have a status code)
//     const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
//     res.status(statusCode);

//     // Send error response in JSON format
//     res.json({
//         message: err.message,
//         // Only send the stack trace in development mode
//         stack: process.env.NODE_ENV === 'production' ? null : err.stack,
//     });
// };

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        err.message = `Invalid input data: ${errors.join('. ')}`;
        err.statusCode = 400;
    }

    // Handle duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        err.message = `Duplicate field value: ${field}. Please use another value.`;
        err.statusCode = 400;
    }

    // Handle cast error (invalid MongoDB ID)
    if (err.name === 'CastError') {
        err.message = `Invalid ${err.path}: ${err.value}`;
        err.statusCode = 400;
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        err.message = 'Invalid token. Please log in again.';
        err.statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        err.message = 'Your token has expired. Please log in again.';
        err.statusCode = 401;
    }

    // Development vs Production error handling could be added here

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        // Include stack trace in development only
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
module.exports = { notFound, errorHandler };