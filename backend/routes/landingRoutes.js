const express = require('express');
const router = express.Router();
const { getLandingContent, updateLandingContent } = require('../controllers/landingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getLandingContent);
router.put('/', protect, adminOnly, updateLandingContent);

module.exports = router;