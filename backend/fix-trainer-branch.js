// fix-trainer-branch.js - Run with: node fix-trainer-branch.js
const mongoose = require('mongoose');
require('dotenv').config();

async function fixTrainerBranch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get first branch
    const branch = await mongoose.connection.db.collection('branches').findOne({});
    if (!branch) {
      console.log('❌ No branch found. Please create a branch first.');
      process.exit(1);
    }
    
    console.log(`Found branch: ${branch.name} (ID: ${branch._id})`);
    
    // Update trainer
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'trainer@gym.com' },
      { $set: { branchId: branch._id.toString() } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Trainer branch updated successfully!');
    } else {
      console.log('⚠️ Trainer not found or already has branch');
    }
    
    // Verify update
    const trainer = await mongoose.connection.db.collection('users').findOne({ email: 'trainer@gym.com' });
    console.log(`Trainer now has branchId: ${trainer?.branchId}`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixTrainerBranch();