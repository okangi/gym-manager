// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint, method = 'GET', data = null, token = null, isFormData = false) => {
  const headers = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
  };
  
  if (data) {
    if (isFormData) {
      config.body = data;
    } else {
      config.body = JSON.stringify(data);
    }
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'API call failed');
    }
    
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: (userData) => apiCall('/auth/register', 'POST', userData),
  login: (credentials) => apiCall('/auth/login', 'POST', credentials),
  getProfile: (token) => apiCall('/auth/profile', 'GET', null, token),
};

// Branch API
export const branchAPI = {
  getAll: () => apiCall('/branches', 'GET'),
  getById: (id) => apiCall(`/branches/${id}`, 'GET'),
  create: (data, token) => apiCall('/branches', 'POST', data, token),
  update: (id, data, token) => apiCall(`/branches/${id}`, 'PUT', data, token),
  delete: (id, token) => apiCall(`/branches/${id}`, 'DELETE', null, token),
};

// Class API
export const classAPI = {
  getAll: () => apiCall('/classes', 'GET'),
  create: (data, token) => apiCall('/classes', 'POST', data, token),
  update: (id, data, token) => apiCall(`/classes/${id}`, 'PUT', data, token),
  delete: (id, token) => apiCall(`/classes/${id}`, 'DELETE', null, token),
};

// Plan API
export const planAPI = {
  getAll: () => apiCall('/plans', 'GET'),
  getById: (id) => apiCall(`/plans/${id}`, 'GET'),
  create: (data, token) => apiCall('/plans', 'POST', data, token),
  update: (id, data, token) => apiCall(`/plans/${id}`, 'PUT', data, token),
  delete: (id, token) => apiCall(`/plans/${id}`, 'DELETE', null, token),
};

// Payment API
export const paymentAPI = {
  getAll: (token) => apiCall('/payments', 'GET', null, token),
  getById: (id, token) => apiCall(`/payments/${id}`, 'GET', null, token),
  create: (data, token) => apiCall('/payments', 'POST', data, token),
};

// Attendance API
export const attendanceAPI = {
  checkIn: (data, token) => apiCall('/attendance/checkin', 'POST', data, token),
  checkOut: (token) => apiCall('/attendance/checkout', 'PUT', null, token),
  getHistory: (token) => apiCall('/attendance', 'GET', null, token),
  getStats: (token) => apiCall('/attendance/stats', 'GET', null, token),
};

// Contact API
export const contactAPI = {
  sendMessage: (data) => apiCall('/contact', 'POST', data),
  getAll: (token) => apiCall('/contact', 'GET', null, token),
  updateStatus: (id, data, token) => apiCall(`/contact/${id}`, 'PUT', data, token),
  delete: (id, token) => apiCall(`/contact/${id}`, 'DELETE', null, token),
};

// Booking API
export const bookingAPI = {
  create: (data, token) => apiCall('/bookings', 'POST', data, token),
  getUserBookings: (token) => apiCall('/bookings', 'GET', null, token),
  cancel: (id, token) => apiCall(`/bookings/${id}`, 'DELETE', null, token),
};

// Upload API
export const uploadAPI = {
  uploadProfilePicture: (formData, token) => apiCall('/upload/profile-picture', 'POST', formData, token, true),
  uploadClassImage: (formData, token) => apiCall('/upload/class-image', 'POST', formData, token, true),
  uploadMultiple: (formData, token) => apiCall('/upload/multiple', 'POST', formData, token, true),
};

// Export apiCall as named export for use in other services
export { apiCall };

// Default export
export default apiCall;