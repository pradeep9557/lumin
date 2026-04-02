const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'SpiritualElement', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['herb', 'crystal'], required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  image: { type: String, default: '' },
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  totalAmount: { type: Number, default: 0 },
}, { timestamps: true });

// Recalculate total before saving
cartSchema.pre('save', function (next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
