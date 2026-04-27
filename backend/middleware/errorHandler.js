/**
 * Global error handler for the application
 * Handles different types of errors and returns appropriate responses
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging (but not in production)
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err.stack);
  } else {
    // In production, log to a file or service
    console.error('Error:', err.message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ 
      success: false, 
      message: 'Validation error', 
      errors 
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      success: false, 
      message: `Invalid ${err.path}: ${err.value}` 
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ 
      success: false, 
      message: `${field} already exists. Please use a different ${field}.` 
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token. Please login again.' 
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      success: false, 
      message: 'Token expired. Please login again.' 
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({ 
    success: false, 
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found` 
  });
};

module.exports = { errorHandler, notFound };