const API_BASE_URL = 'http://localhost:5000/api';

const membershipFetch = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Get active membership for user - UPDATED to use dedicated endpoint
export const getActiveMembership = async (userId, token) => {
  try {
    // Use dedicated membership endpoint
    const response = await membershipFetch(`/memberships/active/${userId}`, 'GET', null, token);
    console.log('getActiveMembership response:', response);
    
    if (response.membership) {
      return response.membership;
    }
    return null;
  } catch (error) {
    console.error('Error fetching membership:', error);
    return null;
  }
};

// Create new membership
export const createMembership = async (membershipData, token) => {
  try {
    const response = await membershipFetch('/memberships', 'POST', membershipData, token);
    return response.membership;
  } catch (error) {
    console.error('Error creating membership:', error);
    throw error;
  }
};

// Get membership history
export const getMembershipHistory = async (userId, token) => {
  try {
    const response = await membershipFetch(`/memberships/history/${userId}`, 'GET', null, token);
    return response.memberships || [];
  } catch (error) {
    console.error('Error fetching membership history:', error);
    return [];
  }
};

// Renew membership
export const renewMembership = async (membershipId, endDate, amount, token) => {
  try {
    const response = await membershipFetch(`/memberships/${membershipId}/renew`, 'PUT', { endDate, amount }, token);
    return response.membership;
  } catch (error) {
    console.error('Error renewing membership:', error);
    throw error;
  }
};

// Cancel membership
export const cancelMembership = async (membershipId, token) => {
  try {
    const response = await membershipFetch(`/memberships/${membershipId}/cancel`, 'PUT', null, token);
    return response.success;
  } catch (error) {
    console.error('Error cancelling membership:', error);
    throw error;
  }
};

// Check if user has active membership
export const hasActiveMembership = async (userId, token) => {
  const membership = await getActiveMembership(userId, token);
  return !!membership;
};

// Update membership (Admin only) - keep for compatibility
export const updateMembership = async (userId, membershipData, token) => {
  console.warn('updateMembership is deprecated, use createMembership instead');
  return createMembership({ userId, ...membershipData }, token);
};

export const addMembership = async (membershipData, token) => {
  return await createMembership(membershipData, token);
};