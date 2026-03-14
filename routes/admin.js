const express = require('express');
const PageContent = require('../models/PageContent');
const Faq = require('../models/Faq');
const SpiritualElement = require('../models/SpiritualElement');
const { auth } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const SLUG_MAP = {
  'help-support': 'help_support',
  'privacy-policy': 'privacy_policy',
  'terms-of-service': 'terms_of_service',
};

function toDbSlug(urlSlug) {
  return SLUG_MAP[urlSlug] || urlSlug?.replace(/-/g, '_');
}

/**
 * Admin: create or update page content.
 * PUT /api/admin/pages/:slug
 * Body: { title?, content? }
 */
router.put('/pages/:slug', async (req, res) => {
  try {
    const dbSlug = toDbSlug(req.params.slug);
    if (!PageContent.PAGE_SLUGS.includes(dbSlug)) {
      return res.status(400).json({ message: 'Invalid page slug. Use: help-support, privacy-policy, terms-of-service' });
    }
    const { title, content } = req.body || {};
    const update = {};
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;

    const page = await PageContent.findOneAndUpdate(
      { slug: dbSlug },
      { $set: update },
      { new: true, upsert: true }
    );
    res.json(page);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Admin: list all page contents (optional).
 * GET /api/admin/pages
 */
router.get('/pages', async (req, res) => {
  try {
    const pages = await PageContent.find().sort({ slug: 1 }).lean();
    res.json(pages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Admin: list all FAQs (for help-support).
 * GET /api/admin/faqs
 */
router.get('/faqs', async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ order: 1 }).lean();
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Admin: create FAQ.
 * POST /api/admin/faqs
 * Body: { question, answer, order? }
 */
router.post('/faqs', async (req, res) => {
  try {
    const { question, answer, order } = req.body || {};
    if (!question || !answer) {
      return res.status(400).json({ message: 'question and answer required' });
    }
    const faq = await Faq.create({ question, answer, order: order ?? 0 });
    res.status(201).json(faq);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Admin: update FAQ.
 * PATCH /api/admin/faqs/:id
 * Body: { question?, answer?, order? }
 */
router.patch('/faqs/:id', async (req, res) => {
  try {
    const update = {};
    if (req.body?.question !== undefined) update.question = req.body.question;
    if (req.body?.answer !== undefined) update.answer = req.body.answer;
    if (req.body?.order !== undefined) update.order = req.body.order;

    const faq = await Faq.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json(faq);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Admin: delete FAQ.
 * DELETE /api/admin/faqs/:id
 */
router.delete('/faqs/:id', async (req, res) => {
  try {
    const result = await Faq.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'FAQ not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Admin: list all spiritual elements (herbs & crystals).
 * GET /api/admin/spiritual-elements
 * Query: type?, search?
 */
router.get('/spiritual-elements', async (req, res) => {
  try {
    const { type, search } = req.query || {};
    const filter = {};
    if (type && ['herb', 'crystal'].includes(type)) filter.type = type;
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      filter.$or = [
        { name: new RegExp(s, 'i') },
        { description: new RegExp(s, 'i') },
        { tag: new RegExp(s, 'i') },
      ];
    }
    const list = await SpiritualElement.find(filter).sort({ order: 1, name: 1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Admin: get one spiritual element.
 * GET /api/admin/spiritual-elements/:id
 */
router.get('/spiritual-elements/:id', async (req, res) => {
  try {
    const item = await SpiritualElement.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Spiritual element not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Admin: create spiritual element (herb or crystal).
 * POST /api/admin/spiritual-elements
 * Body: { name, type: 'herb'|'crystal', description, tag?, iconUrl?, order? }
 */
router.post('/spiritual-elements', async (req, res) => {
  try {
    const { name, type, description, tag, iconUrl, order } = req.body || {};
    if (!name || !type || !description) {
      return res.status(400).json({ message: 'name, type (herb|crystal), and description required' });
    }
    if (!['herb', 'crystal'].includes(type)) {
      return res.status(400).json({ message: 'type must be herb or crystal' });
    }
    const item = await SpiritualElement.create({
      name: name.trim(),
      type,
      description: description.trim(),
      tag: (tag || '').trim(),
      iconUrl: (iconUrl || '').trim(),
      order: order != null ? Number(order) : 0,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Admin: update spiritual element.
 * PATCH /api/admin/spiritual-elements/:id
 * Body: { name?, type?, description?, tag?, iconUrl?, order? }
 */
router.patch('/spiritual-elements/:id', async (req, res) => {
  try {
    const { name, type, description, tag, iconUrl, order } = req.body || {};
    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (type !== undefined) {
      if (!['herb', 'crystal'].includes(type)) {
        return res.status(400).json({ message: 'type must be herb or crystal' });
      }
      update.type = type;
    }
    if (description !== undefined) update.description = description.trim();
    if (tag !== undefined) update.tag = tag.trim();
    if (iconUrl !== undefined) update.iconUrl = iconUrl.trim();
    if (order !== undefined) update.order = Number(order);

    const item = await SpiritualElement.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ message: 'Spiritual element not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Admin: delete spiritual element.
 * DELETE /api/admin/spiritual-elements/:id
 */
router.delete('/spiritual-elements/:id', async (req, res) => {
  try {
    const result = await SpiritualElement.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Spiritual element not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
