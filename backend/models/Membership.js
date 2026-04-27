const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'active'
  },
  amount: {
    type: Number,
    required: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
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
membershipSchema.index({ userId: 1, status: 1, endDate: 1 });
membershipSchema.index({ endDate: 1 });

// Check if membership is expired
membershipSchema.methods.isExpired = function() {
  return new Date() > this.endDate;
};

// Update status based on end date
membershipSchema.statics.updateExpiredStatus = async function() {
  const now = new Date();
  await this.updateMany(
    { endDate: { $lt: now }, status: 'active' },
    { status: 'expired', updatedAt: now }
  );
};

module.exports = mongoose.model('Membership', membershipSchema);