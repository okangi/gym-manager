const mongoose = require('mongoose');

/**
 * Check if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidObjectId = (id) => {
  if (!id) return false;
  if (typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware to validate ID parameters in routes
 * @param {string} paramName - The name of the parameter to validate
 * @returns {Function} - Express middleware
 */
const validateIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (id && !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid ${paramName} format. Must be a valid ObjectId.` 
      });
    }
    next();
  };
};

/**
 * Validate multiple ID parameters
 * @param {string[]} paramNames - Array of parameter names to validate
 * @returns {Function} - Express middleware
 */
const validateIdParams = (paramNames) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];
      if (id && !isValidObjectId(id)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid ${paramName} format. Must be a valid ObjectId.` 
        });
      }
    }
    next();
  };
};

module.exports = { 
  isValidObjectId, 
  validateIdParam, 
  validateIdParams 
};