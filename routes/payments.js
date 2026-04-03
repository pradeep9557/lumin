const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const PaymentGateway = require('../models/PaymentGateway');
const Order = require('../models/Order');

// GET /api/payments/gateways — Fetch active/configured payment gateways for mobile app
router.get('/gateways', auth, async (req, res) => {
  try {
    await PaymentGateway.seedDefaults();
    const gateways = await PaymentGateway.find({ status: 'connected' }).sort({ name: 1 });

    // Only expose safe fields to the client (no secret keys)
    const data = gateways.map(g => ({
      id: g.gatewayId,
      name: g.name,
      logo: g.logo,
      environment: g.environment,
      publicKey: g.publicKey,
      currencies: g.currencies,
    }));

    // Always include Cash on Delivery as an option
    res.json({
      gateways: [
        { id: 'cod', name: 'Cash on Delivery', logo: '', environment: 'live', publicKey: '', currencies: ['USD', 'INR', 'GBP', 'EUR'] },
        ...data,
      ],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/create-order — Create a payment order for Razorpay / Stripe
router.post('/create-order', auth, async (req, res) => {
  try {
    const { gatewayId, amount, currency } = req.body;

    const gateway = await PaymentGateway.findOne({ gatewayId, status: 'connected' });
    if (!gateway) {
      return res.status(400).json({ message: 'Payment gateway not configured or not connected' });
    }

    if (gatewayId === 'razorpay') {
      // Create Razorpay order
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: gateway.publicKey,
        key_secret: gateway.secretKey,
      });

      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Razorpay expects paise
        currency: currency || 'INR',
        receipt: `order_${Date.now()}`,
      });

      return res.json({
        success: true,
        gatewayId: 'razorpay',
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: gateway.publicKey,
      });
    }

    if (gatewayId === 'stripe') {
      // Create Stripe PaymentIntent
      const stripe = require('stripe')(gateway.secretKey);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects cents
        currency: (currency || 'USD').toLowerCase(),
        metadata: { userId: req.user._id.toString() },
      });

      return res.json({
        success: true,
        gatewayId: 'stripe',
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        publicKey: gateway.publicKey,
      });
    }

    if (gatewayId === 'paypal') {
      // PayPal — return config for client-side SDK
      return res.json({
        success: true,
        gatewayId: 'paypal',
        clientId: gateway.publicKey,
        environment: gateway.environment,
        amount,
        currency: currency || 'USD',
      });
    }

    res.status(400).json({ message: 'Unsupported gateway' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/verify — Verify payment after completion
router.post('/verify', auth, async (req, res) => {
  try {
    const { gatewayId, orderId, paymentId, signature, stripePaymentIntentId } = req.body;

    if (gatewayId === 'razorpay') {
      const crypto = require('crypto');
      const gateway = await PaymentGateway.findOne({ gatewayId: 'razorpay', status: 'connected' });
      if (!gateway) return res.status(400).json({ message: 'Razorpay not configured' });

      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', gateway.secretKey)
        .update(body)
        .digest('hex');

      if (expectedSignature === signature) {
        return res.json({ success: true, verified: true });
      }
      return res.json({ success: false, verified: false, message: 'Invalid signature' });
    }

    if (gatewayId === 'stripe') {
      const gateway = await PaymentGateway.findOne({ gatewayId: 'stripe', status: 'connected' });
      if (!gateway) return res.status(400).json({ message: 'Stripe not configured' });

      const stripe = require('stripe')(gateway.secretKey);
      const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        return res.json({ success: true, verified: true });
      }
      return res.json({ success: false, verified: false, message: `Payment status: ${paymentIntent.status}` });
    }

    res.status(400).json({ message: 'Unsupported gateway for verification' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
