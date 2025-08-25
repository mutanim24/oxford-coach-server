const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');

// Create a payment intent
const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    // Validate input
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    // Fetch booking details
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('schedule', 'source destination departureTime fare')
      .populate('bus', 'name operator busType');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking belongs to the authenticated user
    if (booking.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this booking' });
    }

    // Check if booking is already paid
    if (booking.status === 'confirmed') {
      return res.status(400).json({ message: 'This booking has already been paid for' });
    }

    // Convert totalFare to cents (smallest currency unit)
    const amountInCents = Math.round(booking.totalFare * 100);

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user.id
      }
    });

    // Send the client secret to the client
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: booking.totalFare,
      currency: 'usd'
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createPaymentIntent
};
