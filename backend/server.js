const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://*.onrender.com'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Import routes using absolute paths
const authRoutes = require(path.join(__dirname, 'routes', 'authRoutes'));
const branchRoutes = require(path.join(__dirname, 'routes', 'branchRoutes'));
const classRoutes = require(path.join(__dirname, 'routes', 'classRoutes'));
const planRoutes = require(path.join(__dirname, 'routes', 'planRoutes'));
const paymentRoutes = require(path.join(__dirname, 'routes', 'paymentRoutes'));
const attendanceRoutes = require(path.join(__dirname, 'routes', 'attendanceRoutes'));
const contactRoutes = require(path.join(__dirname, 'routes', 'contactRoutes'));
const bookingRoutes = require(path.join(__dirname, 'routes', 'bookingRoutes'));
const uploadRoutes = require(path.join(__dirname, 'routes', 'uploadRoutes'));
const reportRoutes = require(path.join(__dirname, 'routes', 'reportRoutes'));
const landingRoutes = require(path.join(__dirname, 'routes', 'landingRoutes'));
const gymSettingRoutes = require(path.join(__dirname, 'routes', 'gymSettingRoutes'));
const userRoutes = require(path.join(__dirname, 'routes', 'userRoutes'));
const videoRoutes = require(path.join(__dirname, 'routes', 'videoRoutes'));
const notificationRoutes = require(path.join(__dirname, 'routes', 'notificationRoutes'));
const activityLogRoutes = require(path.join(__dirname, 'routes', 'activityLogRoutes'));
const planAssignmentRoutes = require(path.join(__dirname, 'routes', 'planAssignmentRoutes'));
const privateSessionRoutes = require(path.join(__dirname, 'routes', 'privateSessionRoutes'));
const chatRoutes = require(path.join(__dirname, 'routes', 'chatRoutes'));
const trainerRoutes = require(path.join(__dirname, 'routes', 'trainerRoutes'));
const membershipRoutes = require(path.join(__dirname, 'routes', 'membershipRoutes'));
const progressRoutes = require(path.join(__dirname, 'routes', 'progressRoutes'));
const { protect } = require(path.join(__dirname, 'middleware', 'authMiddleware'));
const { errorHandler, notFound } = require(path.join(__dirname, 'middleware', 'errorHandler'));

// Use routes
app.post('/api/auth/register', authRoutes.post('register'));
app.post('/api/auth/login', authRoutes.post('login'));
app.get('/api/auth/profile', authRoutes.get('profile'));
app.put('/api/auth/profile', authRoutes.put('profile'));
app.post('/api/auth/change-password', authRoutes.post('change-password'));
// All other routes
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
  res.json({ success: true, message: 'Gym Manager Backend is running!' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' });
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const User = require(path.join(__dirname, 'models', 'User'));
    const users = await User.find({}).select('-password');
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Change password
app.post('/api/auth/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const User = require(path.join(__dirname, 'models', 'User'));
    const bcrypt = require('bcryptjs');
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug: Check what's in authRoutes
app.get('/api/debug/auth-routes', (req, res) => {
  try {
    const authRoutesModule = require('./routes/authRoutes');
    const routes = [];
    
    // Check if authRoutes has a stack property (express router)
    if (authRoutesModule && authRoutesModule.stack) {
      authRoutesModule.stack.forEach((layer) => {
        if (layer.route) {
          routes.push({
            path: layer.route.path,
            methods: Object.keys(layer.route.methods)
          });
        }
      });
    }
    
    res.json({
      authRoutesType: typeof authRoutesModule,
      isExpressRouter: typeof authRoutesModule === 'function',
      routes: routes,
      hasStack: !!authRoutesModule?.stack
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug/controller', (req, res) => {
  try {
    const { register, login } = require('./controllers/authController');
    res.json({
      hasRegister: typeof register === 'function',
      hasLogin: typeof login === 'function',
      registerType: typeof register,
      loginType: typeof login
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// 404 handler
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});