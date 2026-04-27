import { safeApiCall, safeGet, safeMutation, isValidObjectIdFormat } from './apiWrapper';

const API_BASE_URL = 'http://localhost:5000/api';

const trainerFetch = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Get all trainers
export const getTrainers = async (token) => {
  return safeGet(
    async () => {
      const response = await trainerFetch('/trainers', 'GET', null, token);
      return response.trainers || [];
    },
    []
  );
};

// Get trainer by ID
export const getTrainerById = async (id, token) => {
  if (!id || !isValidObjectIdFormat(id)) {
    console.warn('getTrainerById: Invalid trainer ID', id);
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await trainerFetch(`/trainers/${id}`, 'GET', null, token);
      return response.trainer;
    },
    null
  );
};

// Create trainer (Admin only)
export const createTrainer = async (trainerData, token) => {
  if (!trainerData?.name || !trainerData?.email || !trainerData?.password) {
    console.error('createTrainer: Missing required fields');
    return null;
  }
  
  if (!token) {
    console.error('createTrainer: No token provided');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await trainerFetch('/auth/register', 'POST', {
        ...trainerData,
        role: 'trainer'
      }, token);
      return response.user;
    },
    null
  );
};

// Update trainer (Admin only)
export const updateTrainer = async (id, trainerData, token) => {
  if (!id || !isValidObjectIdFormat(id)) {
    console.error('updateTrainer: Invalid trainer ID', id);
    return null;
  }
  
  if (!token) {
    console.error('updateTrainer: No token provided');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await trainerFetch(`/trainers/${id}`, 'PUT', trainerData, token);
      return response.trainer;
    },
    null
  );
};

// Delete trainer (Admin only)
export const deleteTrainer = async (id, token) => {
  if (!id || !isValidObjectIdFormat(id)) {
    console.error('deleteTrainer: Invalid trainer ID', id);
    return false;
  }
  
  if (!token) {
    console.error('deleteTrainer: No token provided');
    return false;
  }
  
  return safeMutation(
    async () => {
      await trainerFetch(`/trainers/${id}`, 'DELETE', null, token);
      return true;
    },
    false
  );
};

// Initialize default trainers (Admin only)
export const initDefaultTrainers = async (token) => {
  try {
    const trainers = await getTrainers(token);
    if (trainers.length === 0 && token) {
      const defaultTrainers = [
        { name: 'John Smith', email: 'john@trainer.com', password: 'trainer123', specialization: 'Strength Training', experience: 5 },
        { name: 'Jane Doe', email: 'jane@trainer.com', password: 'trainer123', specialization: 'Yoga & Pilates', experience: 8 }
      ];
      for (const trainer of defaultTrainers) {
        await createTrainer(trainer, token);
      }
      console.log('✅ Default trainers created');
    }
  } catch (error) {
    if (error.message && (error.message.includes('403') || error.message.includes('Admin access required'))) {
      console.log('Skipping trainer initialization - admin access required');
      return;
    }
    console.error('Error initializing trainers:', error);
  }
};

// ============ ALIASES FOR COMPONENTS ============
export const saveTrainer = async (trainerData, token) => {
  if (trainerData.id || trainerData._id) {
    return await updateTrainer(trainerData.id || trainerData._id, trainerData, token);
  } else {
    return await createTrainer(trainerData, token);
  }
};

export const getAllTrainers = getTrainers;
export const getTrainerList = getTrainers;
export const fetchTrainers = getTrainers;