const express = require('express');
const SpiritualElement = require('../models/SpiritualElement');
const { auth } = require('../middleware/auth');

const router = express.Router();

function buildFilter(type, search) {
  const filter = { type };
  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    filter.$or = [
      { name: new RegExp(s, 'i') },
      { description: new RegExp(s, 'i') },
      { tag: new RegExp(s, 'i') },
    ];
  }
  return filter;
}

/**
 * User app: list herbs (with optional search).
 * GET /api/spiritual/herbs?search=...
 */
router.get('/herbs', auth, async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const filter = buildFilter('herb', search);
    const list = await SpiritualElement.find(filter)
      .sort({ order: 1, name: 1 })
      .select('_id name tag description iconUrl price stock')
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * User app: list crystals (with optional search).
 * GET /api/spiritual/crystals?search=...
 */
router.get('/crystals', auth, async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const filter = buildFilter('crystal', search);
    const list = await SpiritualElement.find(filter)
      .sort({ order: 1, name: 1 })
      .select('_id name tag description iconUrl price stock')
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * User app: get one spiritual element by id.
 * GET /api/spiritual/:id
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await SpiritualElement.findById(req.params.id)
      .select('_id name type tag description iconUrl price stock')
      .lean();
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
