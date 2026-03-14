const express = require('express');
const BirthChart = require('../models/BirthChart');
const { auth } = require('../middleware/auth');

const router = express.Router();

function defaultChart(birthData) {
  const date = birthData?.dateOfBirth || 'Feb 5, 1995';
  const time = birthData?.timeOfBirth || '14:30';
  const place = birthData?.placeOfBirth || 'Mumbai, India';
  return {
    date,
    time,
    place,
    bigThree: [
      { label: 'Sun in Aquarius', sub: 'Core identity, ego, vitality' },
      { label: 'Moon in Pisces', sub: 'Emotions, instincts, habits' },
      { label: 'Rising in Leo', sub: 'Outer personality, first impressions' },
    ],
    chartPattern: 'Bow',
    dominantElement: 'Air',
    dominantQuality: 'Fixed',
    planets: [
      { name: 'Sun in Aquarius', house: '7th House' },
      { name: 'Mercury in Aquarius', house: '7th House' },
      { name: 'Moon in Pisces', house: '8th House' },
      { name: 'Venus in Capricorn', house: '6th House' },
      { name: 'Jupiter in Sagittarius', house: '6th House' },
      { name: 'Mars in Virgo', house: '2nd House' },
      { name: 'Saturn in Pisces', house: '8th House' },
    ],
    houses: [
      { house: '1st House', meaning: 'Self & Identity' },
      { house: '2nd House', meaning: 'Values & Resources' },
      { house: '3rd House', meaning: 'Communication' },
      { house: '4th House', meaning: 'Home & Family' },
      { house: '5th House', meaning: 'Creativity & Romance' },
      { house: '6th House', meaning: 'Health & Service' },
      { house: '7th House', meaning: 'Partnership' },
      { house: '8th House', meaning: 'Transformation' },
      { house: '9th House', meaning: 'Philosophy & Travel' },
      { house: '10th House', meaning: 'Career & Status' },
      { house: '11th House', meaning: 'Friends & Goals' },
      { house: '12th House', meaning: 'Spirituality' },
    ],
  };
}

router.post('/birth-chart', auth, async (req, res) => {
  try {
    const data = defaultChart(req.body);
    await BirthChart.findOneAndUpdate(
      { userId: req.user._id },
      { userId: req.user._id, ...data },
      { upsert: true, new: true }
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/birth-chart', auth, async (req, res) => {
  try {
    let chart = await BirthChart.findOne({ userId: req.user._id });
    if (!chart) {
      chart = defaultChart({
        dateOfBirth: req.user.birthDate,
        timeOfBirth: req.user.birthTime,
        placeOfBirth: req.user.birthPlace,
      });
    } else {
      chart = chart.toObject();
    }
    res.json(chart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
