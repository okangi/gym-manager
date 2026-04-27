const express = require('express');
const router = express.Router();
const { 
  getUserPlans, 
  getTrainerPlans, 
  createPlanAssignment,
  updatePlanAssignment,
  deletePlanAssignment,
  addComment,
  getPlanById
} = require('../controllers/planAssignmentController');
const { protect, trainerOnly } = require('../middleware/authMiddleware');

// Public routes (with authentication)
router.get('/user/:userId', protect, getUserPlans);
router.get('/trainer/:trainerId', protect, trainerOnly, getTrainerPlans);
router.get('/:id', protect, getPlanById);

// Trainer only routes
router.post('/', protect, trainerOnly, createPlanAssignment);
router.put('/:id', protect, trainerOnly, updatePlanAssignment);
router.delete('/:id', protect, trainerOnly, deletePlanAssignment);
router.post('/:id/comment', protect, trainerOnly, addComment);

module.exports = router;