const mongoose = require('mongoose');

const gymSettingSchema = new mongoose.Schema({
  name: { type: String, default: "Cyprian's Workout Wizard" },
  logo: { type: String, default: null },
  location: { type: String, default: '123 Fitness St, City' },
  address: { type: String, default: '123 Fitness St, City, State 12345' },
  phone: { type: String, default: '+1 234 567 8900' },
  email: { type: String, default: 'info@gymmanager.com' },
  currencySymbol: { type: String, default: '$' },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('GymSetting', gymSettingSchema);