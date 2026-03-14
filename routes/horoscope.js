const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

const signTexts = {
  aries: 'Energy and initiative are high. Take the lead in projects.',
  taurus: 'Stability and comfort matter today. Ground yourself.',
  gemini: 'Communication flows. Share ideas and connect.',
  cancer: 'Emotions are strong. Honor your need for security.',
  leo: 'Creativity and confidence shine. Express yourself.',
  virgo: 'Details matter. Organize and refine.',
  libra: 'Balance and harmony in relationships are favored.',
  scorpio: 'Depth and transformation. Trust your intuition.',
  sagittarius: 'Adventure and learning call. Expand your mind.',
  capricorn: 'Discipline and structure support your goals.',
  aquarius: 'Your creative energy is at its peak today. The moon\'s position suggests it\'s an ideal time for self-expression and new beginnings. Trust your intuition in personal matters.',
  pisces: 'Dreams and compassion guide you. Connect to the unseen.',
};

router.get('/daily', auth, (req, res) => {
  const sign = (req.query.sign || req.user?.sunSign || 'aquarius').toLowerCase();
  const text = signTexts[sign] || signTexts.aquarius;
  res.json({
    sign,
    text,
    date: new Date().toLocaleDateString(),
  });
});

router.get('/weekly', auth, (req, res) => {
  const sign = (req.query.sign || req.user?.sunSign || 'aquarius').toLowerCase();
  res.json({
    love: 'This week brings harmony in your relationships. Venus favors open communication. Single? A chance encounter on Thursday could spark something special. Committed? Plan a romantic gesture to strengthen your bond.',
    career: "Professional opportunities align mid-week. Mercury's position supports clear negotiations. Financial matters require careful attention—avoid impulsive purchases. A mentor figure may offer valuable guidance.",
    health: 'Energy levels peak early in the week. Focus on balance—both physical and mental. Yoga or meditation practices are especially beneficial. Pay attention to your body\'s signals and prioritize rest when needed.',
    keyDays: [
      'Wednesday - Best for decisions',
      'Friday - Social connections bloom',
      'Saturday - Rest and recharge',
    ],
    weekProgress: 4,
    totalDays: 7,
  });
});

module.exports = router;
