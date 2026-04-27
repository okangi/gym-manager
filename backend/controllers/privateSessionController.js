const PrivateSession = require('../models/PrivateSession');
const User = require('../models/User');
const { isValidObjectId } = require('../utils/validateId');

// Get private sessions for a user
const getPrivateSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }
    
    const sessions = await PrivateSession.find({ 
      $or: [
        { userId: userId },
        { trainerId: userId }
      ]
    })
    .populate('trainerId', 'name email')
    .populate('userId', 'name email')
    .sort({ sessionDate: 1 });
    
    const formattedSessions = sessions.map(session => ({
      id: session._id,
      trainerId: session.trainerId?._id,
      trainerName: session.trainerId?.name,
      memberId: session.userId?._id,
      memberName: session.userId?.name,
      sessionDate: session.sessionDate,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      status: session.status,
      notes: session.notes,
      price: session.price
    }));
    
    res.json({ success: true, sessions: formattedSessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Get trainer availability
const getTrainerAvailability = async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    // Validate trainerId
    if (!trainerId || !isValidObjectId(trainerId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid trainer ID format' 
      });
    }
    
    const availability = await PrivateSession.find({ 
      trainerId: trainerId,
      status: 'available',
      sessionDate: { $gte: new Date() }
    })
    .populate('trainerId', 'name')
    .sort({ sessionDate: 1, startTime: 1 });
    
    const formattedAvailability = availability.map(slot => ({
      id: slot._id,
      trainerId: slot.trainerId._id,
      trainerName: slot.trainerId.name,
      date: slot.sessionDate,
      sessionDate: slot.sessionDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
      price: slot.price
    }));
    
    res.json({ success: true, availability: formattedAvailability });
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Book private session
const bookPrivateSession = async (req, res) => {
  try {
    const { trainerId, sessionDate, startTime, endTime, duration, notes, price } = req.body;
    
    // Validate required fields
    if (!trainerId || !isValidObjectId(trainerId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid trainer ID format' 
      });
    }
    
    if (!sessionDate || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: sessionDate, startTime, endTime' 
      });
    }
    
    // Check if slot is still available
    const existingSlot = await PrivateSession.findOne({
      trainerId,
      sessionDate: new Date(sessionDate),
      startTime,
      status: 'available'
    });
    
    if (existingSlot) {
      existingSlot.userId = req.user.id;
      existingSlot.status = 'booked';
      existingSlot.bookedAt = new Date();
      existingSlot.notes = notes;
      existingSlot.price = price;
      await existingSlot.save();
      
      const populatedSlot = await PrivateSession.findById(existingSlot._id)
        .populate('trainerId', 'name email')
        .populate('userId', 'name email');
      
      return res.json({ 
        success: true, 
        session: {
          id: populatedSlot._id,
          trainerId: populatedSlot.trainerId._id,
          trainerName: populatedSlot.trainerId.name,
          sessionDate: populatedSlot.sessionDate,
          startTime: populatedSlot.startTime,
          endTime: populatedSlot.endTime,
          status: populatedSlot.status
        }
      });
    }
    
    // Create new booking
    const session = await PrivateSession.create({
      userId: req.user.id,
      trainerId,
      sessionDate: new Date(sessionDate),
      startTime,
      endTime,
      duration: duration || 60,
      status: 'booked',
      bookedAt: new Date(),
      notes,
      price
    });
    
    const populatedSession = await PrivateSession.findById(session._id)
      .populate('trainerId', 'name email');
    
    res.status(201).json({ 
      success: true, 
      session: {
        id: populatedSession._id,
        trainerId: populatedSession.trainerId._id,
        trainerName: populatedSession.trainerId.name,
        sessionDate: populatedSession.sessionDate,
        startTime: populatedSession.startTime,
        endTime: populatedSession.endTime,
        status: populatedSession.status
      }
    });
  } catch (error) {
    console.error('Error booking session:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Cancel private session
const cancelPrivateSession = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate id
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid session ID format' 
      });
    }
    
    const session = await PrivateSession.findByIdAndUpdate(
      id,
      { status: 'cancelled', cancelledAt: new Date() },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }
    
    res.json({ 
      success: true, 
      session, 
      message: 'Session cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling session:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Save availability slot (trainer creates available time slots)
const saveAvailability = async (req, res) => {
  try {
    const { sessionDate, startTime, endTime, duration, price, notes } = req.body;
    
    // Validate required fields
    if (!sessionDate || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: sessionDate, startTime, endTime' 
      });
    }
    
    const availabilitySlot = await PrivateSession.create({
      trainerId: req.user.id,
      sessionDate: new Date(sessionDate),
      startTime,
      endTime,
      duration: duration || 60,
      status: 'available',
      price: price || 0,
      notes: notes || ''
    });
    
    res.status(201).json({ 
      success: true, 
      availability: availabilitySlot,
      message: 'Availability slot created successfully'
    });
  } catch (error) {
    console.error('Error saving availability:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Delete availability slot
const deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate id
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid availability slot ID format' 
      });
    }
    
    const slot = await PrivateSession.findOneAndDelete({
      _id: id,
      trainerId: req.user.id,
      status: 'available'
    });
    
    if (!slot) {
      return res.status(404).json({ 
        success: false, 
        message: 'Availability slot not found or already booked' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Availability slot deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// Get booking by availability ID
const getBookingByAvailabilityId = async (req, res) => {
  try {
    const { availabilityId } = req.params;
    
    // Validate availabilityId
    if (!availabilityId || !isValidObjectId(availabilityId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid availability ID format' 
      });
    }
    
    const booking = await PrivateSession.findOne({
      _id: availabilityId,
      status: 'booked'
    }).populate('userId', 'name email');
    
    res.json({ success: true, booking: booking || null });
  } catch (error) {
    console.error('Error getting booking:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

module.exports = { 
  getPrivateSessions, 
  getTrainerAvailability, 
  bookPrivateSession, 
  cancelPrivateSession,
  saveAvailability,
  deleteAvailability,
  getBookingByAvailabilityId
};