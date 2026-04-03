const mongoose = require('mongoose');

const paymentGatewaySchema = new mongoose.Schema({
  // Gateway identifier: 'stripe', 'paypal', 'razorpay'
  gatewayId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  logo: { type: String, default: '' },
  status: { type: String, enum: ['connected', 'disconnected'], default: 'disconnected' },

  // Keys (encrypted in production — stored as-is for now)
  publicKey: { type: String, default: '' },
  secretKey: { type: String, default: '' },

  // Configuration
  environment: { type: String, enum: ['sandbox', 'live'], default: 'sandbox' },
  currencies: [{ type: String }],
  recurringBilling: { type: Boolean, default: false },
  webhooksEnabled: { type: Boolean, default: true },
  transactionFee: { type: String, default: '' },
  retryAttempts: { type: Number, default: 3 },
  minCharge: { type: String, default: '' },
  maxCharge: { type: String, default: '' },
}, { timestamps: true });

// Seed default gateways if none exist
paymentGatewaySchema.statics.seedDefaults = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    await this.insertMany([
      {
        gatewayId: 'stripe',
        name: 'Stripe',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
        status: 'disconnected',
        currencies: ['USD'],
      },
      {
        gatewayId: 'paypal',
        name: 'PayPal',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg',
        status: 'disconnected',
        currencies: ['USD'],
      },
      {
        gatewayId: 'razorpay',
        name: 'Razorpay',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg',
        status: 'disconnected',
        currencies: ['INR'],
      },
    ]);
  }
};

module.exports = mongoose.model('PaymentGateway', paymentGatewaySchema);
