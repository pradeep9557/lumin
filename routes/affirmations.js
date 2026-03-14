const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

const affirmations = [
  { text: "I am aligned with the rhythm of the universe. My timing is perfect.", theme: 'Alignment' },
  { text: "I am aligned with the universe's abundant energy. Today, I attract positivity and embrace transformation with an open heart.", theme: 'Abundance' },
  { text: "I trust in the divine timing of my life. Everything unfolds exactly when it's meant to.", theme: 'Trust' },
  { text: 'My intuition guides me toward the highest good. I listen to my inner wisdom with confidence.', theme: 'Intuition' },
  { text: "I release what no longer serves me and welcome new opportunities with grace.", theme: 'Release' },
];

router.get('/', auth, (req, res) => {
  res.json(affirmations);
});

router.get('/daily', auth, (req, res) => {
  const idx = new Date().getDate() % affirmations.length;
  res.json({ text: affirmations[idx].text, theme: affirmations[idx].theme });
});

module.exports = router;
