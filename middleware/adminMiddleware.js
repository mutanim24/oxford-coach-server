const adminMiddleware = (req, res, next) => {
  try {
    // Check if user exists and has admin role
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = adminMiddleware;
