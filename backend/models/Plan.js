const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  duration: { type: String, enum: ['Weekly', 'Monthly', 'Quarterly', 'Yearly'], required: true },
  durationDays: { type: Number }, // 7, 30, 90, 365
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  features: [{ type: String }],
  benefits: [String],
  discount: { type: Number, default: 0 },
  isPopular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Plan', planSchema);