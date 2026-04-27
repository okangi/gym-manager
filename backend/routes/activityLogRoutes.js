const express = require('express');
const router = express.Router();
const { 
  addActivityLog, 
  getUserLogs, 
  getAllLogs, 
  getActivityStats,
  cleanupOldLogs 
} = require('../controllers/activityLogController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Protected routes
router.post('/', protect, addActivityLog);
router.get('/user/:email', protect, getUserLogs);
router.get('/stats', protect, adminOnly, getActivityStats);
router.get('/', protect, adminOnly, getAllLogs);
router.delete('/cleanup', protect, adminOnly, cleanupOldLogs);

module.exports = router;