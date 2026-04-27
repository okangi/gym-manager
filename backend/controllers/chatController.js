const Chat = require('../models/Chat');
const User = require('../models/User');
const { isValidObjectId } = require('../utils/validateId');

// Get conversation between two users
const getConversation = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    
    // Validate IDs
    if (!userId1 || !isValidObjectId(userId1)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid first user ID format' 
      });
    }
    
    if (!userId2 || !isValidObjectId(userId2)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid second user ID format' 
      });
    }
    
    const messages = await Chat.find({
      $or: [
        { fromUserId: userId1, toUserId: userId2 },
        { fromUserId: userId2, toUserId: userId1 }
      ]
    }).sort({ createdAt: 1 });
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { toUserId, message } = req.body;
    
    // Validate required fields
    if (!toUserId || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: toUserId, message' 
      });
    }
    
    // Validate toUserId format
    if (!isValidObjectId(toUserId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid recipient user ID format' 
      });
    }
    
    const newMessage = await Chat.create({
      fromUserId: req.user._id,
      toUserId: toUserId,
      message: message,
      read: false,
      createdAt: new Date()
    });
    
    // Populate user info
    const populatedMessage = await Chat.findById(newMessage._id)
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email');
    
    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    
    // Validate otherUserId format
    if (!otherUserId || !isValidObjectId(otherUserId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    await Chat.updateMany(
      {
        fromUserId: otherUserId,
        toUserId: req.user._id,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );
    
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Get unread count for a conversation
const getUnreadCount = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    
    // Validate otherUserId format
    if (!otherUserId || !isValidObjectId(otherUserId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    const count = await Chat.countDocuments({
      fromUserId: otherUserId,
      toUserId: req.user._id,
      read: false
    });
    
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Get all conversations for a user
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all messages where user is either sender or receiver
    const messages = await Chat.find({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    }).sort({ createdAt: -1 });
    
    // Group by the other participant
    const conversationMap = new Map();
    
    for (const msg of messages) {
      const otherUserId = msg.fromUserId.toString() === userId.toString() 
        ? msg.toUserId 
        : msg.fromUserId;
      
      const otherUserIdStr = otherUserId.toString();
      
      if (!conversationMap.has(otherUserIdStr)) {
        // Get the other user's details
        const otherUser = await User.findById(otherUserId).select('name email role');
        
        if (otherUser) {
          conversationMap.set(otherUserIdStr, {
            user: {
              id: otherUser._id,
              name: otherUser.name,
              email: otherUser.email,
              role: otherUser.role
            },
            lastMessage: msg.message,
            lastMessageTime: msg.createdAt,
            unread: !msg.read && msg.toUserId.toString() === userId.toString()
          });
        }
      }
    }
    
    const conversations = Array.from(conversationMap.values());
    
    res.json({ 
      success: true, 
      conversations 
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

module.exports = {
  getConversation,
  sendMessage,
  markAsRead,
  getUnreadCount,
  getConversations
};