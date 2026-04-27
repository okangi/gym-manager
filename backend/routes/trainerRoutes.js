const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// @route   GET /api/trainers
// @desc    Get all trainers (accessible by members and admins)
// @access  Private (any logged in user)
router.get('/', protect, async (req, res) => {
  try {
    // Find all users with role 'trainer' and active status
    const trainers = await User.find({ 
      role: 'trainer',
      isActive: { $ne: false } // Only active trainers
    }).select('-password'); // Don't send password field
    
    res.json({
      success: true,
      count: trainers.length,
      trainers: trainers
    });
  } catch (error) {
    console.error('Error fetching trainers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching trainers',
      error: error.message 
    });
  }
});

// @route   GET /api/trainers/:id
// @desc    Get single trainer by ID
// @access  Private (any logged in user)
router.get('/:id', protect, async (req, res) => {
  try {
    const trainer = await User.findOne({ 
      _id: req.params.id, 
      role: 'trainer' 
    }).select('-password');
    
    if (!trainer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trainer not found' 
      });
    }
    
    res.json({
      success: true,
      trainer: trainer
    });
  } catch (error) {
    console.error('Error fetching trainer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching trainer',
      error: error.message 
    });
  }
});

// @route   PUT /api/trainers/:id
// @desc    Update trainer (Admin only)
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const trainer = await User.findById(req.params.id);
    
    if (!trainer || trainer.role !== 'trainer') {
      return res.status(404).json({ 
        success: false, 
        message: 'Trainer not found' 
      });
    }
    
    const updatedTrainer = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      trainer: updatedTrainer
    });
  } catch (error) {
    console.error('Error updating trainer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating trainer',
      error: error.message 
    });
  }
});

// @route   DELETE /api/trainers/:id
// @desc    Delete trainer (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const trainer = await User.findById(req.params.id);
    
    if (!trainer || trainer.role !== 'trainer') {
      return res.status(404).json({ 
        success: false, 
        message: 'Trainer not found' 
      });
    }
    
    // Soft delete - set isActive to false instead of removing
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    
    res.json({
      success: true,
      message: 'Trainer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting trainer:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting trainer',
      error: error.message 
    });
  }
});

module.exports = router;