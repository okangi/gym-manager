import { safeApiCall, safeMutation } from './apiWrapper';

const API_BASE_URL = 'http://localhost:5000/api';

const landingFetch = async (endpoint, method = 'GET', data = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Add token for authenticated requests
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

// Default content structure
const defaultLandingContent = {
  hero: {
    title: "Cyprian's Workout Wizard",
    subtitle: "Transform your fitness journey",
    buttonText: "Join Now",
    backgroundImage: "",
    buttonLink: "/register"
  },
  aboutText: "We provide the best fitness experience with modern equipment and expert trainers.",
  gallery: [],
  trainingVideos: [],
  features: [
    { id: "1", icon: "🏋️", title: "Modern Equipment", description: "Latest machines and free weights" },
    { id: "2", icon: "👨‍🏫", title: "Expert Trainers", description: "Certified professionals" },
    { id: "3", icon: "💪", title: "Personalized Plans", description: "Tailored to your goals" }
  ],
  socialLinks: { facebook: "", instagram: "", twitter: "", youtube: "" },
  testimonials: []
};

// ==================== LANDING PAGE API ====================

// Get landing content from backend - PUBLIC (no token)
export const getLandingContent = async () => {
  try {
    const response = await landingFetch('/landing', 'GET');
    if (response.success && response.content) {
      localStorage.setItem('gym_landing', JSON.stringify(response.content));
      return response.content;
    }
    return defaultLandingContent;
  } catch (error) {
    console.error('Error fetching landing content:', error);
    const localData = localStorage.getItem('gym_landing');
    if (localData) {
      return JSON.parse(localData);
    }
    return defaultLandingContent;
  }
};

// Update landing content (Admin only)
export const updateLandingContent = async (content, token) => {
  if (!token) {
    console.error('No token provided for updateLandingContent');
    return { success: false, error: 'Authentication required' };
  }
  
  try {
    const response = await landingFetch('/landing', 'PUT', content, token);
    if (response.success) {
      localStorage.setItem('gym_landing', JSON.stringify(response.content));
      return { success: true, content: response.content };
    }
    return { success: false, error: response.message };
  } catch (error) {
    console.error('Error updating landing content:', error);
    return { success: false, error: error.message };
  }
};

// Initialize default landing content
export const initDefaultLanding = async () => {
  try {
    const content = await getLandingContent();
    if (!content || !content.hero) {
      return defaultLandingContent;
    }
    return content;
  } catch (error) {
    console.error('Error initializing landing:', error);
    if (!localStorage.getItem('gym_landing')) {
      localStorage.setItem('gym_landing', JSON.stringify(defaultLandingContent));
    }
    return defaultLandingContent;
  }
};

// ==================== CONTACT MESSAGES API ====================

// Send contact message (public - no token required)
export const addContactMessage = async (messageData) => {
  const { name, email, phone, subject, message } = messageData;
  
  // Validate required fields
  if (!name || !email || !subject || !message) {
    console.error('Missing required fields for contact message');
    return null;
  }
  
  try {
    const response = await landingFetch('/contact', 'POST', {
      name,
      email,
      phone: phone || '',
      subject,
      message,
      status: 'Unread'
    });
    
    if (response.success) {
      // Store in localStorage for offline backup
      const messages = JSON.parse(localStorage.getItem('gym_contact_messages') || '[]');
      messages.push(response.message);
      localStorage.setItem('gym_contact_messages', JSON.stringify(messages));
      return response.message;
    }
    throw new Error(response.message || 'Failed to send message');
  } catch (error) {
    console.error('Error sending contact message:', error);
    // Fallback to localStorage
    const messages = JSON.parse(localStorage.getItem('gym_contact_messages') || '[]');
    const newMessage = { 
      id: Date.now(), 
      ...messageData, 
      createdAt: new Date().toISOString(), 
      status: 'Unread'
    };
    messages.push(newMessage);
    localStorage.setItem('gym_contact_messages', JSON.stringify(messages));
    return newMessage;
  }
};

// Get all contact messages (Admin only)
export const getContactMessages = async (token) => {
  if (!token) {
    console.warn('No token provided for getContactMessages');
    return [];
  }
  
  try {
    const response = await landingFetch('/contact', 'GET', null, token);
    if (response.success && response.messages) {
      localStorage.setItem('gym_contact_messages', JSON.stringify(response.messages));
      return response.messages;
    }
    return [];
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return JSON.parse(localStorage.getItem('gym_contact_messages') || '[]');
  }
};

// Get message by ID (Admin only)
export const getMessageById = async (id, token) => {
  if (!token || !id) return null;
  
  try {
    const response = await landingFetch(`/contact/${id}`, 'GET', null, token);
    return response.message || null;
  } catch (error) {
    console.error('Error fetching message:', error);
    const messages = JSON.parse(localStorage.getItem('gym_contact_messages') || '[]');
    return messages.find(m => m.id === id || m._id === id) || null;
  }
};

// Mark message as read (Admin only)
export const markMessageRead = async (id, token) => {
  if (!token || !id) return false;
  
  try {
    const response = await landingFetch(`/contact/${id}/read`, 'PUT', null, token);
    if (response.success) {
      const messages = JSON.parse(localStorage.getItem('gym_contact_messages') || '[]');
      const updated = messages.map(m => (m._id === id || m.id === id) ? { ...m, status: 'Read' } : m);
      localStorage.setItem('gym_contact_messages', JSON.stringify(updated));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error marking message as read:', error);
    const messages = JSON.parse(localStorage.getItem('gym_contact_messages') || '[]');
    const updated = messages.map(m => (m.id === id) ? { ...m, status: 'Read' } : m);
    localStorage.setItem('gym_contact_messages', JSON.stringify(updated));
    return true;
  }
};

// Update message status (Admin only)
export const updateMessageStatus = async (id, status, token) => {
  if (!token || !id) return false;
  
  try {
    const response = await landingFetch(`/contact/${id}`, 'PUT', { status }, token);
    if (response.success) {
      const messages = JSON.parse(localStorage.getItem('gym_contact_messages') || '[]');
      const updated = messages.map(m => (m._id === id || m.id === id) ? { ...m, status } : m);
      localStorage.setItem('gym_contact_messages', JSON.stringify(updated));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating message status:', error);
    return false;
  }
};

// Delete contact message (Admin only)
export const deleteContactMessage = async (id, token) => {
  if (!token || !id) return false;
  
  try {
    const response = await landingFetch(`/contact/${id}`, 'DELETE', null, token);
    if (response.success) {
      const messages = JSON.parse(localStorage.getItem('gym_contact_messages') || '[]');
      const filtered = messages.filter(m => m._id !== id && m.id !== id);
      localStorage.setItem('gym_contact_messages', JSON.stringify(filtered));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting contact message:', error);
    const messages = JSON.parse(localStorage.getItem('gym_contact_messages') || '[]');
    const filtered = messages.filter(m => m.id !== id);
    localStorage.setItem('gym_contact_messages', JSON.stringify(filtered));
    return true;
  }
};

// Get unread count (Admin only)
export const getUnreadCount = async (token) => {
  if (!token) return 0;
  
  try {
    const messages = await getContactMessages(token);
    return messages.filter(m => m.status === 'Unread' || m.status === 'new').length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    const messages = JSON.parse(localStorage.getItem('gym_contact_messages') || '[]');
    return messages.filter(m => m.status === 'Unread').length;
  }
};