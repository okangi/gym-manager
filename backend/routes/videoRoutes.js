const express = require('express');
const router = express.Router();
const { getVideos, getVideoById, createVideo, updateVideo, deleteVideo } = require('../controllers/videoController');
const { protect, trainerOnly, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getVideos);
router.get('/:id', getVideoById);
router.post('/', protect, trainerOnly, createVideo);
router.put('/:id', protect, trainerOnly, updateVideo);
router.delete('/:id', protect, adminOnly, deleteVideo);

module.exports = router;