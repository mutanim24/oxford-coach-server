const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

// Create a payment intent
router.post('/create-payment-intent', authMiddleware, paymentController.createPaymentIntent);

module.exports = router;
