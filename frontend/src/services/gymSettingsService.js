// Gym Settings Service - Backend API Version

const API_BASE_URL = 'http://localhost:5000/api';

// Default settings (fallback)
const defaultSettings = {
  name: "Cyprian's Workout Wizard",
  logo: null,
  location: '123 Fitness St, City',
  address: '123 Fitness St, City, State 12345',
  phone: '+1 234 567 8900',
  email: 'info@gymmanager.com',
  currencySymbol: '$'
};

// Helper function for API calls
const settingsFetch = async (endpoint, method = 'GET', data = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Only add token for PUT requests (admin operations)
  if (token && method === 'PUT') {
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

// Get gym settings from backend (public - no auth needed)
export const getGymSettings = async () => {
  try {
    const response = await settingsFetch('/settings', 'GET');
    if (response.success && response.settings) {
      // Update localStorage as backup
      localStorage.setItem('gym_settings', JSON.stringify(response.settings));
      return response.settings;
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error fetching gym settings:', error);
    // Fallback to localStorage if API fails
    const localData = localStorage.getItem('gym_settings');
    if (localData) {
      return JSON.parse(localData);
    }
    return defaultSettings;
  }
};

// Update gym settings (Admin only)
export const updateGymSettings = async (settings, token) => {
  try {
    const response = await settingsFetch('/settings', 'PUT', settings, token);
    if (response.success) {
      // Update localStorage backup
      localStorage.setItem('gym_settings', JSON.stringify(response.settings));
      return { success: true, settings: response.settings };
    }
    return { success: false, error: response.message };
  } catch (error) {
    console.error('Error updating gym settings:', error);
    // Fallback to localStorage
    localStorage.setItem('gym_settings', JSON.stringify(settings));
    return { success: false, error: error.message };
  }
};

// Initialize default settings
export const initDefaultSettings = async () => {
  try {
    const settings = await getGymSettings();
    if (!settings || !settings.name) {
      return defaultSettings;
    }
    return settings;
  } catch (error) {
    console.error('Error initializing settings:', error);
    if (!localStorage.getItem('gym_settings')) {
      localStorage.setItem('gym_settings', JSON.stringify(defaultSettings));
    }
    return defaultSettings;
  }
};