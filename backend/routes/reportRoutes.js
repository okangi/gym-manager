const express = require('express');
const router = express.Router();
const { 
  generatePaymentReport, 
  generateAttendanceReport, 
  getRevenueReport, 
  getDashboardStats 
} = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/payments', protect, adminOnly, generatePaymentReport);
router.get('/attendance', protect, adminOnly, generateAttendanceReport);
router.get('/revenue', protect, adminOnly, getRevenueReport);
router.get('/dashboard', protect, adminOnly, getDashboardStats);

module.exports = router;