const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Index for faster queries
chatMessageSchema.index({ fromUserId: 1, toUserId: 1 });
chatMessageSchema.index({ toUserId: 1, read: 1 });

module.exports = mongoose.model('Chat', chatMessageSchema);