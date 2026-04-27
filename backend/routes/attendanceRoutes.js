const express = require('express');
const router = express.Router();
const { 
  checkIn, 
  checkOut, 
  getAttendanceHistory, 
  getAttendanceStats 
} = require('../controllers/attendanceController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/checkin', protect, checkIn);
router.put('/checkout', protect, checkOut);
router.get('/', protect, getAttendanceHistory);
router.get('/stats', protect, adminOnly, getAttendanceStats);

module.exports = router;