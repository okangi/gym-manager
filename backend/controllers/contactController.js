const ContactMessage = require('../models/ContactMessage');
const { isValidObjectId } = require('../utils/validateId');

// @desc    Send contact message (public)
// @route   POST /api/contact
// @access  Public
const sendMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, email, subject and message' 
      });
    }
    
    const contactMessage = await ContactMessage.create({
      name,
      email,
      phone: phone || '',
      subject,
      message,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.status(201).json({ 
      success: true, 
      contactMessage,
      message: 'Your message has been sent. We will get back to you soon.'
    });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again.' 
    });
  }
};

// @desc    Get all contact messages (Admin only)
// @route   GET /api/contact
// @access  Private/Admin
const getMessages = async (req, res) => {
  try {
    const { limit = 100, status, startDate, endDate } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const stats = {
      total: await ContactMessage.countDocuments(),
      new: await ContactMessage.countDocuments({ status: 'new' }),
      read: await ContactMessage.countDocuments({ status: 'read' }),
      replied: await ContactMessage.countDocuments({ status: 'replied' }),
      archived: await ContactMessage.countDocuments({ status: 'archived' })
    };
    
    res.json({ 
      success: true, 
      messages,
      stats,
      count: messages.length
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single contact message (Admin only)
// @route   GET /api/contact/:id
// @access  Private/Admin
const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid message ID format' 
      });
    }
    
    const message = await ContactMessage.findById(id);
    
    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: 'Message not found' 
      });
    }
    
    // Auto-mark as read when viewed
    if (message.status === 'new') {
      message.status = 'read';
      message.updatedAt = new Date();
      await message.save();
    }
    
    res.json({ success: true, message });
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update message status (Admin only)
// @route   PUT /api/contact/:id
// @access  Private/Admin
const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, replyMessage } = req.body;
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid message ID format' 
      });
    }
    
    const updateData = {
      status: status || 'read',
      updatedAt: new Date()
    };
    
    if (replyMessage) {
      updateData.replyMessage = replyMessage;
      updateData.repliedBy = req.user.email;
      updateData.repliedAt = new Date();
      updateData.status = 'replied';
    }
    
    const message = await ContactMessage.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: 'Message not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message,
      message: 'Message updated successfully'
    });
  } catch (error) {
    console.error('Error updating contact message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete contact message (Admin only)
// @route   DELETE /api/contact/:id
// @access  Private/Admin
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid message ID format' 
      });
    }
    
    const message = await ContactMessage.findByIdAndDelete(id);
    
    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: 'Message not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Message deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getMessageById,
  updateMessageStatus,
  deleteMessage
};