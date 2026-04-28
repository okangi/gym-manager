const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// SIMPLE TEST ROUTE
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// DIRECT REGISTER ROUTE
app.post('/api/auth/register', async (req, res) => {
  console.log('=== REGISTER ROUTE HIT ===');
  console.log('Request body:', req.body);
  
  try {
    const { name, email, password } = req.body;
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'default123', salt);
    
    const user = await User.create({
      name: name || 'Test User',
      email: email || `test${Date.now()}@test.com`,
      password: hashedPassword,
      role: 'member'
    });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    
    res.json({ success: true, token, user: { id: user._id, email: user.email } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});