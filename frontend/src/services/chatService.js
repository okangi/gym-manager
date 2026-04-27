import { safeApiCall, safeGet, safeMutation, isValidObjectIdFormat } from './apiWrapper';

const API_BASE_URL = 'http://localhost:5000/api';

const chatFetch = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Get all conversations for the logged-in user
export const getConversations = async (token) => {
  return safeGet(
    async () => {
      const response = await chatFetch('/chat/conversations', 'GET', null, token);
      return response.conversations || [];
    },
    []
  );
};

// Get conversation between two users
export const getConversation = async (userId1, userId2, token) => {
  if (!userId1 || !isValidObjectIdFormat(userId1)) {
    console.warn('getConversation: Invalid userId1', userId1);
    return [];
  }
  
  if (!userId2 || !isValidObjectIdFormat(userId2)) {
    console.warn('getConversation: Invalid userId2', userId2);
    return [];
  }
  
  return safeGet(
    async () => {
      const response = await chatFetch(`/chat/${userId1}/${userId2}`, 'GET', null, token);
      return response.messages || [];
    },
    []
  );
};

// Send a message
export const sendMessage = async (fromUserId, toUserId, message, token) => {
  if (!fromUserId || !isValidObjectIdFormat(fromUserId)) {
    console.error('sendMessage: Invalid fromUserId', fromUserId);
    throw new Error('Invalid sender ID');
  }
  
  if (!toUserId || !isValidObjectIdFormat(toUserId)) {
    console.error('sendMessage: Invalid toUserId', toUserId);
    throw new Error('Invalid recipient ID');
  }
  
  if (!message || message.trim() === '') {
    console.error('sendMessage: Message cannot be empty');
    throw new Error('Message cannot be empty');
  }
  
  return safeMutation(
    async () => {
      const response = await chatFetch('/chat', 'POST', { toUserId, message }, token);
      return response.message;
    },
    null
  );
};

// Mark messages as read
export const markConversationRead = async (otherUserId, token) => {
  if (!otherUserId || !isValidObjectIdFormat(otherUserId)) {
    console.warn('markConversationRead: Invalid otherUserId', otherUserId);
    return false;
  }
  
  return safeMutation(
    async () => {
      await chatFetch(`/chat/read/${otherUserId}`, 'PUT', null, token);
      return true;
    },
    false
  );
};

// Get unread count for a conversation
export const getUnreadCountForConversation = async (otherUserId, token) => {
  if (!otherUserId || !isValidObjectIdFormat(otherUserId)) {
    console.warn('getUnreadCountForConversation: Invalid otherUserId', otherUserId);
    return 0;
  }
  
  return safeGet(
    async () => {
      const response = await chatFetch(`/chat/unread/${otherUserId}`, 'GET', null, token);
      return response.count || 0;
    },
    0
  );
};

// Get chat messages for export
export const getChatMessages = async (userId, token) => {
  if (!userId || !isValidObjectIdFormat(userId)) {
    console.warn('getChatMessages: Invalid userId', userId);
    return [];
  }
  
  return safeGet(
    async () => {
      const conversations = await getConversations(token);
      let allMessages = [];
      
      for (const conv of conversations) {
        const messages = await getConversation(userId, conv.user?.id || conv.userId, token);
        allMessages = [...allMessages, ...messages];
      }
      
      return allMessages;
    },
    []
  );
};

// Get user conversations (list of users they've chatted with)
export const getUserConversations = getConversations;