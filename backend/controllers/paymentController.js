const Payment = require('../models/Payment');
const User = require('../models/User');
const { isValidObjectId } = require('../utils/validateId');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    let query = {};
    
    // If user is not admin, only show their own payments
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }
    
    const payments = await Payment.find(query)
      .populate('userId', 'name email')
      .populate('planId', 'name price')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, payments });
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment ID format' 
      });
    }
    
    const payment = await Payment.findById(id)
      .populate('userId', 'name email')
      .populate('planId', 'name price durationDays');
    
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    if (req.user.role !== 'admin' && payment.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this payment' 
      });
    }
    
    res.json({ success: true, payment });
  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// @desc    Create payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
  try {
    const { 
      amount, 
      planId, 
      planName, 
      paymentMethod, 
      notes, 
      userId,
      userEmail,
      userName,
      status,
      transactionId,
      paymentDate,
      type
    } = req.body;
    
    console.log('Creating payment with data:', req.body);
    
    // Validate required fields
    if (!amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount is required' 
      });
    }
    
    if (!planId && !planName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Plan ID or Plan Name is required' 
      });
    }
    
    // Use provided userId or fallback to req.user._id
    const finalUserId = userId || req.user._id;
    
    // Get user details if not provided
    let finalUserEmail = userEmail;
    let finalUserName = userName;
    
    if (!finalUserEmail || !finalUserName) {
      const user = await User.findById(finalUserId);
      if (user) {
        finalUserEmail = finalUserEmail || user.email;
        finalUserName = finalUserName || user.name;
      }
    }
    
    // Ensure status uses correct capitalization for enum
    let finalStatus = 'Completed';
    if (status) {
      const statusLower = status.toLowerCase();
      if (statusLower === 'completed') finalStatus = 'Completed';
      else if (statusLower === 'pending') finalStatus = 'Pending';
      else if (statusLower === 'failed') finalStatus = 'Failed';
      else if (statusLower === 'refunded') finalStatus = 'Refunded';
      else finalStatus = status;
    }
    
    // Ensure payment method uses correct format for enum
    let finalMethod = 'Card';
    if (paymentMethod) {
      const methodLower = paymentMethod.toLowerCase();
      if (methodLower === 'card') finalMethod = 'Card';
      else if (methodLower === 'mpesa') finalMethod = 'Mpesa';
      else if (methodLower === 'cash') finalMethod = 'Cash';
      else if (methodLower === 'bank transfer') finalMethod = 'Bank Transfer';
      else if (methodLower === 'paypal') finalMethod = 'PayPal';
      else finalMethod = paymentMethod;
    }
    
    const paymentData = {
      userId: finalUserId,
      userEmail: finalUserEmail,
      userName: finalUserName,
      amount,
      planId: planId || null,
      planName: planName || 'Membership Plan',
      paymentMethod: finalMethod,
      status: finalStatus,
      notes: notes || '',
      transactionId: transactionId || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentDate: paymentDate || new Date(),
      createdAt: new Date()
    };
    
    console.log('Saving payment:', paymentData);
    
    const payment = await Payment.create(paymentData);
    
    res.status(201).json({ 
      success: true, 
      payment,
      message: 'Payment created successfully'
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update payment (Admin only)
// @route   PUT /api/payments/:id
// @access  Private/Admin
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment ID format' 
      });
    }
    
    const payment = await Payment.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    res.json({ success: true, payment });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

module.exports = { getPayments, getPaymentById, createPayment, updatePayment };