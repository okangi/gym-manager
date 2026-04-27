import { safeApiCall, safeGet, safeMutation, isValidObjectIdFormat } from './apiWrapper';

const API_BASE_URL = 'http://localhost:5000/api';

const planFetch = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Get all membership plans (public)
export const getPlans = async () => {
  return safeGet(
    async () => {
      const response = await planFetch('/plans', 'GET');
      return response.plans || [];
    },
    []
  );
};

// Get plan by ID (public)
export const getPlanById = async (id) => {
  if (!id || !isValidObjectIdFormat(id)) {
    console.warn('getPlanById: Invalid plan ID', id);
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await planFetch(`/plans/${id}`, 'GET');
      return response.plan;
    },
    null
  );
};

// Create membership plan (Admin only)
export const createPlan = async (planData, token) => {
  if (!planData?.name || !planData?.price || !planData?.durationDays) {
    console.error('createPlan: Missing required fields');
    return null;
  }
  
  if (!token) {
    console.error('createPlan: No token provided');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await planFetch('/plans', 'POST', planData, token);
      return response.plan;
    },
    null
  );
};

// Update membership plan (Admin only)
export const updatePlan = async (id, planData, token) => {
  if (!id || !isValidObjectIdFormat(id)) {
    console.error('updatePlan: Invalid plan ID', id);
    return null;
  }
  
  if (!token) {
    console.error('updatePlan: No token provided');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await planFetch(`/plans/${id}`, 'PUT', planData, token);
      return response.plan;
    },
    null
  );
};

// Delete membership plan (Admin only)
export const deletePlan = async (id, token) => {
  if (!id || !isValidObjectIdFormat(id)) {
    console.error('deletePlan: Invalid plan ID', id);
    return false;
  }
  
  if (!token) {
    console.error('deletePlan: No token provided');
    return false;
  }
  
  return safeMutation(
    async () => {
      await planFetch(`/plans/${id}`, 'DELETE', null, token);
      return true;
    },
    false
  );
};

// Initialize default membership plans (Admin only)
export const initDefaultPlans = async (token) => {
  try {
    const plans = await getPlans();
    if (plans.length === 0 && token) {
      const defaultPlans = [
        { name: 'Basic', price: 2500, durationDays: 30, features: ['Gym Access', 'Locker Room'], isActive: true },
        { name: 'Premium', price: 5000, durationDays: 30, features: ['Gym Access', 'Group Classes', 'Sauna'], isActive: true },
        { name: 'Annual', price: 45000, durationDays: 365, features: ['All Access', 'Personal Trainer'], isActive: true }
      ];
      for (const plan of defaultPlans) {
        await createPlan(plan, token);
      }
      console.log('✅ Default membership plans created');
    }
  } catch (error) {
    if (error.message && (error.message.includes('403') || error.message.includes('Admin access required'))) {
      console.log('Skipping plan initialization - admin access required');
      return;
    }
    console.error('Error initializing plans:', error);
  }
};

// Aliases
export const getAllPlans = getPlans;
export const getPlanList = getPlans;
export const savePlan = createPlan;