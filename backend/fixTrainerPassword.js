const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Load User model
const User = require('./models/User');

const fixTrainerPassword = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const email = 'makoricyprian@gmail.com';
    const newPassword = 'trainer123';
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log(`Generated hash for password: ${newPassword}`);
    console.log(`Hash: ${hashedPassword.substring(0, 30)}...`);
    
    // Find the user
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`Current password field exists: ${!!user.password}`);
    
    // Update the password
    user.password = hashedPassword;
    await user.save();
    
    console.log(`✅ Password updated successfully for ${email}`);
    console.log(`New password: ${newPassword}`);
    
    // Verify the update
    const updatedUser = await User.findOne({ email: email });
    console.log(`✅ Password hash now exists: ${!!updatedUser.password}`);
    console.log(`Password hash length: ${updatedUser.password?.length}`);
    
    console.log('\n🎉 Trainer password fixed! Try logging in now.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixTrainerPassword();