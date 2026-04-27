const API_BASE_URL = 'http://localhost:5000/api';

const branchFetch = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Get all branches (public)
export const getBranches = async () => {
  try {
    const response = await branchFetch('/branches', 'GET');
    return response.branches || [];
  } catch (error) {
    console.error('Error fetching branches:', error);
    return JSON.parse(localStorage.getItem('gym_branches') || '[]');
  }
};

// Get branch by ID
export const getBranchById = async (id) => {
  try {
    const response = await branchFetch(`/branches/${id}`, 'GET');
    return response.branch;
  } catch (error) {
    console.error('Error fetching branch:', error);
    const branches = JSON.parse(localStorage.getItem('gym_branches') || '[]');
    return branches.find(b => b.id === id);
  }
};

// Create branch (Admin only)
export const createBranch = async (branchData, token) => {
  try {
    const response = await branchFetch('/branches', 'POST', branchData, token);
    return response.branch;
  } catch (error) {
    console.error('Error creating branch:', error);
    const branches = JSON.parse(localStorage.getItem('gym_branches') || '[]');
    const newBranch = { ...branchData, id: Date.now() };
    branches.push(newBranch);
    localStorage.setItem('gym_branches', JSON.stringify(branches));
    return newBranch;
  }
};

// Update branch
export const updateBranch = async (id, branchData, token) => {
  try {
    const response = await branchFetch(`/branches/${id}`, 'PUT', branchData, token);
    return response.branch;
  } catch (error) {
    console.error('Error updating branch:', error);
    const branches = JSON.parse(localStorage.getItem('gym_branches') || '[]');
    const updatedBranches = branches.map(b => b.id === id ? { ...b, ...branchData } : b);
    localStorage.setItem('gym_branches', JSON.stringify(updatedBranches));
    return { id, ...branchData };
  }
};

// Delete branch
export const deleteBranch = async (id, token) => {
  try {
    await branchFetch(`/branches/${id}`, 'DELETE', null, token);
    return true;
  } catch (error) {
    console.error('Error deleting branch:', error);
    const branches = JSON.parse(localStorage.getItem('gym_branches') || '[]');
    const filtered = branches.filter(b => b.id !== id);
    localStorage.setItem('gym_branches', JSON.stringify(filtered));
    return true;
  }
};

// Initialize default branches
export const initDefaultBranches = async (token) => {
  try {
    const branches = await getBranches();
    if (branches.length === 0 && token) {
      const defaultBranches = [
        { name: 'Main Branch', address: '123 Main St', city: 'Nairobi', phone: '+254700000000', isActive: true },
        { name: 'Westlands Branch', address: '456 Westlands Rd', city: 'Nairobi', phone: '+254711111111', isActive: true }
      ];
      for (const branch of defaultBranches) {
        await createBranch(branch, token);
      }
    }
  } catch (error) {
    if (error.message && (error.message.includes('403') || error.message.includes('Admin access required'))) {
      console.log('Skipping branch initialization - admin access required');
      return;
    }
    console.error('Error initializing branches:', error);
  }
};

// ============ ALIASES FOR COMPONENTS ============
export const saveBranch = async (branchData, token) => {
  if (branchData.id) {
    return await updateBranch(branchData.id, branchData, token);
  } else {
    return await createBranch(branchData, token);
  }
};

export const getAllBranches = getBranches;
export const getBranchList = getBranches;
export const fetchBranches = getBranches;