const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

const compatibilityMap = {
  'aquarius-taurus': {
    matchPercent: 78,
    strengths: [
      'Strong mental connection and stimulating conversations',
      'Shared values around personal freedom and growth',
      'Mutual support for individual pursuits',
    ],
    challenges: [
      'May struggle with emotional vulnerability',
      'Need to balance independence with togetherness',
      'Different approaches to commitment',
    ],
    advice: "Focus on building emotional intimacy alongside your mental connection. Schedule regular quality time together while respecting each other's need for space. Your relationship will thrive when you balance intellect with heart.",
  },
};

function getCompatibility(mySign, partnerSign) {
  const key = [mySign, partnerSign].map((s) => s.toLowerCase()).sort().join('-');
  const alt = [partnerSign, mySign].map((s) => s.toLowerCase()).sort().join('-');
  return compatibilityMap[key] || compatibilityMap[alt] || {
    matchPercent: 65 + Math.floor(Math.random() * 25),
    strengths: [
      'Strong mental connection',
      'Shared values',
      'Mutual support',
    ],
    challenges: [
      'Emotional expression may need attention',
      'Balance independence with togetherness',
    ],
    advice: 'Focus on communication and quality time. Your relationship will thrive when you balance intellect with heart.',
  };
}

router.get('/sign', auth, (req, res) => {
  const mySign = (req.query.mySign || req.user?.sunSign || 'Aquarius').trim();
  const partnerSign = (req.query.partnerSign || 'Taurus').trim();
  const result = getCompatibility(mySign, partnerSign);
  res.json(result);
});

router.post('/chart', auth, (req, res) => {
  const mySign = req.body?.myBirth ? 'Aquarius' : 'Aquarius';
  const partnerSign = req.body?.partnerBirth ? 'Taurus' : 'Taurus';
  const result = getCompatibility(mySign, partnerSign);
  res.json(result);
});

module.exports = router;
