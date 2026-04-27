const mongoose = require('mongoose');

const planAssignmentSchema = new mongoose.Schema({
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainerName: { type: String, required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  memberEmail: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['workout', 'nutrition'], default: 'workout' },
  dueDate: { type: Date },
  exercises: [{
    name: String,
    notes: String,
    completed: { type: Boolean, default: false }
  }],
  status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
  progress: { type: Number, default: 0 },
  trainerComments: [{
    trainerName: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
  attachments: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PlanAssignment', planAssignmentSchema);