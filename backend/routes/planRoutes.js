const express = require('express');
const router = express.Router();
const { getPlans, getPlanById, createPlan, updatePlan, deletePlan } = require('../controllers/planController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getPlans);
router.get('/:id', getPlanById);
router.post('/', protect, adminOnly, createPlan);
router.put('/:id', protect, adminOnly, updatePlan);
router.delete('/:id', protect, adminOnly, deletePlan);

module.exports = router;