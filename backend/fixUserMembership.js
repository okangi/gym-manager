const mongoose = require('mongoose');
const User = require('./models/User');
const Membership = require('./models/Membership');
require('dotenv').config();

const fixUserMembership = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const userId = '69eb767044b757892cd1c958';
    
    // Get active membership
    const membership = await Membership.findOne({
      userId: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    
    if (membership) {
      console.log('Found active membership:', membership.planName);
      console.log('End date:', membership.endDate);
      
      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        {
          currentPlanName: membership.planName,
          membershipEndDate: membership.endDate,
          membershipStartDate: membership.startDate,
          currentPlanId: membership.planId,
          isMember: true
        },
        { new: true }
      );
      
      console.log('✅ User updated successfully!');
      console.log('User:', user.email);
      console.log('Plan:', user.currentPlanName);
      console.log('End Date:', user.membershipEndDate);
    } else {
      console.log('No active membership found');
      
      // Get the most recent membership (even if expired)
      const latestMembership = await Membership.findOne({ userId: userId })
        .sort({ createdAt: -1 });
      
      if (latestMembership) {
        console.log('Latest membership (may be expired):', latestMembership.planName);
        
        // Still update user with latest info
        const user = await User.findByIdAndUpdate(
          userId,
          {
            currentPlanName: latestMembership.planName,
            membershipEndDate: latestMembership.endDate,
            membershipStartDate: latestMembership.startDate,
            currentPlanId: latestMembership.planId,
            isMember: latestMembership.status === 'active'
          },
          { new: true }
        );
        
        console.log('✅ User updated with latest membership info');
        console.log('Plan:', user.currentPlanName);
      }
    }
    
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixUserMembership();