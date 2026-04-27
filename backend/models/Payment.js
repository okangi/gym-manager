const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
  planName: { type: String },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'Mpesa', 'Bank Transfer', 'PayPal'], required: true },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Completed' },
  transactionId: { type: String },
  paymentDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  receiptUrl: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);