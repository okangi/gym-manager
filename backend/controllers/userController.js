const User = require('../models/User');
const { isValidObjectId } = require('../utils/validateId');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// @desc    Get user by referral code
// @route   GET /api/users/referral/:code
// @access  Public
const getUserByReferralCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Referral code is required' 
      });
    }
    
    const user = await User.findOne({ referralCode: code }).select('name email referralCode');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid referral code' 
      });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error getting user by referral code:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// @desc    Redeem credits for discount
// @route   POST /api/users/:id/redeem-credits
// @access  Private
const redeemCredits = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    
    // Validate ID
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid amount is required' 
      });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (user.referralCredits < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient credits' 
      });
    }
    
    user.referralCredits -= amount;
    await user.save();
    
    res.json({ 
      success: true, 
      message: `Successfully redeemed ${amount} credits`,
      user: { 
        id: user._id,
        referralCredits: user.referralCredits 
      } 
    });
  } catch (error) {
    console.error('Error redeeming credits:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// @desc    Add referral credit to user
// @route   POST /api/users/:id/add-credits
// @access  Private
const addReferralCredit = async (req, res) => {
  try {
    const { id } = req.params;
    const { credits } = req.body;
    
    // Validate ID
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    if (!credits || credits <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid credits amount is required' 
      });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    user.referralCredits = (user.referralCredits || 0) + credits;
    await user.save();
    
    res.json({ 
      success: true, 
      message: `Added ${credits} credit(s) to user`,
      user: { 
        id: user._id,
        referralCredits: user.referralCredits 
      } 
    });
  } catch (error) {
    console.error('Error adding referral credit:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// @desc    Get user credits
// @route   GET /api/users/:id/credits
// @access  Private
const getUserCredits = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    const user = await User.findById(id).select('referralCredits');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      credits: user.referralCredits || 0 
    });
  } catch (error) {
    console.error('Error getting user credits:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// @desc    Get members by branch (for trainers)
// @route   GET /api/users/members/branch/:branchId
// @access  Private/Trainer
const getMembersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    if (!branchId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Branch ID is required' 
      });
    }
    
    const users = await User.find({ 
      role: 'member', 
      branchId: branchId,
      isActive: true 
    }).select('name email phone branchId');
    
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error getting members by branch:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// @desc    Update user's membership status
// @route   PUT /api/users/:id/membership
// @access  Private
const updateUserMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { planId, planName, startDate, endDate } = req.body;
    
    // Validate ID
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      {
        currentPlanId: planId,
        currentPlanName: planName,
        membershipStartDate: startDate,
        membershipEndDate: endDate,
        isMember: true,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user membership:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

module.exports = { 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getUserByReferralCode,
  redeemCredits,
  addReferralCredit,
  getUserCredits,
  getMembersByBranch,
  updateUserMembership
};