const API_BASE_URL = 'http://localhost:5000/api';

const activityFetch = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Add activity log
export const addActivityLog = async (userEmail, action, details, token) => {
  if (!token) {
    console.warn('No token provided for activity log');
    return null;
  }
  
  try {
    const response = await activityFetch('/activity-logs', 'POST', {
      userEmail,
      action,
      details,
      timestamp: new Date().toISOString()
    }, token);
    return response.log;
  } catch (error) {
    console.error('Error adding activity log:', error);
    // Fallback to localStorage
    const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    const newLog = {
      id: Date.now(),
      userEmail,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    logs.push(newLog);
    localStorage.setItem('activityLogs', JSON.stringify(logs));
    return newLog;
  }
};

// Get user logs by email
export const getUserLogs = async (email, token) => {
  if (!token) {
    console.warn('No token provided for getting logs');
    return [];
  }
  
  if (!email) {
    console.warn('No email provided for getUserLogs');
    return [];
  }
  
  try {
    const response = await activityFetch(`/activity-logs/user/${encodeURIComponent(email)}`, 'GET', null, token);
    return response.logs || [];
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    // Fallback to localStorage
    const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    return logs.filter(l => l.userEmail === email);
  }
};

// Get all logs (Admin only)
export const getAllLogs = async (token) => {
  if (!token) return [];
  
  try {
    const response = await activityFetch('/activity-logs', 'GET', null, token);
    return response.logs || [];
  } catch (error) {
    console.error('Error fetching all logs:', error);
    return JSON.parse(localStorage.getItem('activityLogs') || '[]');
  }
};

// Get activity stats (Admin only)
export const getActivityStats = async (token) => {
  if (!token) return null;
  
  try {
    const response = await activityFetch('/activity-logs/stats', 'GET', null, token);
    return { dailyStats: response.dailyStats, actionStats: response.actionStats };
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return null;
  }
};

// Cleanup old logs (Admin only)
export const cleanupOldLogs = async (days = 90, token) => {
  if (!token) return false;
  
  try {
    const response = await activityFetch(`/activity-logs/cleanup?days=${days}`, 'DELETE', null, token);
    return response.success;
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    return false;
  }
};