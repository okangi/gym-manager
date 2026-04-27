const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  userName: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String }
});

// Index for efficient queries
activityLogSchema.index({ userEmail: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ action: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);