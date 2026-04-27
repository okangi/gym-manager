const API_BASE_URL = 'http://localhost:5000/api';

const notificationFetch = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Get user notifications
export const getNotifications = async (token) => {
  try {
    const response = await notificationFetch('/notifications', 'GET', null, token);
    return response.notifications || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    const localNotifs = JSON.parse(localStorage.getItem('gym_notifications') || '[]');
    // Ensure each notification has required fields
    return localNotifs.map(n => ({
      ...n,
      read: n.read || false,
      createdAt: n.createdAt || new Date().toISOString()
    }));
  }
};

// Mark notification as read
export const markAsRead = async (id, token) => {
  try {
    const response = await notificationFetch(`/notifications/${id}/read`, 'PUT', null, token);
    if (response.success) {
      const notifications = JSON.parse(localStorage.getItem('gym_notifications') || '[]');
      const updated = notifications.map(n => (n.id === id || n._id === id) ? { ...n, read: true } : n);
      localStorage.setItem('gym_notifications', JSON.stringify(updated));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error marking as read:', error);
    const notifications = JSON.parse(localStorage.getItem('gym_notifications') || '[]');
    const updated = notifications.map(n => (n.id === id || n._id === id) ? { ...n, read: true } : n);
    localStorage.setItem('gym_notifications', JSON.stringify(updated));
    return true;
  }
};

// Mark all notifications as read
export const markAllAsRead = async (token) => {
  try {
    const response = await notificationFetch('/notifications/read-all', 'PUT', null, token);
    if (response.success) {
      const notifications = JSON.parse(localStorage.getItem('gym_notifications') || '[]');
      const updated = notifications.map(n => ({ ...n, read: true }));
      localStorage.setItem('gym_notifications', JSON.stringify(updated));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error marking all as read:', error);
    const notifications = JSON.parse(localStorage.getItem('gym_notifications') || '[]');
    const updated = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('gym_notifications', JSON.stringify(updated));
    return true;
  }
};

// Get unread count
export const getUnreadCount = async (token) => {
  try {
    const response = await notificationFetch('/notifications/unread/count', 'GET', null, token);
    return response.count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    const notifications = JSON.parse(localStorage.getItem('gym_notifications') || '[]');
    return notifications.filter(n => !n.read).length;
  }
};

// Request notification permission (browser)
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Send push notification (Admin only)
export const sendNotification = async (data, token) => {
  try {
    const response = await notificationFetch('/notifications/send', 'POST', data, token);
    return response.success;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// ============ ALIASES FOR BACKWARD COMPATIBILITY ============
export const getUserNotifications = getNotifications;
export const markNotificationAsRead = markAsRead;
export const sendPushNotification = sendNotification;

export const addNotification = async (notification, token) => {
  return await sendNotification(notification, token);
};

export const markAllNotificationsAsRead = async (token) => {
  return await markAllAsRead(token);
};