const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', [
  body('name', 'Please add a name').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'Email already in use.' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    // Return user data with token
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Step 1: Find the user
    let user = await User.findOne({ email }).select('+password');
    
    // Step 2: CRITICAL - Handle "User Not Found"
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Debug: Log the retrieved user (without password for security)
    console.log('User found:', { id: user._id, email: user.email, hasPassword: !!user.password });
    
    // Step 3: Verify the Password
    const isMatch = await bcrypt.compare(password, user.password);
    
    // Step 4: Handle "Incorrect Password"
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Step 5: Generate the Success Token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    // Step 6: Send the Successful Response
    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// @route   GET api/auth/admin
// @desc    Test admin access
// @access  Private (Admin only)
router.get('/admin', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: 'Welcome, admin!', user: req.user });
});

module.exports = router;
