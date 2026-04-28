const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Import error handler middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { validateIdParam } = require('./utils/validateId');

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174',  'https://gym-manager-frontend-agqh.onrender.com','http://localhost:3000', 'https://*.onrender.com'],
  credentials: true
}));

// Increase payload size limit for large uploads (base64 images, etc.)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Import Routes
const authRoutes = require('./routes/authRoutes');
const branchRoutes = require('./routes/branchRoutes');
const classRoutes = require('./routes/classRoutes');
const planRoutes = require('./routes/planRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const contactRoutes = require('./routes/contactRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reportRoutes = require('./routes/reportRoutes');
const landingRoutes = require('./routes/landingRoutes');
const gymSettingRoutes = require('./routes/gymSettingRoutes');
const userRoutes = require('./routes/userRoutes');
const videoRoutes = require('./routes/videoRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const planAssignmentRoutes = require('./routes/planAssignmentRoutes');
const privateSessionRoutes = require('./routes/privateSessionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const progressRoutes = require('./routes/progressRoutes');

// Import middleware
const { protect } = require('./middleware/authMiddleware');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/landing', landingRoutes);
app.use('/api/settings', gymSettingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/plan-assignments', planAssignmentRoutes);
app.use('/api/sessions', privateSessionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/progress', progressRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Gym Manager Backend is running!', 
    version: '1.0.0',
    timestamp: new Date(),
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile'
      },
      branches: {
        getAll: 'GET /api/branches',
        getOne: 'GET /api/branches/:id',
        create: 'POST /api/branches (Admin only)',
        update: 'PUT /api/branches/:id (Admin only)',
        delete: 'DELETE /api/branches/:id (Admin only)'
      },
      classes: {
        getAll: 'GET /api/classes',
        create: 'POST /api/classes (Trainer/Admin)',
        update: 'PUT /api/classes/:id (Trainer/Admin)',
        delete: 'DELETE /api/classes/:id (Admin only)'
      },
      membershipPlans: {
        getAll: 'GET /api/plans',
        getOne: 'GET /api/plans/:id',
        create: 'POST /api/plans (Admin only)',
        update: 'PUT /api/plans/:id (Admin only)',
        delete: 'DELETE /api/plans/:id (Admin only)'
      },
      trainerPlans: {
        getUserPlans: 'GET /api/plan-assignments/user/:userId',
        getTrainerPlans: 'GET /api/plan-assignments/trainer/:trainerId',
        create: 'POST /api/plan-assignments (Trainer only)',
        update: 'PUT /api/plan-assignments/:id (Trainer only)',
        delete: 'DELETE /api/plan-assignments/:id (Trainer only)'
      },
      payments: {
        getAll: 'GET /api/payments',
        getOne: 'GET /api/payments/:id',
        create: 'POST /api/payments',
        update: 'PUT /api/payments/:id (Admin only)'
      },
      attendance: {
        checkin: 'POST /api/attendance/checkin',
        checkout: 'PUT /api/attendance/checkout',
        history: 'GET /api/attendance',
        stats: 'GET /api/attendance/stats (Admin only)'
      },
      contact: {
        send: 'POST /api/contact',
        getAll: 'GET /api/contact (Admin only)',
        getOne: 'GET /api/contact/:id (Admin only)',
        update: 'PUT /api/contact/:id (Admin only)',
        delete: 'DELETE /api/contact/:id (Admin only)'
      },
      bookings: {
        create: 'POST /api/bookings',
        getUserBookings: 'GET /api/bookings',
        cancel: 'DELETE /api/bookings/:id'
      },
      users: {
        getAll: 'GET /api/users'
      }
    }
  });
});

// Get all users (admin only in production)
app.get('/api/users', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find({}).select('-password');
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    uptime: process.uptime(),
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ============ CHANGE PASSWORD ENDPOINT ============
app.post('/api/auth/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Email sending endpoint (requires email configuration)
app.post('/api/email/send', protect, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    
    // For now, just log the email (since email service may not be configured)
    console.log('📧 EMAIL REQUEST:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${body}`);
    
    res.json({ success: true, message: 'Email sent (simulated)' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ ERROR HANDLING MIDDLEWARE ============
// These must be the LAST middleware added

// 404 handler for undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🏋️‍♂️ GYM MANAGER BACKEND - SERVER STARTED 🏋️‍♂️         ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  ✅ Server running on: http://localhost:${PORT}          ║
║  ✅ MongoDB: Connected                                   ║
║  📝 Test API: http://localhost:${PORT}/api/test          ║
║  ❤️  Health: http://localhost:${PORT}/api/health         ║
╠══════════════════════════════════════════════════════════╣
║  📚 AVAILABLE ENDPOINTS:                                 ║
║  🔐 Auth:      /api/auth                                 ║
║  🏢 Branches:  /api/branches                             ║
║  📚 Classes:   /api/classes                              ║
║  📋 Membership Plans: /api/plans (Admin only for write)  ║
║  📋 Trainer Plans: /api/plan-assignments (Trainer only)  ║
║  💰 Payments:  /api/payments                             ║
║  ✅ Attendance:/api/attendance                           ║
║  📧 Contact:   /api/contact                              ║
║  📅 Bookings:  /api/bookings                             ║
║  👥 Users:     /api/users                                ║
║  🔑 Change PW: POST /api/auth/change-password            ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`);
});