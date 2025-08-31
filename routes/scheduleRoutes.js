const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Bus = require('../models/Bus');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// POST /api/schedules - Create a new schedule (Admin only)
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { busId, source, destination, departureTime, fare } = req.body;
    
    // Validate busId
    if (!busId) {
      return res.status(400).json({ error: 'Bus ID is required' });
    }
    
    // Check if bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }
    
    // Create new schedule
    const schedule = new Schedule({
      bus: busId,
      source,
      destination,
      departureTime: new Date(departureTime), // Ensure proper Date object
      fare
    });
    
    await schedule.save();
    
    // Populate bus details
    await schedule.populate('bus', 'name operator');
    
    res.status(201).json({
      message: 'Schedule created successfully',
      schedule
    });
    
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/schedules/bus/:busId - Get all schedules for a specific bus
router.get('/bus/:busId', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { busId } = req.params;
    
    // Find all schedules for the bus and populate bus details
    const schedules = await Schedule.find({ bus: busId })
      .populate('bus', 'name operator')
      .sort({ departureTime: 1 });
    
    res.json({
      message: 'Schedules fetched successfully',
      schedules
    });
    
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/schedules/:scheduleId - Update a schedule (Admin only)
router.put('/:scheduleId', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { source, destination, departureTime, fare } = req.body;
    
    // Find the schedule
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Update fields
    if (source) schedule.source = source;
    if (destination) schedule.destination = destination;
    if (departureTime) schedule.departureTime = new Date(departureTime); // Ensure proper Date object
    if (fare) schedule.fare = fare;
    
    await schedule.save();
    
    // Populate bus details
    await schedule.populate('bus', 'name operator');
    
    res.json({
      message: 'Schedule updated successfully',
      schedule
    });
    
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/schedules/:scheduleId - Delete a schedule (Admin only)
router.delete('/:scheduleId', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    // Find the schedule
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Check if there are any bookings for this schedule
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({ schedule: scheduleId });
    
    if (bookings.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete schedule. There are existing bookings for this schedule.' 
      });
    }
    
    // Delete the schedule
    await Schedule.findByIdAndDelete(scheduleId);
    
    res.json({
      message: 'Schedule deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/schedules - Get all schedules (Admin only)
router.get('/', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    // Find all schedules and populate bus details
    const schedules = await Schedule.find()
      .populate('bus', 'name operator busType totalSeats amenities')
      .sort({ departureTime: 1 });
    
    res.json({
      message: 'Schedules fetched successfully',
      schedules
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/schedules/:id - Public endpoint to get schedule details with booked seats
router.get('/:id', async (req, res) => {
  try {
    const scheduleId = req.params.id;
    
    // Find the schedule by ID and populate bus details
    const schedule = await Schedule.findById(scheduleId).populate('bus', 'name operator busType totalSeats amenities');
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
// Find all bookings for this schedule (both confirmed and pending)
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({ 
      schedule: scheduleId,
      status: { $in: ['confirmed', 'pending'] }
    });
    
    // Extract seat numbers from bookings
    const bookedSeats = bookings.flatMap(booking => booking.selectedSeats);
    
    // Return schedule details with bus info and booked seats
    res.json({
      schedule: {
        _id: schedule._id,
        source: schedule.source,
        destination: schedule.destination,
        departureTime: schedule.departureTime,
        fare: schedule.fare,
        bus: schedule.bus
      },
      bookedSeats
    });
    
  } catch (error) {
    console.error('Error fetching schedule details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
