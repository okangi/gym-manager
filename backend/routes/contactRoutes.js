const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, getMessageById, updateMessageStatus, deleteMessage } = require('../controllers/contactController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', sendMessage);
router.get('/', protect, adminOnly, getMessages);
router.get('/:id', protect, adminOnly, getMessageById);
router.put('/:id', protect, adminOnly, updateMessageStatus);
router.delete('/:id', protect, adminOnly, deleteMessage);

module.exports = router;