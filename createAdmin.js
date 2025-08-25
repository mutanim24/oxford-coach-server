const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/oxford-coach', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  
  // Create admin user
  const createAdmin = async () => {
    try {
      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: 'admin@example.com' });
      
      if (existingAdmin) {
        console.log('Admin user already exists');
        return;
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create admin user
      const admin = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await admin.save();
      console.log('Admin user created successfully');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
    } catch (error) {
      console.error('Error creating admin user:', error);
    } finally {
      // Close MongoDB connection
      mongoose.connection.close();
    }
  };
  
  createAdmin();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
