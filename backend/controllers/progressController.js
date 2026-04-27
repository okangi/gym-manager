const Progress = require('../models/Progress');
const User = require('../models/User');
const { isValidObjectId } = require('../utils/validateId');

// Get progress entries for a user
const getProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    // Check if user has permission (trainer can view their clients)
    const isAuthorized = (
      req.user._id.toString() === userId ||
      req.user.role === 'admin' ||
      req.user.role === 'trainer'
    );
    
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this data' 
      });
    }
    
    const entries = await Progress.find({ userId })
      .sort({ date: -1 })
      .populate('createdBy', 'name')
      .populate('trainerId', 'name');
    
    res.json({ 
      success: true, 
      entries,
      count: entries.length
    });
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Add progress entry
const addProgress = async (req, res) => {
  try {
    const { userId, date, weight, bodyFat, muscleMass, notes } = req.body;
    
    // Validate required fields
    if (!userId || !date || !weight) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: userId, date, weight' 
      });
    }
    
    // Validate userId format
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    // Calculate BMI if height is available
    let bmi = null;
    const user = await User.findById(userId);
    if (user && user.height) {
      const heightInMeters = user.height / 100;
      bmi = weight / (heightInMeters * heightInMeters);
    }
    
    const entry = await Progress.create({
      userId,
      trainerId: req.user.role === 'trainer' ? req.user._id : null,
      date: new Date(date),
      weight,
      bodyFat: bodyFat || null,
      muscleMass: muscleMass || null,
      bmi: bmi ? Math.round(bmi * 10) / 10 : null,
      notes: notes || '',
      createdBy: req.user._id,
      createdAt: new Date()
    });
    
    res.status(201).json({ 
      success: true, 
      entry,
      message: 'Progress entry added successfully'
    });
  } catch (error) {
    console.error('Error adding progress:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Delete progress entry
const deleteProgress = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid entry ID format' 
      });
    }
    
    const entry = await Progress.findById(id);
    
    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress entry not found' 
      });
    }
    
    // Check authorization
    const isAuthorized = (
      entry.userId.toString() === req.user._id.toString() ||
      req.user.role === 'admin' ||
      (req.user.role === 'trainer' && entry.trainerId?.toString() === req.user._id.toString())
    );
    
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this entry' 
      });
    }
    
    await Progress.findByIdAndDelete(id);
    
    res.json({ 
      success: true, 
      message: 'Progress entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting progress:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Update progress entry
const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { weight, bodyFat, muscleMass, notes } = req.body;
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid entry ID format' 
      });
    }
    
    const entry = await Progress.findById(id);
    
    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Progress entry not found' 
      });
    }
    
    // Check authorization
    const isAuthorized = (
      entry.userId.toString() === req.user._id.toString() ||
      req.user.role === 'admin' ||
      (req.user.role === 'trainer' && entry.trainerId?.toString() === req.user._id.toString())
    );
    
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this entry' 
      });
    }
    
    // Update fields
    if (weight) entry.weight = weight;
    if (bodyFat !== undefined) entry.bodyFat = bodyFat;
    if (muscleMass !== undefined) entry.muscleMass = muscleMass;
    if (notes !== undefined) entry.notes = notes;
    entry.updatedAt = new Date();
    
    await entry.save();
    
    res.json({ 
      success: true, 
      entry,
      message: 'Progress entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

module.exports = {
  getProgress,
  addProgress,
  deleteProgress,
  updateProgress
};