import { safeApiCall, safeGet, safeMutation, isValidObjectIdFormat } from './apiWrapper';

const API_BASE_URL = 'http://localhost:5000/api';

const attendanceFetch = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Check-in user
export const checkIn = async (checkInData, token) => {
  if (!checkInData?.userId && !checkInData?.userEmail) {
    console.error('checkIn: Missing user identification');
    return null;
  }
  
  if (!token) {
    console.error('checkIn: No token provided');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await attendanceFetch('/attendance/checkin', 'POST', checkInData, token);
      
      if (response.success && response.attendance) {
        // Update localStorage backup
        const attendance = JSON.parse(localStorage.getItem('gym_attendance') || '[]');
        attendance.push(response.attendance);
        localStorage.setItem('gym_attendance', JSON.stringify(attendance));
        return response.attendance;
      }
      throw new Error(response.message || 'Check-in failed');
    },
    null
  );
};

// Check-out user
export const checkOut = async (token) => {
  if (!token) {
    console.error('checkOut: No token provided');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await attendanceFetch('/attendance/checkout', 'PUT', null, token);
      return response.attendance;
    },
    null
  );
};

// Get attendance history
export const getAttendanceHistory = async (token) => {
  return safeGet(
    async () => {
      const response = await attendanceFetch('/attendance', 'GET', null, token);
      return response.attendance || [];
    },
    []
  );
};

// Get attendance stats (Admin only)
export const getAttendanceStats = async (token) => {
  return safeGet(
    async () => {
      const response = await attendanceFetch('/attendance/stats', 'GET', null, token);
      return response.stats || { totalCheckins: 0, uniqueUsers: 0, today: 0 };
    },
    { totalCheckins: 0, uniqueUsers: 0, today: 0 }
  );
};

// Get user's attendance for a specific date range
export const getAttendanceByDateRange = async (startDate, endDate, token) => {
  if (!startDate || !endDate) {
    console.warn('getAttendanceByDateRange: Date range required');
    return [];
  }
  
  return safeGet(
    async () => {
      const response = await attendanceFetch(`/attendance/range?start=${startDate}&end=${endDate}`, 'GET', null, token);
      return response.attendance || [];
    },
    []
  );
};

// Aliases
export const getAttendance = getAttendanceHistory;
export const getUserAttendance = getAttendanceHistory;
export const recordCheckIn = checkIn;
export const recordCheckOut = checkOut;