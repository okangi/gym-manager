const GymSetting = require('../models/GymSetting');

// @desc    Get gym settings
// @route   GET /api/settings
// @access  Public
const getGymSettings = async (req, res) => {
  try {
    let settings = await GymSetting.findOne();
    
    if (!settings) {
      // Create default settings if none exists
      settings = await GymSetting.create({
        name: "Cyprian's Workout Wizard",
        location: '123 Fitness St, City',
        address: '123 Fitness St, City, State 12345',
        phone: '+1 234 567 8900',
        email: 'info@gymmanager.com',
        currencySymbol: '$'
      });
    }
    
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update gym settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateGymSettings = async (req, res) => {
  try {
    const settings = await GymSetting.findOneAndUpdate(
      {},
      { 
        ...req.body,
        updatedAt: new Date(),
        updatedBy: req.user.id
      },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getGymSettings, updateGymSettings };