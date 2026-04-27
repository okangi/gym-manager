import { safeApiCall, safeGet, safeMutation, isValidObjectIdFormat } from './apiWrapper';

const API_BASE_URL = 'http://localhost:5000/api';

const progressFetch = async (endpoint, method = 'GET', data = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'API call failed');
  }
  
  return result;
};

// Get progress entries for a user
export const getProgressEntries = async (userId, token) => {
  if (!userId || !isValidObjectIdFormat(userId)) {
    console.warn('getProgressEntries: Invalid userId');
    return [];
  }
  
  return safeGet(
    async () => {
      const response = await progressFetch(`/progress/${userId}`, 'GET', null, token);
      return response.entries || [];
    },
    []
  );
};

// Add progress entry
export const addProgressEntry = async (entryData, token) => {
  if (!entryData?.userId || !entryData?.date || !entryData?.weight) {
    console.error('addProgressEntry: Missing required fields');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await progressFetch('/progress', 'POST', entryData, token);
      return response.entry;
    },
    null
  );
};

// Delete progress entry
export const deleteProgressEntry = async (entryId, token) => {
  if (!entryId || !isValidObjectIdFormat(entryId)) {
    console.error('deleteProgressEntry: Invalid entry ID');
    return false;
  }
  
  return safeMutation(
    async () => {
      const response = await progressFetch(`/progress/${entryId}`, 'DELETE', null, token);
      return response.success;
    },
    false
  );
};

// Update progress entry
export const updateProgressEntry = async (entryId, entryData, token) => {
  if (!entryId || !isValidObjectIdFormat(entryId)) {
    console.error('updateProgressEntry: Invalid entry ID');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await progressFetch(`/progress/${entryId}`, 'PUT', entryData, token);
      return response.entry;
    },
    null
  );
};

// Aliases for backward compatibility
export const getProgress = getProgressEntries;
export const addProgress = addProgressEntry;
export const deleteProgress = deleteProgressEntry;