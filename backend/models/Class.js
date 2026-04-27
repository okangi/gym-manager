const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['Yoga', 'Cardio', 'Strength', 'HIIT', 'Dance', 'Boxing'] },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  instructorName: { type: String, required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  dayOfWeek: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number }, // in minutes
  maxCapacity: { type: Number, default: 20 },
  currentEnrollment: { type: Number, default: 0 },
  waitingList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  price: { type: Number },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Class', classSchema);