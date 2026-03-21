const mongoose = require('mongoose');

const spiritualElementSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ['herb', 'crystal'] },
  tag: { type: String, default: '', trim: true },
  description: { type: String, required: true, trim: true },
  iconUrl: { type: String, default: '', trim: true },
  order: { type: Number, default: 0 },
  // Product fields
  category: { type: String, default: '', trim: true },
  price: { type: Number, default: 0, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  sku: { type: String, default: '', trim: true },
  images: [{ type: String }],
  status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('SpiritualElement', spiritualElementSchema);
