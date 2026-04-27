const Membership = require('../models/Membership');
const User = require('../models/User');
const { isValidObjectId } = require('../utils/validateId');

// Get active membership for user
const getActiveMembership = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    // Update expired memberships first
    await Membership.updateExpiredStatus();
    
    const membership = await Membership.findOne({
      userId: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('planId', 'name price durationDays features');
    
    if (!membership) {
      // Also check user object for membership info
      const user = await User.findById(userId).select('currentPlanName membershipStartDate membershipEndDate');
      if (user && user.membershipEndDate && new Date(user.membershipEndDate) > new Date()) {
        return res.json({
          success: true,
          membership: {
            id: 'user-based',
            planName: user.currentPlanName || 'Active Member',
            startDate: user.membershipStartDate,
            endDate: user.membershipEndDate,
            status: 'active'
          }
        });
      }
      
      return res.json({ success: true, membership: null });
    }
    
    res.json({
      success: true,
      membership: {
        id: membership._id,
        planId: membership.planId?._id || membership.planId,
        planName: membership.planName || membership.planId?.name,
        startDate: membership.startDate,
        endDate: membership.endDate,
        status: membership.status,
        amount: membership.amount
      }
    });
  } catch (error) {
    console.error('Error getting active membership:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Get user's membership history
const getMembershipHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    const memberships = await Membership.find({ userId: userId })
      .sort({ createdAt: -1 })
      .populate('planId', 'name');
    
    res.json({ success: true, memberships });
  } catch (error) {
    console.error('Error getting membership history:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Create new membership
const createMembership = async (req, res) => {
  try {
    const { userId, planId, planName, startDate, endDate, amount, paymentId } = req.body;
    
    const targetUserId = userId || req.user._id;
    
    // Validate targetUserId
    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    if (!planId || !planName || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: planId, planName, endDate' 
      });
    }
    
    console.log(`Creating membership for user ${targetUserId} - Plan: ${planName}`);
    
    // Deactivate any existing active memberships for this user
    await Membership.updateMany(
      { userId: targetUserId, status: 'active' },
      { status: 'expired', updatedAt: new Date() }
    );
    
    // Create new membership
    const membership = await Membership.create({
      userId: targetUserId,
      planId,
      planName,
      startDate: startDate || new Date(),
      endDate,
      amount,
      paymentId,
      status: 'active'
    });
    
    // Update user object with membership info
    await User.findByIdAndUpdate(targetUserId, {
      currentPlanId: planId,
      currentPlanName: planName,
      membershipStartDate: startDate || new Date(),
      membershipEndDate: endDate,
      isMember: true,
      updatedAt: new Date()
    });
    
    console.log(`✅ Membership created successfully! Ends: ${endDate}`);
    
    res.json({ success: true, membership });
  } catch (error) {
    console.error('Error creating membership:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Upgrade membership
const upgradeMembership = async (req, res) => {
  try {
    const { userId, planId, planName, startDate, endDate, amount, paymentId } = req.body;
    
    const targetUserId = userId || req.user._id;
    
    // Validate targetUserId
    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    console.log(`Upgrading membership for user ${targetUserId} to plan ${planName}`);
    
    // Expire current active membership
    await Membership.updateMany(
      { userId: targetUserId, status: 'active' },
      { 
        status: 'expired', 
        updatedAt: new Date(),
        note: `Upgraded to ${planName} on ${new Date().toISOString()}`
      }
    );
    
    // Create new membership
    const membership = await Membership.create({
      userId: targetUserId,
      planId,
      planName,
      startDate: startDate || new Date(),
      endDate,
      amount,
      paymentId,
      status: 'active'
    });
    
    // Update user object
    await User.findByIdAndUpdate(targetUserId, {
      currentPlanId: planId,
      currentPlanName: planName,
      membershipStartDate: startDate || new Date(),
      membershipEndDate: endDate,
      isMember: true,
      updatedAt: new Date()
    });
    
    console.log(`✅ Membership upgraded successfully for user ${targetUserId}`);
    console.log(`New membership ends: ${endDate}`);
    
    res.json({ 
      success: true, 
      membership,
      message: `Successfully upgraded to ${planName}`
    });
  } catch (error) {
    console.error('Error upgrading membership:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Renew membership
const renewMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { endDate, amount } = req.body;
    
    // Validate ID
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid membership ID format' 
      });
    }
    
    const membership = await Membership.findById(id);
    if (!membership) {
      return res.status(404).json({ 
        success: false, 
        message: 'Membership not found' 
      });
    }
    
    membership.endDate = endDate;
    membership.amount = amount;
    membership.status = 'active';
    membership.updatedAt = new Date();
    await membership.save();
    
    // Update user object
    await User.findByIdAndUpdate(membership.userId, {
      membershipEndDate: endDate
    });
    
    res.json({ success: true, membership });
  } catch (error) {
    console.error('Error renewing membership:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Cancel membership
const cancelMembership = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid membership ID format' 
      });
    }
    
    const membership = await Membership.findById(id);
    if (!membership) {
      return res.status(404).json({ 
        success: false, 
        message: 'Membership not found' 
      });
    }
    
    membership.status = 'cancelled';
    membership.updatedAt = new Date();
    await membership.save();
    
    res.json({ success: true, message: 'Membership cancelled' });
  } catch (error) {
    console.error('Error cancelling membership:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Sync membership to user object
const syncMembership = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    const membership = await Membership.findOne({
      userId: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    if (membership) {
      await User.findByIdAndUpdate(userId, {
        currentPlanId: membership.planId,
        currentPlanName: membership.planName,
        membershipStartDate: membership.startDate,
        membershipEndDate: membership.endDate,
        isMember: true
      });
      
      return res.json({ 
        success: true, 
        message: 'User object synced with membership',
        membership 
      });
    }
    
    res.json({ success: true, message: 'No active membership found' });
  } catch (error) {
    console.error('Error syncing membership:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

module.exports = {
  getActiveMembership,
  getMembershipHistory,
  createMembership,
  upgradeMembership,
  renewMembership,
  cancelMembership,
  syncMembership
};