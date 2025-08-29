const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const bookingController = require('../controllers/bookingController');

// Create a new booking
router.post('/', authMiddleware, bookingController.createBooking);

// Confirm a booking after payment
router.post('/confirm', authMiddleware, bookingController.confirmBooking);

// Get a single booking by ID
router.get('/:id', authMiddleware, bookingController.getBookingById);

// Get all bookings for the authenticated user
router.get('/my-bookings', authMiddleware, bookingController.getUserBookings);

// Get all bookings (admin only)
router.get('/all', authMiddleware, adminMiddleware, bookingController.getAllBookings);

// Get all bookings from BookingV2 collection (admin only)
router.get('/bookingv2', authMiddleware, adminMiddleware, bookingController.getAllBookingsV2);

module.exports = router;
