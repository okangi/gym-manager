const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  description: { type: String },
  thumbnail: { type: String },
  category: { type: String, enum: ['Workout', 'Nutrition', 'Yoga', 'Cardio', 'Strength'], default: 'Workout' },
  duration: { type: String },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  trainerName: { type: String },
  isActive: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', videoSchema);