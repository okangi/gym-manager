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

// ============ DIRECT AUTH ROUTES ============
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'member'
    });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Profile
app.get('/api/auth/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});
// ============ END DIRECT AUTH ROUTES ============

// ============ OTHER ROUTES ============
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

// Use other routes
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime(), mongodb: 'Connected' });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Gym Manager Backend is running!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});