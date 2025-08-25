const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// @route   GET api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    
    if (role && (role === 'admin' || role === 'user')) {
      query.role = role;
    }
    
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE api/users/:id
// @desc    Delete a user
// @access  Private (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deletion of admin users if there's only one admin left
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }
    
    await user.deleteOne(); // Use deleteOne instead of remove for newer Mongoose versions
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
