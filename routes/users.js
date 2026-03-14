const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/me', async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;
    const update = {};
    if (fullName !== undefined) update.fullName = fullName;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/me/birth', async (req, res) => {
  try {
    const { dateOfBirth, timeOfBirth, placeOfBirth, country } = req.body;
    const update = {};
    if (dateOfBirth !== undefined) update.birthDate = dateOfBirth;
    if (timeOfBirth !== undefined) update.birthTime = timeOfBirth;
    if (placeOfBirth !== undefined) update.birthPlace = placeOfBirth;
    if (country !== undefined) update.birthCountry = country;
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
