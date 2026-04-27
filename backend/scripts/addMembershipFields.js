const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const addMembershipFields = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Add membership fields to all users who have active memberships
    const result = await User.updateMany(
      {}, // All users
      {
        $set: {
          currentPlanName: null,
          membershipStartDate: null,
          membershipEndDate: null,
          isMember: false,
          currentPlanId: null
        }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} users with membership fields`);
    
    // Now sync active memberships from membership collection
    const Membership = require('../models/Membership');
    const activeMemberships = await Membership.find({ 
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    console.log(`Found ${activeMemberships.length} active memberships to sync`);
    
    for (const membership of activeMemberships) {
      const user = await User.findById(membership.userId);
      if (user) {
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
    
    console.log('Migration completed!');
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addMembershipFields();