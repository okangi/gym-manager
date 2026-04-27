const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  markAsRead, 
  getUnreadCount, 
  createNotification,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.get('/unread/count', protect, getUnreadCount);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);
router.post('/', protect, createNotification);
router.post('/send', protect, createNotification);
router.delete('/:id', protect, deleteNotification);

module.exports = router;