import { safeApiCall, safeGet, safeMutation, isValidObjectIdFormat } from './apiWrapper';

const API_BASE_URL = 'http://localhost:5000/api';

const bookingFetch = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Create booking for a class
export const createBooking = async (bookingData, token) => {
  if (!bookingData?.classId || !isValidObjectIdFormat(bookingData.classId)) {
    console.warn('Invalid classId for createBooking');
    return null;
  }
  
  return safeMutation(
    async () => {
      const dataToSend = {
        ...bookingData,
        classDate: bookingData.classDate ? new Date(bookingData.classDate) : new Date()
      };
      
      const response = await bookingFetch('/bookings', 'POST', dataToSend, token);
      
      if (response.success) {
        const bookings = JSON.parse(localStorage.getItem('gym_bookings') || '[]');
        bookings.push(response.booking);
        localStorage.setItem('gym_bookings', JSON.stringify(bookings));
        return response.booking;
      }
      throw new Error(response.message);
    },
    null
  );
};

// Get user's bookings
export const getUserBookings = async (token) => {
  return safeGet(
    async () => {
      const response = await bookingFetch('/bookings', 'GET', null, token);
      return response.bookings || [];
    },
    []
  );
};

// Cancel booking
export const cancelBooking = async (bookingId, token) => {
  if (!bookingId) {
    console.warn('Invalid bookingId for cancelBooking');
    return false;
  }
  
  return safeMutation(
    async () => {
      const response = await bookingFetch(`/bookings/${bookingId}`, 'DELETE', null, token);
      
      if (response.success) {
        const bookings = JSON.parse(localStorage.getItem('gym_bookings') || '[]');
        const updated = bookings.map(b => b.id === bookingId ? { ...b, status: 'Cancelled' } : b);
        localStorage.setItem('gym_bookings', JSON.stringify(updated));
        return true;
      }
      return false;
    },
    false
  );
};

// Get booking by ID
export const getBookingById = async (bookingId, token) => {
  if (!bookingId || !isValidObjectIdFormat(bookingId)) {
    console.warn('Invalid bookingId for getBookingById');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await bookingFetch(`/bookings/${bookingId}`, 'GET', null, token);
      return response.booking;
    },
    null
  );
};

// Get bookings for a specific class
export const getClassBookings = async (classId, token) => {
  if (!classId || !isValidObjectIdFormat(classId)) {
    console.warn('Invalid classId for getClassBookings');
    return [];
  }
  
  return safeGet(
    async () => {
      const response = await bookingFetch(`/bookings/class/${classId}`, 'GET', null, token);
      return response.bookings || [];
    },
    []
  );
};

// Aliases
export const getBookings = getUserBookings;
export const addBooking = createBooking;