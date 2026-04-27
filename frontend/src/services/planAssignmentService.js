import { safeApiCall, safeGet, safeMutation, isValidObjectIdFormat } from './apiWrapper';

const API_BASE_URL = 'http://localhost:5000/api';

const assignmentFetch = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Get plans for a member
export const getUserPlans = async (userId, token) => {
  if (!userId || !isValidObjectIdFormat(userId)) {
    console.warn('getUserPlans: Invalid user ID', userId);
    return [];
  }
  
  return safeGet(
    async () => {
      const response = await assignmentFetch(`/plan-assignments/user/${userId}`, 'GET', null, token);
      return response.plans || [];
    },
    []
  );
};

// Get plans created by a trainer
export const getTrainerPlans = async (trainerId, token) => {
  if (!trainerId || !isValidObjectIdFormat(trainerId)) {
    console.warn('getTrainerPlans: Invalid trainer ID', trainerId);
    return [];
  }
  
  return safeGet(
    async () => {
      const response = await assignmentFetch(`/plan-assignments/trainer/${trainerId}`, 'GET', null, token);
      return response.plans || [];
    },
    []
  );
};

// Get plan by ID
export const getPlanAssignmentById = async (id, token) => {
  if (!id || !isValidObjectIdFormat(id)) {
    console.warn('getPlanAssignmentById: Invalid plan ID', id);
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await assignmentFetch(`/plan-assignments/${id}`, 'GET', null, token);
      return response.plan;
    },
    null
  );
};

// Create plan assignment
export const createPlanAssignment = async (planData, token) => {
  if (!planData?.userId || !planData?.title) {
    console.error('createPlanAssignment: Missing required fields');
    return null;
  }
  
  if (!token) {
    console.error('createPlanAssignment: No token provided');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await assignmentFetch('/plan-assignments', 'POST', planData, token);
      return response.plan;
    },
    null
  );
};

// Update plan assignment
export const updatePlanAssignment = async (id, planData, token) => {
  if (!id || !isValidObjectIdFormat(id)) {
    console.error('updatePlanAssignment: Invalid plan ID', id);
    return null;
  }
  
  if (!token) {
    console.error('updatePlanAssignment: No token provided');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await assignmentFetch(`/plan-assignments/${id}`, 'PUT', planData, token);
      return response.plan;
    },
    null
  );
};

// Delete plan assignment
export const deletePlanAssignment = async (id, token) => {
  if (!id || !isValidObjectIdFormat(id)) {
    console.error('deletePlanAssignment: Invalid plan ID', id);
    return false;
  }
  
  if (!token) {
    console.error('deletePlanAssignment: No token provided');
    return false;
  }
  
  return safeMutation(
    async () => {
      await assignmentFetch(`/plan-assignments/${id}`, 'DELETE', null, token);
      return true;
    },
    false
  );
};

// Add comment to plan (trainer only)
export const addTrainerComment = async (planId, comment, token) => {
  if (!planId || !isValidObjectIdFormat(planId)) {
    console.error('addTrainerComment: Invalid plan ID', planId);
    return null;
  }
  
  if (!comment || comment.trim() === '') {
    console.error('addTrainerComment: Comment cannot be empty');
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await assignmentFetch(`/plan-assignments/${planId}/comment`, 'POST', { comment }, token);
      return response.plan;
    },
    null
  );
};

// Mark exercise as complete (member)
export const completeExercise = async (planId, exerciseIndex, token) => {
  if (!planId || !isValidObjectIdFormat(planId)) {
    console.error('completeExercise: Invalid plan ID', planId);
    return false;
  }
  
  return safeMutation(
    async () => {
      const plan = await getPlanAssignmentById(planId, token);
      if (plan && plan.exercises && plan.exercises[exerciseIndex]) {
        plan.exercises[exerciseIndex].completed = true;
        const completedCount = plan.exercises.filter(e => e.completed).length;
        plan.progress = (completedCount / plan.exercises.length) * 100;
        await updatePlanAssignment(planId, plan, token);
        return true;
      }
      return false;
    },
    false
  );
};

// Add attachment
export const addAttachment = async (planId, fileName, fileData, token) => {
  console.log('Add attachment:', planId, fileName);
  return true;
};

// Aliases
export const getMemberPlans = getUserPlans;
export const createPlan = createPlanAssignment;
export const updatePlan = updatePlanAssignment;
export const deletePlan = deletePlanAssignment;