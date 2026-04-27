const express = require('express');
const router = express.Router();
const {
  getConversation,
  sendMessage,
  markAsRead,
  getUnreadCount,
  getConversations
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Get all conversations for the logged-in user
router.get('/conversations', protect, getConversations);

// Mark messages as read (SPECIFIC route - MUST come before generic)
router.put('/read/:otherUserId', protect, markAsRead);

// Get unread count for a conversation (SPECIFIC route - MUST come before generic)
router.get('/unread/:otherUserId', protect, getUnreadCount);

// Get conversation between two users (GENERIC route - MUST come LAST)
router.get('/:userId1/:userId2', protect, getConversation);

// Send a message
router.post('/', protect, sendMessage);

module.exports = router;