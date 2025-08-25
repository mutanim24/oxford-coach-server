const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');
const Schedule = require('../models/Schedule');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Apply both authentication and admin middleware to all bus routes
router.use(authMiddleware);
router.use(adminMiddleware);

// @route   POST /api/buses
// @desc    Create a new bus
// @access  Private (Admin)
router.post('/', async (req, res) => {
  try {
    const { name, operator, busType, totalSeats, amenities } = req.body;

    // Create a new bus
    const newBus = new Bus({
      name,
      operator,
      busType,
      totalSeats,
      amenities: amenities || []
    });

    // Save the bus to the database
    const bus = await newBus.save();
    
    res.status(201).json({
      success: true,
      data: bus
    });
  } catch (error) {
    console.error('Error creating bus:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/buses
// @desc    Get all buses
// @access  Private (Admin)
router.get('/', async (req, res) => {
  try {
    const buses = await Bus.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: buses.length,
      data: buses
    });
  } catch (error) {
    console.error('Error fetching buses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/buses/:id
// @desc    Get single bus by ID
// @access  Private (Admin)
router.get('/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: bus
    });
  } catch (error) {
    console.error('Error fetching bus:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/buses/:id
// @desc    Update a bus by ID
// @access  Private (Admin)
router.put('/:id', async (req, res) => {
  try {
    const { name, operator, busType, totalSeats, amenities } = req.body;
    
    // Find the bus by ID
    let bus = await Bus.findById(req.params.id);
    
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    // Update fields
    bus.name = name || bus.name;
    bus.operator = operator || bus.operator;
    bus.busType = busType || bus.busType;
    bus.totalSeats = totalSeats || bus.totalSeats;
    bus.amenities = amenities || bus.amenities;
    
    // Save the updated bus
    bus = await bus.save();
    
    res.status(200).json({
      success: true,
      data: bus
    });
  } catch (error) {
    console.error('Error updating bus:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/buses/:id
// @desc    Delete a bus by ID
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const deletedBus = await Bus.findByIdAndDelete(req.params.id);

    if (!deletedBus) {
      return res.status(404).json({
        error: "Bus not found."
      });
    }

    res.status(200).json({
      message: "Bus deleted successfully."
    });
  } catch (error) {
    console.error('Error deleting bus:', error);
    res.status(500).json({
      error: "Server error while deleting bus."
    });
  }
});

// @route   POST /api/buses/:id/schedules
// @desc    Add multiple schedules to a bus
// @access  Private (Admin)
router.post('/:id/schedules', async (req, res) => {
  try {
    const { schedules } = req.body;
    const busId = req.params.id;
    
    // Check if bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    // Validate schedules array
    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Schedules must be provided as a non-empty array'
      });
    }
    
    // Create schedule documents
    const newSchedules = schedules.map(schedule => ({
      bus: busId,
      source: schedule.source,
      destination: schedule.destination,
      departureTime: new Date(schedule.departureTime),
      fare: schedule.fare
    }));
    
    // Save all schedules
    const savedSchedules = await Schedule.insertMany(newSchedules);
    
    res.status(201).json({
      success: true,
      message: `${savedSchedules.length} schedules added successfully`,
      data: savedSchedules
    });
  } catch (error) {
    console.error('Error adding schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/buses/:id/schedules
// @desc    Get all schedules for a bus
// @access  Private (Admin)
router.get('/:id/schedules', async (req, res) => {
  try {
    const busId = req.params.id;
    
    // Check if bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    // Get all schedules for the bus
    const schedules = await Schedule.find({ bus: busId })
      .populate('bus')
      .sort({ departureTime: 1 });
    
    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/buses/schedules/:scheduleId
// @desc    Delete a schedule by ID
// @access  Private (Admin)
router.delete('/schedules/:scheduleId', async (req, res) => {
  try {
    const scheduleId = req.params.scheduleId;
    
    const deletedSchedule = await Schedule.findByIdAndDelete(scheduleId);

    if (!deletedSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
