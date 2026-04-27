const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { isValidObjectId } = require('../utils/validateId');

// @desc    Check-in user
// @route   POST /api/attendance/checkin
// @access  Private
const checkIn = async (req, res) => {
  try {
    const { className, branchId } = req.body;
    
    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingCheckin = await Attendance.findOne({
      userId: req.user._id,
      checkInTime: { $gte: today }
    });
    
    if (existingCheckin && !existingCheckin.checkOutTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already checked in today and haven\'t checked out' 
      });
    }
    
    const attendance = await Attendance.create({
      userId: req.user._id,
      checkInTime: new Date(),
      className: className || 'General Entry',
      branchId: branchId || req.user.branchId,
      status: 'checked-in'
    });
    
    res.status(201).json({ 
      success: true, 
      attendance,
      message: 'Check-in successful'
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// @desc    Check-out user
// @route   PUT /api/attendance/checkout
// @access  Private
const checkOut = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      userId: req.user._id,
      checkInTime: { $gte: today },
      checkOutTime: null
    });
    
    if (!attendance) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active check-in found for today' 
      });
    }
    
    attendance.checkOutTime = new Date();
    attendance.status = 'completed';
    await attendance.save();
    
    res.json({ 
      success: true, 
      attendance,
      message: 'Check-out successful'
    });
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// @desc    Get user's attendance history
// @route   GET /api/attendance
// @access  Private
const getAttendanceHistory = async (req, res) => {
  try {
    let query = { userId: req.user._id };
    
    // Filter by date range if provided
    if (req.query.startDate) {
      query.checkInTime = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      query.checkInTime = { ...query.checkInTime, $lte: new Date(req.query.endDate) };
    }
    
    const history = await Attendance.find(query)
      .sort({ checkInTime: -1 })
      .limit(parseInt(req.query.limit) || 100);
    
    res.json({ success: true, history });
  } catch (error) {
    console.error('Error getting attendance history:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

// @desc    Get attendance stats (Admin only)
// @route   GET /api/attendance/stats
// @access  Private/Admin
const getAttendanceStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayCheckins = await Attendance.countDocuments({
      checkInTime: { $gte: today, $lt: tomorrow }
    });
    
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
    thisWeek.setHours(0, 0, 0, 0);
    
    const weekCheckins = await Attendance.countDocuments({
      checkInTime: { $gte: thisWeek }
    });
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const monthCheckins = await Attendance.countDocuments({
      checkInTime: { $gte: thisMonth }
    });
    
    res.json({ 
      success: true, 
      stats: {
        today: todayCheckins,
        thisWeek: weekCheckins,
        thisMonth: monthCheckins
      }
    });
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message 
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendanceHistory,
  getAttendanceStats
};