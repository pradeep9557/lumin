const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/chat', auth, (req, res) => {
  const { message } = req.body;
  const reply =
    'Based on your birth chart and current planetary positions, I sense that this is a time of transformation for you. The stars suggest focusing on inner growth and trusting your intuition. What specific area would you like guidance on?';
  res.json({ reply, message });
});

module.exports = router;
