const express = require('express');
const router = express.Router();
const Membership = require('../models/Membership');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Get active membership for user
router.get('/active/:userId', protect, async (req, res) => {
  try {
    // Update expired memberships first
    await Membership.updateExpiredStatus();
    
    const membership = await Membership.findOne({
      userId: req.params.userId,
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('planId', 'name price durationDays features');
    
    if (membership) {
      return res.json({
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
    }
    
    // If no membership in Membership collection, check user object
    const user = await User.findById(req.params.userId).select('currentPlanName membershipStartDate membershipEndDate');
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
    
    res.json({ success: true, membership: null });
  } catch (error) {
    console.error('Error getting active membership:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// Get user's membership history
router.get('/history/:userId', protect, async (req, res) => {
  try {
    const memberships = await Membership.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('planId', 'name');
    
    res.json({ success: true, memberships });
  } catch (error) {
    console.error('Error getting membership history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new membership
router.post('/', protect, async (req, res) => {
  try {
    const { userId, planId, planName, startDate, endDate, amount, paymentId } = req.body;
    
    const targetUserId = userId || req.user._id;
    
    console.log(`Creating membership for user ${targetUserId} - Plan: ${planName}`);
    
    // Deactivate existing memberships
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
    
    // IMPORTANT: Update user object via the dedicated endpoint
    await fetch(`http://localhost:5000/api/users/${targetUserId}/membership`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        planName,
        startDate: startDate || new Date(),
        endDate
      })
    });
    
    // Also direct database update as backup
    await User.findByIdAndUpdate(targetUserId, {
      currentPlanId: planId,
      currentPlanName: planName,
      membershipStartDate: startDate || new Date(),
      membershipEndDate: endDate,
      isMember: true,
      updatedAt: new Date()
    });
    
    console.log(`✅ Membership created and user ${targetUserId} updated with plan: ${planName}`);
    
    res.json({ 
      success: true, 
      membership,
      message: `Successfully created ${planName} membership`
    });
  } catch (error) {
    console.error('Error creating membership:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// Upgrade membership (replace current with new)
router.post('/upgrade', protect, async (req, res) => {
  try {
    const { userId, planId, planName, startDate, endDate, amount, paymentId } = req.body;
    
    const targetUserId = userId || req.user._id;
    
    console.log(`Upgrading membership for user ${targetUserId} to plan ${planName}`);
    
    // Expire current active membership
    const expired = await Membership.updateMany(
      { userId: targetUserId, status: 'active' },
      { 
        status: 'expired', 
        updatedAt: new Date(),
        note: `Upgraded to ${planName} on ${new Date().toISOString()}`
      }
    );
    
    console.log(`Expired ${expired.modifiedCount} existing memberships`);
    
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Renew membership
router.put('/:id/renew', protect, async (req, res) => {
  try {
    const { endDate, amount } = req.body;
    
    const membership = await Membership.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership not found' });
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel membership
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership not found' });
    }
    
    membership.status = 'cancelled';
    membership.updatedAt = new Date();
    await membership.save();
    
    res.json({ success: true, message: 'Membership cancelled' });
  } catch (error) {
    console.error('Error cancelling membership:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

    // Sync membership to user object (fix for existing memberships)
router.post('/sync/:userId', protect, async (req, res) => {
  try {
    const membership = await Membership.findOne({
      userId: req.params.userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    if (membership) {
      await User.findByIdAndUpdate(req.params.userId, {
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
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;