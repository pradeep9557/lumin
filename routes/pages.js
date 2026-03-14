const express = require('express');
const PageContent = require('../models/PageContent');
const Faq = require('../models/Faq');
const { auth } = require('../middleware/auth');

const router = express.Router();

const SLUG_MAP = {
  'help-support': 'help_support',
  'privacy-policy': 'privacy_policy',
  'terms-of-service': 'terms_of_service',
};

const SLUG_LIST = Object.keys(SLUG_MAP);

function toDbSlug(urlSlug) {
  return SLUG_MAP[urlSlug] || urlSlug?.replace(/-/g, '_');
}

/**
 * Public: get page content by slug (no auth).
 * GET /api/pages/help-support
 * GET /api/pages/privacy-policy
 * GET /api/pages/terms-of-service
 */
router.get('/:slug', async (req, res) => {
  try {
    const dbSlug = toDbSlug(req.params.slug);
    if (!PageContent.PAGE_SLUGS.includes(dbSlug)) {
      return res.status(400).json({ message: 'Invalid page slug' });
    }

    let page = await PageContent.findOne({ slug: dbSlug }).lean();

    if (dbSlug === 'help_support') {
      const faqs = await Faq.find().sort({ order: 1 }).lean();
      return res.json({
        slug: req.params.slug,
        title: page?.title ?? 'Help & Support',
        content: page?.content ?? '',
        faqs: faqs.map(({ _id, question, answer, order }) => ({ _id, question, answer, order })),
      });
    }

    if (!page) {
      return res.json({
        slug: req.params.slug,
        title: dbSlug === 'privacy_policy' ? 'Privacy Policy' : 'Terms of Service',
        content: '',
      });
    }

    res.json({
      slug: req.params.slug,
      title: page.title,
      content: page.content,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
