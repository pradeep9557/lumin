const mongoose = require('mongoose');

const spiritualElementSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ['herb', 'crystal'] },
  tag: { type: String, default: '', trim: true },
  description: { type: String, required: true, trim: true },
  iconUrl: { type: String, default: '', trim: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('SpiritualElement', spiritualElementSchema);
