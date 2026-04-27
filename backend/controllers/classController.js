const Class = require('../models/Class');
const Booking = require('../models/Booking');
const { isValidObjectId } = require('../utils/validateId');

// Get all classes
const getClasses = async (req, res) => {
  try {
    const classes = await Class.find({ isActive: true })
      .populate('instructorId', 'name')
      .populate('branchId', 'name');
    res.json({ success: true, classes });
  } catch (error) {
    console.error('Error getting classes:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Create class
const createClass = async (req, res) => {
  try {
    const newClass = await Class.create(req.body);
    res.status(201).json({ success: true, class: newClass });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Update class
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }
    
    const updatedClass = await Class.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!updatedClass) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }
    
    res.json({ success: true, class: updatedClass });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Delete class
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }
    
    const deletedClass = await Class.findByIdAndDelete(id);
    
    if (!deletedClass) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }
    
    res.json({ success: true, message: 'Class deleted' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Get bookings count for a class
const getClassBookingsCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }
    
    const classItem = await Class.findById(id);
    if (!classItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }
    
    const count = classItem.currentEnrollment || 0;
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error getting bookings count:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Get waitlist for a class
const getWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }
    
    const classItem = await Class.findById(id).populate('waitingList', 'name email');
    if (!classItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }
    
    res.json({ success: true, waitlist: classItem.waitingList || [] });
  } catch (error) {
    console.error('Error getting waitlist:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Add to waitlist
const addToWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }
    
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    const classItem = await Class.findById(id);
    if (!classItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }
    
    if (!classItem.waitingList) {
      classItem.waitingList = [];
    }
    
    if (classItem.waitingList.includes(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already on waitlist' 
      });
    }
    
    classItem.waitingList.push(userId);
    await classItem.save();
    
    res.json({ success: true, message: 'Added to waitlist' });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Auto-book from waitlist
const autoBookFromWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }
    
    const classItem = await Class.findById(id);
    if (!classItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }
    
    const currentBookings = await Booking.countDocuments({ 
      classId: id,
      status: { $ne: 'cancelled' }
    });
    
    if (currentBookings < classItem.capacity && classItem.waitingList && classItem.waitingList.length > 0) {
      const nextUserId = classItem.waitingList.shift();
      await classItem.save();
      
      const booking = await Booking.create({
        userId: nextUserId,
        classId: id,
        status: 'Confirmed',
        bookingDate: new Date()
      });
      
      return res.json({ 
        success: true, 
        message: 'Spot assigned to next person on waitlist',
        booking 
      });
    }
    
    res.json({ success: false, message: 'No spots available or waitlist empty' });
  } catch (error) {
    console.error('Error auto-booking from waitlist:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Check if user is enrolled
const checkUserEnrolled = async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }
    
    const booking = await Booking.findOne({ 
      classId: id, 
      userId: userId,
      status: { $ne: 'cancelled' }
    });
    
    res.json({ success: true, enrolled: !!booking });
  } catch (error) {
    console.error('Error checking enrollment:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

module.exports = { 
  getClasses, 
  createClass, 
  updateClass, 
  deleteClass,
  getClassBookingsCount,
  getWaitlist,
  addToWaitlist,
  autoBookFromWaitlist,
  checkUserEnrolled
};