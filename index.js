const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with Mongoose
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Routes
app.get("/", (req, res) => {
  res.send("OXFORD Coach Media is running!!");
});

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Bus routes
app.use('/api/buses', require('./routes/busRoutes'));

// Search routes
app.use('/api', require('./routes/searchRoutes'));

// Schedule routes
app.use('/api/schedules', require('./routes/scheduleRoutes'));

// User routes
app.use('/api/users', require('./routes/userRoutes'));

// Booking routes
app.use('/api/bookings', require('./routes/bookingRoutes'));

// Payment routes
app.use('/api/payments', require('./routes/paymentRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`OXFORD Coach is running now on port: ${port}`);
  });
};

startServer().catch(console.dir);
