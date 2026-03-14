const mongoose = require('mongoose');

const birthChartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateOfBirth: String,
  timeOfBirth: String,
  placeOfBirth: String,
  country: String,
  bigThree: [
    { label: String, sub: String }
  ],
  chartPattern: String,
  dominantElement: String,
  dominantQuality: String,
  planets: [{ name: String, house: String }],
  houses: [{ house: String, meaning: String }],
}, { timestamps: true });

module.exports = mongoose.model('BirthChart', birthChartSchema);
