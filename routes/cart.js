const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Cart = require('../models/Cart');
const SpiritualElement = require('../models/SpiritualElement');

// GET /api/cart — Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }
    res.json({ cart });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// POST /api/cart/add — Add item to cart
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const product = await SpiritualElement.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is active
    if (product.status !== 'active') {
      return res.status(400).json({ message: 'This product is currently unavailable' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if item already in cart
    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    // Calculate total quantity (existing + new)
    const currentQty = existingIndex >= 0 ? cart.items[existingIndex].quantity : 0;
    const requestedQty = currentQty + quantity;

    // Check stock availability
    if (product.stock <= 0) {
      return res.status(400).json({ message: 'This product is out of stock' });
    }
    if (requestedQty > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} unit(s) available in stock${currentQty > 0 ? ` (you already have ${currentQty} in cart)` : ''}`,
        availableStock: product.stock,
      });
    }

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        type: product.type,
        price: product.price || 0,
        quantity,
        image: product.iconUrl || (product.images && product.images[0]) || '',
      });
    }

    await cart.save();
    res.json({ message: 'Item added to cart', cart });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
});

// PUT /api/cart/update — Update item quantity
router.put('/update', auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity == null) {
      return res.status(400).json({ message: 'productId and quantity are required' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex < 0) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      // Check stock before updating quantity
      const product = await SpiritualElement.findById(cart.items[itemIndex].product);
      if (product && quantity > product.stock) {
        return res.status(400).json({
          message: `Only ${product.stock} unit(s) available in stock`,
          availableStock: product.stock,
        });
      }
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    res.json({ message: 'Cart updated', cart });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ message: 'Failed to update cart' });
  }
});

// DELETE /api/cart/remove/:productId — Remove item from cart
router.delete('/remove/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    res.json({ message: 'Item removed from cart', cart });
  } catch (err) {
    console.error('Remove from cart error:', err);
    res.status(500).json({ message: 'Failed to remove item from cart' });
  }
});

// DELETE /api/cart/clear — Clear entire cart
router.delete('/clear', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared', cart });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ message: 'Failed to clear cart' });
  }
});

module.exports = router;
