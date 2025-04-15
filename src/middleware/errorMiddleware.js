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
const errorHandler = (err, req, res, next) => {
    // Log the error for server-side debugging
    console.error(err.stack);

    // Set status code (default to 500 if response doesn't already have a status code)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    // Send error response in JSON format
    res.json({
        message: err.message,
        // Only send the stack trace in development mode
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };