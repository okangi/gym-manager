const express = require('express');
const router = express.Router();
const { 
  getPrivateSessions, 
  getTrainerAvailability, 
  bookPrivateSession, 
  cancelPrivateSession,
  saveAvailability,
  deleteAvailability,
  getBookingByAvailabilityId
} = require('../controllers/privateSessionController');
const { protect, trainerOnly } = require('../middleware/authMiddleware');

// Existing routes
router.get('/user/:userId', protect, getPrivateSessions);
router.get('/availability/:trainerId', protect, getTrainerAvailability);
router.post('/', protect, bookPrivateSession);
router.put('/:id/cancel', protect, cancelPrivateSession);

// NEW ROUTES for trainer availability management
router.post('/availability', protect, trainerOnly, saveAvailability);
router.delete('/availability/:id', protect, trainerOnly, deleteAvailability);
router.get('/booking/:availabilityId', protect, getBookingByAvailabilityId);

module.exports = router;