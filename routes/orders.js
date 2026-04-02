const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

// POST /api/orders — Create a new order from cart
router.post('/', auth, async (req, res) => {
  try {
    const { shippingInfo, notes } = req.body;

    if (!shippingInfo) {
      return res.status(400).json({ message: 'Shipping information is required' });
    }

    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    for (const field of requiredFields) {
      if (!shippingInfo[field] || !shippingInfo[field].trim()) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Get the user's cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Create the order
    const order = new Order({
      user: req.user._id,
      items: cart.items.map((item) => ({
        product: item.product,
        name: item.name,
        type: item.type,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      shippingInfo,
      totalAmount: cart.totalAmount,
      notes: notes || '',
    });

    await order.save();

    // Clear the cart after order is placed
    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        orderId: order.orderId,
        _id: order._id,
        items: order.items,
        shippingInfo: order.shippingInfo,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Failed to place order' });
  }
});

// GET /api/orders — Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:orderId — Get a single order by orderId
router.get('/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.orderId,
      user: req.user._id,
    }).lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

module.exports = router;
