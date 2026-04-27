const express = require('express');
const router = express.Router();
const { uploadProfilePicture, uploadMultipleImages, uploadClassImage } = require('../middleware/uploadMiddleware');
const { protect, adminOnly, trainerOnly } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Upload profile picture
router.post('/profile-picture', protect, (req, res, next) => {
  console.log('Upload request received for user:', req.user.id);
  next();
}, uploadProfilePicture, async (req, res) => {
  try {
    console.log('File received:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Update user's profile picture in database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: req.file.path },
      { new: true }
    );
    
    console.log('User updated with profile picture:', user.profilePicture);
    
    res.json({ 
      success: true, 
      message: 'Profile picture uploaded successfully',
      imageUrl: req.file.path 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload class image (Trainer/Admin only)
router.post('/class-image', protect, trainerOnly, uploadClassImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    res.json({ 
      success: true, 
      message: 'Class image uploaded successfully',
      imageUrl: req.file.path 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload multiple images
router.post('/multiple', protect, uploadMultipleImages, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    
    const imageUrls = req.files.map(file => file.path);
    res.json({ 
      success: true, 
      message: 'Images uploaded successfully',
      images: imageUrls 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;