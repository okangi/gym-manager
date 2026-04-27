const express = require('express');
const router = express.Router();
const { getGymSettings, updateGymSettings } = require('../controllers/gymSettingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public route - anyone can view gym settings
router.get('/', getGymSettings);

// Protected route - only admin can update
router.put('/', protect, adminOnly, updateGymSettings);

module.exports = router;