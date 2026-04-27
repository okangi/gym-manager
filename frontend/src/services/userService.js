import { safeApiCall, safeGet, safeMutation, isValidObjectIdFormat } from './apiWrapper';

const API_BASE_URL = 'http://localhost:5000/api';

const userFetch = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Validate user ID format
const isValidUserId = (id) => {
  return id && isValidObjectIdFormat(id);
};

// Get all users (Admin only)
export const getUsers = async (token) => {
  return safeGet(
    async () => {
      const response = await userFetch('/users', 'GET', null, token);
      return response.users || [];
    },
    []
  );
};



// Get members by branch (for trainers)
export const getMembersByBranch = async (branchId, token) => {
  if (!branchId || !token) {
    console.warn('getMembersByBranch: Missing branchId or token');
    return [];
  }
  
  try {
    const response = await userFetch(`/users/members/branch/${branchId}`, 'GET', null, token);
    return response.users || [];
  } catch (error) {
    console.error('Error fetching members by branch:', error);
    return [];
  }
};

// Get user by ID
export const getUserById = async (id, token) => {
  if (!id || !isValidUserId(id)) {
    console.warn('getUserById: Invalid user ID', id);
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await userFetch(`/users/${id}`, 'GET', null, token);
      return response.user;
    },
    null
  );
};

// Get user by email
export const getUserByEmail = async (email, token) => {
  if (!email) {
    console.warn('getUserByEmail: No email provided');
    return null;
  }
  
  return safeMutation(
    async () => {
      const users = await getUsers(token);
      return users.find(u => u.email === email);
    },
    null
  );
};

// Update user
export const updateUser = async (id, userData, token) => {
  if (!id || !isValidUserId(id)) {
    console.error('updateUser: Invalid user ID', id);
    return null;
  }
  
  if (!token) {
    console.error('updateUser: No token provided');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await userFetch(`/users/${id}`, 'PUT', userData, token);
      return response.user;
    },
    null
  );
};

// Delete user (Admin only)
export const deleteUser = async (id, token) => {
  if (!id || !isValidUserId(id)) {
    console.error('deleteUser: Invalid user ID', id);
    return false;
  }
  
  if (!token) {
    console.error('deleteUser: No token provided');
    return false;
  }
  
  return safeMutation(
    async () => {
      await userFetch(`/users/${id}`, 'DELETE', null, token);
      return true;
    },
    false
  );
};

// Get user by referral code
export const getUserByReferralCode = async (code) => {
  if (!code) {
    console.warn('getUserByReferralCode: No referral code provided');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await userFetch(`/users/referral/${code}`, 'GET');
      return response.user;
    },
    null
  );
};

// Generate referral code
export const generateReferralCode = (email) => {
  if (!email) {
    console.warn('generateReferralCode: No email provided');
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  return email.split('@')[0].toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Save user (for registration - use authAPI instead)
export const saveUser = async (userData, token) => {
  console.warn('saveUser is deprecated, use authAPI.register instead');
  return userData;
};

// ============ CREDITS FUNCTIONS ============

// Add referral credit to user
export const addReferralCredit = async (userId, credits, token) => {
  if (!userId || !isValidUserId(userId)) {
    console.error('addReferralCredit: Invalid user ID', userId);
    return { success: false, message: 'Invalid user ID' };
  }
  
  if (!credits || credits <= 0) {
    console.error('addReferralCredit: Invalid credits amount', credits);
    return { success: false, message: 'Invalid credits amount' };
  }
  
  return safeMutation(
    async () => {
      const response = await userFetch(`/users/${userId}/add-credits`, 'POST', { credits }, token);
      return { success: true, user: response.user };
    },
    { success: false, message: 'Failed to add credits' }
  );
};

// Redeem credits for discount
export const redeemCredits = async (userId, amount, token) => {
  if (!userId || !isValidUserId(userId)) {
    console.error('redeemCredits: Invalid user ID', userId);
    return { success: false, message: 'Invalid user ID' };
  }
  
  if (!amount || amount <= 0) {
    console.error('redeemCredits: Invalid amount', amount);
    return { success: false, message: 'Invalid amount' };
  }
  
  return safeMutation(
    async () => {
      const response = await userFetch(`/users/${userId}/redeem-credits`, 'POST', { amount }, token);
      return { success: true, user: response.user, message: response.message };
    },
    { success: false, message: 'Failed to redeem credits' }
  );
};

// Get user credits
export const getUserCredits = async (userId, token) => {
  if (!userId || !isValidUserId(userId)) {
    console.error('getUserCredits: Invalid user ID', userId);
    return { success: false, credits: 0 };
  }
  
  return safeMutation(
    async () => {
      const response = await userFetch(`/users/${userId}/credits`, 'GET', null, token);
      return { success: true, credits: response.credits || 0 };
    },
    { success: false, credits: 0 }
  );
};

// ============ ALIASES FOR COMPONENTS ============
export const getAllUsers = getUsers;
export const getUserList = getUsers;
export const fetchUsers = getUsers;