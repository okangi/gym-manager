import { safeApiCall, safeGet, safeMutation, isValidObjectIdFormat } from './apiWrapper';

const API_BASE_URL = 'http://localhost:5000/api';

const classFetch = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Helper function to get class ID (handles both id and _id)
const getClassId = (classObj) => {
  return classObj?.id || classObj?._id;
};

// Validate class ID format
const isValidClassId = (id) => {
  return id && isValidObjectIdFormat(id);
};

// Get all classes (public)
export const getClasses = async () => {
  return safeGet(
    async () => {
      const response = await classFetch('/classes', 'GET');
      return response.classes || [];
    },
    []
  );
};

// Get class by ID
export const getClassById = async (id, token = null) => {
  if (!id || !isValidClassId(id)) {
    console.warn('getClassById: Invalid ID provided', id);
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await classFetch(`/classes/${id}`, 'GET', null, token);
      return response.class;
    },
    null
  );
};

// Create class (Trainer/Admin only)
export const createClass = async (classData, token) => {
  if (!token) {
    console.error('createClass: No token provided');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await classFetch('/classes', 'POST', classData, token);
      return response.class;
    },
    null
  );
};

// Update class
export const updateClass = async (id, classData, token) => {
  if (!id || !isValidClassId(id)) {
    console.error('updateClass: Invalid class ID');
    return null;
  }
  
  if (!token) {
    console.error('updateClass: No token provided');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await classFetch(`/classes/${id}`, 'PUT', classData, token);
      return response.class;
    },
    null
  );
};

// Delete class
export const deleteClass = async (id, token) => {
  if (!id || !isValidClassId(id)) {
    console.error('deleteClass: Invalid class ID');
    return false;
  }
  
  if (!token) {
    console.error('deleteClass: No token provided');
    return false;
  }
  
  return safeMutation(
    async () => {
      await classFetch(`/classes/${id}`, 'DELETE', null, token);
      return true;
    },
    false
  );
};

// Initialize default classes
export const initDefaultClasses = async (token) => {
  try {
    const classes = await getClasses();
    if (classes.length === 0 && token) {
      const defaultClasses = [
        { name: 'Morning Yoga', instructor: 'Jane Doe', time: '08:00', capacity: 20, price: 500, day: 'Monday', duration: 60 },
        { name: 'HIIT Cardio', instructor: 'John Smith', time: '18:00', capacity: 15, price: 600, day: 'Wednesday', duration: 45 },
        { name: 'Evening Pilates', instructor: 'Sarah Wilson', time: '17:30', capacity: 12, price: 550, day: 'Tuesday', duration: 50 }
      ];
      for (const cls of defaultClasses) {
        await createClass(cls, token);
      }
      console.log('✅ Default classes created');
    }
  } catch (error) {
    if (error.message && (error.message.includes('403') || error.message.includes('Admin access required'))) {
      console.log('Skipping class initialization - admin access required');
      return;
    }
    console.error('Error initializing classes:', error);
  }
};

// ============ WAITLIST FUNCTIONS ============

// Get class bookings count
export const getClassBookingsCount = async (classId, token) => {
  if (!classId || !isValidClassId(classId)) {
    console.warn('getClassBookingsCount: Invalid classId', classId);
    return 0;
  }
  
  return safeGet(
    async () => {
      const response = await classFetch(`/classes/${classId}/bookings/count`, 'GET', null, token);
      return response.count || 0;
    },
    0
  );
};

// Add to waitlist
export const addToWaitlist = async (classId, userId, token) => {
  if (!classId || !isValidClassId(classId)) {
    console.error('addToWaitlist: Invalid class ID');
    return { success: false, message: 'Invalid class ID' };
  }
  
  if (!userId || !isValidObjectIdFormat(userId)) {
    console.error('addToWaitlist: Invalid user ID');
    return { success: false, message: 'Invalid user ID' };
  }
  
  return safeMutation(
    async () => {
      const response = await classFetch(`/classes/${classId}/waitlist`, 'POST', { userId }, token);
      return response;
    },
    { success: false, message: 'Failed to add to waitlist' }
  );
};

// Get waitlist
export const getWaitlist = async (classId, token) => {
  if (!classId || !isValidClassId(classId)) {
    console.warn('getWaitlist: Invalid classId', classId);
    return [];
  }
  
  return safeGet(
    async () => {
      const response = await classFetch(`/classes/${classId}/waitlist`, 'GET', null, token);
      return response.waitlist || [];
    },
    []
  );
};

// Auto-book from waitlist
export const autoBookFromWaitlist = async (classId, token) => {
  if (!classId || !isValidClassId(classId)) {
    console.warn('autoBookFromWaitlist: Invalid classId', classId);
    return { success: false };
  }
  
  return safeMutation(
    async () => {
      const response = await classFetch(`/classes/${classId}/waitlist/auto-book`, 'POST', null, token);
      return response;
    },
    { success: false }
  );
};

// ============ ENROLLMENT FUNCTIONS ============

// Get class enrollment count
export const getClassEnrollmentCount = async (classId, token) => {
  if (!classId || !isValidClassId(classId)) {
    console.warn('getClassEnrollmentCount: Invalid classId', classId);
    return 0;
  }
  
  return safeGet(
    async () => {
      const response = await classFetch(`/classes/${classId}/enrollment/count`, 'GET', null, token);
      return response.count || 0;
    },
    0
  );
};

// Check if user is enrolled in class
export const isUserEnrolled = async (classId, userId, token) => {
  if (!classId || !isValidClassId(classId)) {
    return false;
  }
  
  if (!userId || !isValidObjectIdFormat(userId)) {
    return false;
  }
  
  return safeGet(
    async () => {
      const response = await classFetch(`/classes/${classId}/enrolled/${userId}`, 'GET', null, token);
      return response.enrolled || false;
    },
    false
  );
};

// ============ ALIASES FOR COMPONENTS ============
export const saveClass = async (classData, token) => {
  const classId = getClassId(classData);
  if (classId) {
    return await updateClass(classId, classData, token);
  } else {
    return await createClass(classData, token);
  }
};

export const getAllClasses = getClasses;
export const getClassList = getClasses;
export const fetchClasses = getClasses;
export const deleteClassById = deleteClass;