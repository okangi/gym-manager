const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date: {
    type: Date,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  bodyFat: {
    type: Number
  },
  muscleMass: {
    type: Number
  },
  bmi: {
    type: Number
  },
  notes: {
    type: String
  },
  photos: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
progressSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Progress', progressSchema);