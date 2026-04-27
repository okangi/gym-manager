const mongoose = require('mongoose');

const privateSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, default: 60 },
  type: { type: String, enum: ['personal', 'group', 'consultation'], default: 'personal' },
  status: { type: String, enum: ['available', 'booked', 'cancelled', 'completed'], default: 'available' },
  price: { type: Number },
  notes: { type: String },
  bookedAt: { type: Date },
  cancelledAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PrivateSession', privateSessionSchema);