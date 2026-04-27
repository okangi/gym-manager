import { safeApiCall, safeGet, safeMutation, isValidObjectIdFormat } from './apiWrapper';

const API_BASE_URL = 'http://localhost:5000/api';

const paymentFetch = async (endpoint, method = 'GET', data = null, token = null) => {
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

// Get all payments (Admin sees all, users see only theirs)
export const getPayments = async (token) => {
  return safeGet(
    async () => {
      const response = await paymentFetch('/payments', 'GET', null, token);
      return response.payments || [];
    },
    []
  );
};

// Get payment by ID
export const getPaymentById = async (id, token) => {
  if (!id || !isValidObjectIdFormat(id)) {
    console.warn('getPaymentById: Invalid payment ID', id);
    return null;
  }
  
  return safeMutation(
    async () => {
      const response = await paymentFetch(`/payments/${id}`, 'GET', null, token);
      return response.payment;
    },
    null
  );
};

// Create payment
export const createPayment = async (paymentData, token) => {
  // Validate required fields
  if (!paymentData?.amount) {
    console.error('createPayment: Amount is required');
    return null;
  }
  
  if (!paymentData?.planId && !paymentData?.planName) {
    console.error('createPayment: Plan ID or Plan Name is required');
    return null;
  }
  
  if (!paymentData?.userEmail || !paymentData?.userName) {
    console.error('createPayment: userEmail and userName are required');
    return null;
  }
  
  if (!token) {
    console.error('createPayment: No token provided');
    return null;
  }
  
  return safeMutation(
    async () => {
      // Get current user from localStorage for userId
      let userId = null;
      let userEmail = paymentData.userEmail;
      let userName = paymentData.userName;
      
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        userId = user.id || user._id;
        if (!userEmail) userEmail = user.email;
        if (!userName) userName = user.name;
      } catch (e) {
        console.warn('Could not get user from localStorage');
      }
      
      // Ensure status uses correct capitalization
      const status = paymentData.status === 'completed' ? 'Completed' : (paymentData.status || 'Completed');
      
      // Ensure payment method uses correct format
      let paymentMethod = paymentData.paymentMethod || 'Card';
      if (paymentMethod === 'mpesa') paymentMethod = 'Mpesa';
      if (paymentMethod === 'airtel') paymentMethod = 'Bank Transfer';
      if (paymentMethod === 'card') paymentMethod = 'Card';
      
      const paymentToSend = {
        amount: paymentData.amount,
        planId: paymentData.planId,
        planName: paymentData.planName,
        userId: userId || paymentData.userId,
        userEmail: userEmail,
        userName: userName,
        paymentMethod: paymentMethod,
        status: status,
        transactionId: paymentData.transactionId || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentDate: paymentData.paymentDate || new Date(),
        notes: paymentData.notes || '',
        type: paymentData.type || 'membership_join',
        createdAt: new Date().toISOString()
      };
      
      console.log('Sending payment to backend:', paymentToSend);
      
      const response = await paymentFetch('/payments', 'POST', paymentToSend, token);
      
      if (response.success && response.payment) {
        // Update localStorage backup (for offline support)
        const payments = JSON.parse(localStorage.getItem('gym_payments') || '[]');
        payments.push(response.payment);
        localStorage.setItem('gym_payments', JSON.stringify(payments));
        return response.payment;
      }
      throw new Error(response.message || 'Failed to create payment');
    },
    null
  );
};

// Update payment status (Admin only)
export const updatePaymentStatus = async (id, status, token) => {
  if (!id || !isValidObjectIdFormat(id)) {
    console.error('updatePaymentStatus: Invalid payment ID', id);
    return null;
  }
  
  if (!status) {
    console.error('updatePaymentStatus: Status is required');
    return null;
  }
  
  if (!token) {
    console.error('updatePaymentStatus: No token provided');
    return null;
  }
  
  // Ensure status uses correct capitalization
  const formattedStatus = status === 'completed' ? 'Completed' : 
                         status === 'pending' ? 'Pending' :
                         status === 'failed' ? 'Failed' :
                         status === 'refunded' ? 'Refunded' : status;
  
  return safeMutation(
    async () => {
      const response = await paymentFetch(`/payments/${id}`, 'PUT', { status: formattedStatus }, token);
      
      if (response.success && response.payment) {
        // Update localStorage backup
        const payments = JSON.parse(localStorage.getItem('gym_payments') || '[]');
        const updatedPayments = payments.map(p => (p.id === id || p._id === id) ? { ...p, status: formattedStatus } : p);
        localStorage.setItem('gym_payments', JSON.stringify(updatedPayments));
        return response.payment;
      }
      throw new Error(response.message || 'Failed to update payment');
    },
    null
  );
};

// Get user payment history
export const getUserPayments = async (userId, token) => {
  if (!userId) {
    console.warn('getUserPayments: No userId provided');
    return [];
  }
  
  const payments = await getPayments(token);
  return payments.filter(p => p.userId === userId || p.userId?._id === userId || p.userEmail === userId);
};

// Get payment summary (for dashboard)
export const getPaymentSummary = async (token) => {
  return safeGet(
    async () => {
      const response = await paymentFetch('/payments/summary', 'GET', null, token);
      return response.summary || { total: 0, count: 0, recent: [] };
    },
    { total: 0, count: 0, recent: [] }
  );
};

// ============ ALIASES FOR COMPONENTS ============
export const getAllPayments = getPayments;
export const getPaymentHistory = getPayments;
export const addPayment = createPayment;

export const savePayment = async (paymentData, token) => {
  if (paymentData.id || paymentData._id) {
    const status = paymentData.status || 'Completed';
    return await updatePaymentStatus(paymentData.id || paymentData._id, status, token);
  } else {
    return await createPayment(paymentData, token);
  }
};