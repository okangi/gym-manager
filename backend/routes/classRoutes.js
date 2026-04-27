const express = require('express');
const router = express.Router();
const { 
  getClasses, 
  createClass, 
  updateClass, 
  deleteClass,
  getClassBookingsCount,
  getWaitlist,
  addToWaitlist,
  autoBookFromWaitlist,
  checkUserEnrolled
} = require('../controllers/classController');
const { protect, trainerOnly, adminOnly } = require('../middleware/authMiddleware');

// Existing routes
router.get('/', getClasses);
router.post('/', protect, trainerOnly, createClass);
router.put('/:id', protect, trainerOnly, updateClass);
router.delete('/:id', protect, adminOnly, deleteClass);

// NEW ROUTES
router.get('/:id/bookings/count', protect, getClassBookingsCount);
router.get('/:id/waitlist', protect, getWaitlist);
router.post('/:id/waitlist', protect, addToWaitlist);
router.post('/:id/waitlist/auto-book', protect, autoBookFromWaitlist);
router.get('/:id/enrolled/:userId', protect, checkUserEnrolled);

module.exports = router;