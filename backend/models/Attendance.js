const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  checkInTime: { type: Date, default: Date.now },
  checkOutTime: { type: Date },
  date: { type: Date, default: Date.now },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  branchName: { type: String },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  className: { type: String },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'Checked Out'], default: 'Present' },
  checkInMethod: { type: String, enum: ['QR Code', 'Manual', 'Card'], default: 'Manual' }
});

// Index for efficient queries
attendanceSchema.index({ userId: 1, date: 1 });
attendanceSchema.index({ date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);