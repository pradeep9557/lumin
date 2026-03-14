const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/feed', auth, (req, res) => {
  res.json([
    { title: 'Mercury Retrograde Alert', body: 'Prepare for communication challenges this week.', timeAgo: '2 hours ago' },
    { title: 'Full Moon in Leo Approaching', body: 'Time to shine and express your authentic self.', timeAgo: '5 hours ago' },
  ]);
});

router.get('/today', auth, (req, res) => {
  res.json({
    luckyColor: 'Purple',
    luckyNumber: '7',
  });
});

module.exports = router;
