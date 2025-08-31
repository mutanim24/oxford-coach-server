const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');
const Bus = require('../models/Bus');

// Generate a simple random PNR number
const generatePNR = () => {
  return 'PNR' + Math.random().toString(36).substring(2, 9).toUpperCase();
};

// Create a new booking
const createBooking = async (req, res) => {
  try {
    // Defensive validation
    const { scheduleId, selectedSeats } = req.body;
    
    if (!scheduleId || !selectedSeats || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({ message: 'Schedule ID and selected seats (non-empty array) are required' });
    }

    // Check if any of the requested seats are already booked for this schedule
    // Find all bookings for this schedule that have at least one overlapping seat
    const existingBookings = await Booking.find({
      schedule: scheduleId,
      status: { $in: ['confirmed', 'pending'] } // Check both confirmed and pending bookings
    });
    
    // Extract all booked seats from existing bookings
    const bookedSeats = new Set();
    existingBookings.forEach(booking => {
      booking.selectedSeats.forEach(seat => bookedSeats.add(seat));
    });
    
    // Check if any of the selected seats are already booked
    const conflictingSeats = selectedSeats.filter(seat => bookedSeats.has(seat));
    
    if (conflictingSeats.length > 0) {
      // Get more details about the conflicting bookings for better error messages
      const conflictingBookings = existingBookings.filter(booking => 
        booking.selectedSeats.some(seat => conflictingSeats.includes(seat))
      );
      
      let errorMessage = `The following seats are already booked: ${conflictingSeats.join(', ')}. Please select different seats.`;
      
      if (conflictingBookings.length > 0) {
        const bookingDetails = conflictingBookings.map(booking => {
          const status = booking.status === 'confirmed' ? 'confirmed' : 'pending payment';
          return `Booking ${booking.pnrNumber} (${status})`;
        }).join(', ');
        
        errorMessage += ` These seats are part of ${bookingDetails}.`;
      }
      
      return res.status(409).json({ message: errorMessage });
    }

    // Verify database lookups
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Secure server-side calculation
    const totalFare = schedule.fare * selectedSeats.length;

    // Generate unique PNR number
    let pnrNumber;
    let pnrExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure PNR number is unique
    while (pnrExists && attempts < maxAttempts) {
      pnrNumber = generatePNR();
      const existingPNRBooking = await Booking.findOne({ pnrNumber });
      pnrExists = !!existingPNRBooking;
      attempts++;
    }

    if (pnrExists) {
      return res.status(500).json({ message: 'Could not generate unique PNR number' });
    }

    // Create new booking
    const booking = new Booking({
      user: req.user.id,
      schedule: scheduleId,
      bus: schedule.bus,
      selectedSeats,
      totalFare,
      status: 'pending',
      pnrNumber
    });

    // Save booking to database
    await booking.save();

    // Populate user, schedule and bus details
    await booking.populate('user', 'name email');
    await booking.populate('schedule', 'source destination departureTime fare');
    await booking.populate('bus', 'operator busType'); // Corrected to match your likely Bus model

    res.status(201).json({
      success: true,
      booking: {
        ...booking.toObject(),
        pnrNumber: booking.pnrNumber
      }
    });
  } catch (error) {
    // Check if the error is the E11000 duplicate key error for the PNR
    if (error.code === 11000) {
        return res.status(409).json({ message: 'A booking with this PNR number already exists. Please try again.' });
    }
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Confirm a booking after payment
const confirmBooking = async (req, res) => {
  try {
    const { bookingId, paymentIntentId } = req.body;
    
    // Validate input
    if (!bookingId || !paymentIntentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking ID and Payment Intent ID are required' 
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('schedule', 'source destination departureTime fare')
      .populate('bus', 'operator busType');

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    // Check if booking belongs to the authenticated user
    if (booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this booking' 
      });
    }

    // Check if booking is already confirmed
    if (booking.status === 'confirmed') {
      return res.status(200).json({ 
        success: true, 
        booking,
        message: 'This booking has already been confirmed' 
      });
    }

    // Update booking status to confirmed and save payment information
    booking.status = 'confirmed';
    booking.paymentId = paymentIntentId;
    booking.paymentStatus = 'succeeded';
    booking.paymentDate = new Date();
    await booking.save();

    // Return the updated booking with populated fields
    const updatedBooking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('schedule', 'source destination departureTime fare')
      .populate('bus', 'operator busType');

    res.status(200).json({
      success: true,
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred while confirming booking',
      error: error.message 
    });
  }
};

// Get a single booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('schedule', 'source destination departureTime fare')
      .populate('bus', 'operator busType'); // Corrected populate

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking belongs to the authenticated user
    if (booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this booking' });
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all bookings for the authenticated user
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('schedule', 'source destination departureTime fare') // Removed arrivalTime as it's not standard in schedules
      .populate('bus', 'operator busType') // Corrected populate
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all bookings (admin only)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('schedule', 'source destination departureTime fare') // Corrected populate
      .populate('bus', 'operator busType') // Corrected populate
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all bookings from BookingV2 collection (admin only)
const getAllBookingsV2 = async (req, res) => {
  try {
    const bookings = await Booking.find() // This will use the BookingV2 model
      .populate('user', 'name email')
      .populate('schedule', 'source destination departureTime fare')
      .populate('bus', 'operator busType')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error fetching all bookings from BookingV2:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createBooking,
  confirmBooking,
  getBookingById,
  getUserBookings,
  getAllBookings,
  getAllBookingsV2
};
