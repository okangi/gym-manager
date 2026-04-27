/**
 * Safe API call wrapper to handle errors gracefully
 * @param {Function} apiCall - The API function to call
 * @param {*} fallbackData - Data to return if the API call fails
 * @returns {Promise<*>} - The API response or fallback data
 */
export const safeApiCall = async (apiCall, fallbackData = null) => {
  try {
    const response = await apiCall();
    
    // Check if response indicates success
    if (response && response.success === false) {
      console.warn('API returned error:', response.message);
      return fallbackData;
    }
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // You can add error tracking service here (e.g., Sentry)
      // logErrorToService(error);
    }
    
    return fallbackData;
  }
};

/**
 * Wrapper for GET requests
 * @param {Function} fetchFunction - The fetch function to call
 * @param {Array} fallbackData - Fallback data array
 * @returns {Promise<Array>} - Data array
 */
export const safeGet = async (fetchFunction, fallbackData = []) => {
  const result = await safeApiCall(fetchFunction, fallbackData);
  return Array.isArray(result) ? result : (result?.data || fallbackData);
};

/**
 * Wrapper for POST/PUT requests
 * @param {Function} fetchFunction - The fetch function to call
 * @param {Object} fallbackData - Fallback data object
 * @returns {Promise<Object|null>} - Result object or null
 */
export const safeMutation = async (fetchFunction, fallbackData = null) => {
  return await safeApiCall(fetchFunction, fallbackData);
};

/**
 * Validate if an ID is a valid MongoDB ObjectId format
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid format
 */
export const isValidObjectIdFormat = (id) => {
  if (!id) return false;
  // MongoDB ObjectId is 24 hex characters
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};