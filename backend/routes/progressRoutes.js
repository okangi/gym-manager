const express = require('express');
const router = express.Router();
const { 
  getProgress,
  addProgress,
  deleteProgress,
  updateProgress
} = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

// Get user's progress entries
router.get('/:userId', protect, getProgress);

// Add progress entry
router.post('/', protect, addProgress);

// Delete progress entry
router.delete('/:id', protect, deleteProgress);

// Update progress entry
router.put('/:id', protect, updateProgress);

module.exports = router;