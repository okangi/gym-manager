const Booking = require('../models/Booking');
const Class = require('../models/Class');
const { isValidObjectId } = require('../utils/validateId');

// Create a new booking
const createBooking = async (req, res) => {
  try {
    const { classId, classDate } = req.body;
    const userId = req.user._id;
    
    // Validate classId
    if (!classId || !isValidObjectId(classId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid class ID format' 
      });
    }
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }
    
    // Check if user already has an active booking for this class
    const existingBooking = await Booking.findOne({
      userId,
      classId,
      status: 'Confirmed'
    });
    
    if (existingBooking) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an active booking for this class' 
      });
    }
    
    // Check if class has available spots
    const currentBookings = await Booking.countDocuments({
      classId,
      status: 'Confirmed'
    });
    
    if (currentBookings >= classItem.maxCapacity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Class is full. Please join the waitlist.' 
      });
    }
    
    // Create the booking
    const booking = await Booking.create({
      userId,
      classId,
      classDate: classDate || new Date(),
      bookingDate: new Date(),
      status: 'Confirmed'
    });
    
    const populatedBooking = await Booking.findById(booking._id)
      .populate('classId', 'name startTime dayOfWeek');
    
    res.status(201).json({ 
      success: true, 
      booking: populatedBooking,
      message: 'Booking confirmed successfully'
    });
    
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Get all bookings for the logged-in user
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      userId: req.user._id,
      status: 'Confirmed'
    })
    .sort({ bookingDate: -1 })
    .populate('classId', 'name startTime dayOfWeek duration maxCapacity');
    
    res.json({ 
      success: true, 
      bookings,
      count: bookings.length
    });
    
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate id
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid booking ID format' 
      });
    }
    
    const booking = await Booking.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    // Delete the booking
    await Booking.findByIdAndDelete(id);
    
    res.json({ 
      success: true, 
      message: 'Booking cancelled successfully' 
    });
    
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

module.exports = { createBooking, getUserBookings, cancelBooking };