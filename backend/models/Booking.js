const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true 
  },
  classDate: { 
    type: Date, 
    default: Date.now 
  },
  bookingDate: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['Confirmed', 'Cancelled', 'Completed'], 
    default: 'Confirmed' 
  }
}, {
  timestamps: true
});

// Ensure a user can't book the same class twice
bookingSchema.index({ userId: 1, classId: 1, status: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);