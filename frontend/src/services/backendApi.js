// Frontend API client to communicate with your backend
// Make sure your backend is running on http://localhost:5000

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Auth API endpoints
export const authAPI = {
  register: (userData) => apiCall('/auth/register', 'POST', userData),
  login: (credentials) => apiCall('/auth/login', 'POST', credentials),
  getProfile: (token) => apiCall('/profile', 'GET', null, token),
};

// User API endpoints
export const userAPI = {
  getAllUsers: (token) => apiCall('/users', 'GET', null, token),
};

// Contact API endpoints (for your landing page contact form)
export const contactAPI = {
  sendMessage: (messageData) => apiCall('/contact', 'POST', messageData),
  getAllMessages: (token) => apiCall('/contact', 'GET', null, token),
};

export default apiCall;