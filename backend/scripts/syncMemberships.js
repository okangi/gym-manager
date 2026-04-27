const mongoose = require('mongoose');
const User = require('../models/User');
const Membership = require('../models/Membership');
require('dotenv').config();

const syncMemberships = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get all active memberships
    const activeMemberships = await Membership.find({ 
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    console.log(`Found ${activeMemberships.length} active memberships`);
    
    for (const membership of activeMemberships) {
      const user = await User.findById(membership.userId);
      if (user) {
        console.log(`Syncing user: ${user.email}`);
        
        await User.findByIdAndUpdate(membership.userId, {
          currentPlanId: membership.planId,
          currentPlanName: membership.planName,
          membershipStartDate: membership.startDate,
          membershipEndDate: membership.endDate,
          isMember: true
        });
        
        console.log(`✅ Synced: ${user.email} -> ${membership.planName}`);
      }
    }
    
    console.log('Sync completed!');
    process.exit();
  } catch (error) {
    console.error('Error syncing:', error);
    process.exit(1);
  }
};

syncMemberships();