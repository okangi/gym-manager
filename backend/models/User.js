const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['admin', 'trainer', 'member'], default: 'member' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  profilePicture: String,
  branchId: { type: String },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: String },
  referralCredits: { type: Number, default: 0 },
  loginCount: { type: Number, default: 0 },
  // NEW MEMBERSHIP FIELDS - ADD THESE
  currentPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
  currentPlanName: { type: String },
  membershipStartDate: { type: Date },
  membershipEndDate: { type: Date },
  isMember: { type: Boolean, default: false }
});

// Simple compare password method
userSchema.methods.comparePassword = function(enteredPassword) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compareSync(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);