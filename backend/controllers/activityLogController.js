const ActivityLog = require('../models/ActivityLog');

// @desc    Add activity log
// @route   POST /api/activity-logs
// @access  Private
const addActivityLog = async (req, res) => {
  try {
    const { userEmail, action, details } = req.body;
    
    const log = await ActivityLog.create({
      userEmail,
      userName: req.user?.name,
      userId: req.user?.id,
      action,
      details,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({ success: true, log });
  } catch (error) {
    console.error('Error adding activity log:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's activity logs
// @route   GET /api/activity-logs/user/:email
// @access  Private
const getUserLogs = async (req, res) => {
  try {
    const { email } = req.params;
    const decodedEmail = decodeURIComponent(email);
    
    // Users can only see their own logs, admins can see any
    if (req.user.role !== 'admin' && req.user.email !== decodedEmail) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const logs = await ActivityLog.find({ userEmail: decodedEmail })
      .sort({ timestamp: -1 })
      .limit(100);
    
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching user logs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all activity logs (Admin only)
// @route   GET /api/activity-logs
// @access  Private/Admin
const getAllLogs = async (req, res) => {
  try {
    const { limit = 100, skip = 0, action, userEmail } = req.query;
    
    let query = {};
    if (action) query.action = action;
    if (userEmail) query.userEmail = userEmail;
    
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await ActivityLog.countDocuments(query);
    
    res.json({ 
      success: true, 
      logs,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Error fetching all logs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get activity stats (Admin only)
// @route   GET /api/activity-logs/stats
// @access  Private/Admin
const getActivityStats = async (req, res) => {
  try {
    const dailyStats = await ActivityLog.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);
    
    const actionStats = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const userStats = await ActivityLog.aggregate([
      {
        $group: {
          _id: '$userEmail',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({ 
      success: true, 
      dailyStats,
      actionStats,
      userStats
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete old logs (Admin only)
// @route   DELETE /api/activity-logs/cleanup
// @access  Private/Admin
const cleanupOldLogs = async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const result = await ActivityLog.deleteMany({ timestamp: { $lt: cutoffDate } });
    
    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} old logs`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  addActivityLog, 
  getUserLogs, 
  getAllLogs, 
  getActivityStats,
  cleanupOldLogs
};