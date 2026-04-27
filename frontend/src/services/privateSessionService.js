import { safeApiCall, safeGet, isValidObjectIdFormat } from './apiWrapper';

const API_BASE_URL = 'http://localhost:5000/api';

const sessionFetch = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Get private sessions for a user
export const getPrivateSessions = async (userId, token) => {
  if (!userId || !isValidObjectIdFormat(userId)) {
    console.warn('Invalid userId for getPrivateSessions');
    return [];
  }
  
  return safeGet(
    async () => {
      const response = await sessionFetch(`/sessions/user/${userId}`, 'GET', null, token);
      return response.sessions || [];
    },
    []
  );
};

// Get trainer availability
export const getTrainerAvailability = async (trainerId, token) => {
  if (!trainerId || !isValidObjectIdFormat(trainerId)) {
    console.warn('Invalid trainerId for getTrainerAvailability');
    return [];
  }
  
  return safeGet(
    async () => {
      const response = await sessionFetch(`/sessions/availability/${trainerId}`, 'GET', null, token);
      return response.availability || response.slots || [];
    },
    []
  );
};

// Book a private session
export const bookPrivateSession = async (sessionData, token) => {
  if (!sessionData?.trainerId || !isValidObjectIdFormat(sessionData.trainerId)) {
    console.warn('Invalid trainerId for bookPrivateSession');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await sessionFetch('/sessions', 'POST', sessionData, token);
      return response.session;
    },
    null
  );
};

// Cancel a private session
export const cancelPrivateSession = async (sessionId, token) => {
  if (!sessionId || !isValidObjectIdFormat(sessionId)) {
    console.warn('Invalid sessionId for cancelPrivateSession');
    return false;
  }
  
  return safeMutation(
    async () => {
      const response = await sessionFetch(`/sessions/${sessionId}/cancel`, 'PUT', null, token);
      return response.success;
    },
    false
  );
};

// Save availability (trainer only)
export const saveAvailability = async (availabilityData, token) => {
  if (!availabilityData?.sessionDate || !availabilityData?.startTime || !availabilityData?.endTime) {
    console.warn('Missing required fields for saveAvailability');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await sessionFetch('/sessions/availability', 'POST', availabilityData, token);
      return response.availability || response.session;
    },
    null
  );
};

// Delete availability (trainer only)
export const deleteAvailability = async (availabilityId, token) => {
  if (!availabilityId || !isValidObjectIdFormat(availabilityId)) {
    console.warn('Invalid availabilityId for deleteAvailability');
    return false;
  }
  
  return safeMutation(
    async () => {
      const response = await sessionFetch(`/sessions/availability/${availabilityId}`, 'DELETE', null, token);
      return response.success;
    },
    false
  );
};

// Get booking by availability ID
export const getBookingByAvailabilityId = async (availabilityId, token) => {
  if (!availabilityId || !isValidObjectIdFormat(availabilityId)) {
    console.warn('Invalid availabilityId for getBookingByAvailabilityId');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await sessionFetch(`/sessions/booking/${availabilityId}`, 'GET', null, token);
      return response.booking;
    },
    null
  );
};

// Aliases
export const addSessionBooking = bookPrivateSession;
export const getUserSessionBookings = getPrivateSessions;