const express = require('express');
const PageContent = require('../models/PageContent');
const Faq = require('../models/Faq');
const SpiritualElement = require('../models/SpiritualElement');
const User = require('../models/User');
const JournalEntry = require('../models/JournalEntry');
const Post = require('../models/Post');
const Order = require('../models/Order');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();
router.use(adminAuth);

// ── Slug helpers ─────────────────────────────────────────────
const SLUG_MAP = {
  'help-support': 'help_support',
  'privacy-policy': 'privacy_policy',
  'terms-of-service': 'terms_of_service',
};

function toDbSlug(urlSlug) {
  return SLUG_MAP[urlSlug] || urlSlug?.replace(/-/g, '_');
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD / STATS
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/stats
 * Returns counts for the dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, activeUsers, disabledUsers, totalFaqs, totalHerbs, totalCrystals, totalPages, totalPosts, totalJournals] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      Faq.countDocuments(),
      SpiritualElement.countDocuments({ type: 'herb' }),
      SpiritualElement.countDocuments({ type: 'crystal' }),
      PageContent.countDocuments(),
      Post.countDocuments(),
      JournalEntry.countDocuments(),
    ]);

    // New users in last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    res.json({
      totalUsers,
      activeUsers,
      disabledUsers,
      newUsersThisWeek,
      totalFaqs,
      totalHerbs,
      totalCrystals,
      totalPages,
      totalPosts,
      totalJournals,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/users
 * Query: search?, status? (active|disabled), page?, limit?
 */
router.get('/users', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status === 'active') filter.isActive = true;
    if (status === 'disabled') filter.isActive = false;

    if (search && search.trim()) {
      const s = search.trim();
      filter.$or = [
        { fullName: new RegExp(s, 'i') },
        { email: new RegExp(s, 'i') },
        { phone: new RegExp(s, 'i') },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/admin/users/:id
 */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Body: { fullName?, email?, phone?, role?, isActive?, birthDate?, birthTime?, birthPlace?, birthCountry? }
 */
router.patch('/users/:id', async (req, res) => {
  try {
    const allowed = ['fullName', 'email', 'phone', 'role', 'isActive', 'birthDate', 'birthTime', 'birthPlace', 'birthCountry'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/admin/users/:id/toggle-status
 * Toggles isActive true/false
 */
router.patch('/users/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// ORDER MANAGEMENT
// ══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/orders
 * Query: search?, status?, page?, limit?
 */
router.get('/orders', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      filter.$or = [
        { orderId: new RegExp(s, 'i') },
        { 'shippingInfo.fullName': new RegExp(s, 'i') },
        { 'shippingInfo.email': new RegExp(s, 'i') },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'fullName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    // Also get status counts for stats
    const [totalOrders, pendingCount, confirmedCount, shippedCount, deliveredCount, cancelledCount] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'confirmed' }),
      Order.countDocuments({ status: 'shipped' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
    ]);

    res.json({
      orders,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      stats: {
        totalOrders,
        pending: pendingCount,
        confirmed: confirmedCount,
        shipped: shippedCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/admin/orders/:id
 */
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'fullName email phone')
      .lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Body: { status }
 */
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Use: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;

    // If shipped and no shippedAt date is set, set it now
    if (status === 'shipped' && (!order.trackingInfo || !order.trackingInfo.shippedAt)) {
      if (!order.trackingInfo) order.trackingInfo = {};
      order.trackingInfo.shippedAt = new Date();
    }

    await order.save();
    const updated = await Order.findById(order._id).populate('user', 'fullName email phone').lean();
    res.json({ order: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/admin/orders/:id/tracking
 * Body: { trackingNumber, carrier, trackingUrl, estimatedDelivery, notes }
 */
router.patch('/orders/:id/tracking', async (req, res) => {
  try {
    const { trackingNumber, carrier, trackingUrl, estimatedDelivery, notes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Update tracking info
    if (!order.trackingInfo) order.trackingInfo = {};
    if (trackingNumber !== undefined) order.trackingInfo.trackingNumber = trackingNumber;
    if (carrier !== undefined) order.trackingInfo.carrier = carrier;
    if (trackingUrl !== undefined) order.trackingInfo.trackingUrl = trackingUrl;
    if (estimatedDelivery !== undefined) order.trackingInfo.estimatedDelivery = estimatedDelivery;
    if (notes !== undefined) order.trackingInfo.notes = notes;

    // If tracking number is provided and status is not yet shipped, update to shipped
    if (trackingNumber && !['shipped', 'delivered'].includes(order.status)) {
      order.status = 'shipped';
      order.trackingInfo.shippedAt = new Date();
    }

    await order.save();
    const updated = await Order.findById(order._id).populate('user', 'fullName email phone').lean();
    res.json({ order: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/admin/orders/:id/payment-status
 * Body: { paymentStatus }
 */
router.patch('/orders/:id/payment-status', async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: `Invalid payment status. Use: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    ).populate('user', 'fullName email phone').lean();

    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// PAGE CONTENT
// ══════════════════════════════════════════════════════════════

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

router.get('/pages', async (req, res) => {
  try {
    const pages = await PageContent.find().sort({ slug: 1 }).lean();
    res.json(pages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// FAQS
// ══════════════════════════════════════════════════════════════

router.get('/faqs', async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ order: 1 }).lean();
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

router.delete('/faqs/:id', async (req, res) => {
  try {
    const result = await Faq.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'FAQ not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// SPIRITUAL ELEMENTS
// ══════════════════════════════════════════════════════════════

router.get('/spiritual-elements/categories', async (req, res) => {
  try {
    const categories = await SpiritualElement.distinct('category');
    const defaults = ['Crystals', 'Tarot', 'Meditation', 'Books', 'Aromatherapy', 'Decor'];
    const merged = [...new Set([...defaults, ...categories.filter(Boolean)])].sort();
    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

router.get('/spiritual-elements/:id', async (req, res) => {
  try {
    const item = await SpiritualElement.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Spiritual element not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/spiritual-elements', async (req, res) => {
  try {
    const { name, type, description, tag, iconUrl, order, category, price, stock, sku, images, status } = req.body || {};
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
      category: (category || '').trim(),
      price: price != null ? Number(price) : 0,
      stock: stock != null ? Number(stock) : 0,
      sku: (sku || '').trim(),
      images: images || [],
      status: status || 'active',
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/spiritual-elements/:id', async (req, res) => {
  try {
    const { name, type, description, tag, iconUrl, order, category, price, stock, sku, images, status } = req.body || {};
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
    if (category !== undefined) update.category = category.trim();
    if (price !== undefined) update.price = Number(price);
    if (stock !== undefined) update.stock = Number(stock);
    if (sku !== undefined) update.sku = sku.trim();
    if (images !== undefined) update.images = images;
    if (status !== undefined) update.status = status;

    const item = await SpiritualElement.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ message: 'Spiritual element not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/spiritual-elements/:id', async (req, res) => {
  try {
    const result = await SpiritualElement.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Spiritual element not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// JOURNAL ENTRIES
// ══════════════════════════════════════════════════════════════

router.get('/journals', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search && search.trim()) {
      const s = search.trim();
      filter.$or = [
        { title: new RegExp(s, 'i') },
        { body: new RegExp(s, 'i') },
      ];
    }
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [entries, total] = await Promise.all([
      JournalEntry.find(filter).populate('userId', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      JournalEntry.countDocuments(filter),
    ]);
    res.json({
      entries,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/journals/:id', async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id).populate('userId', 'fullName email').lean();
    if (!entry) return res.status(404).json({ message: 'Journal entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/journals/:id', async (req, res) => {
  try {
    const update = {};
    if (req.body?.title !== undefined) update.title = req.body.title;
    if (req.body?.body !== undefined) update.body = req.body.body;

    const entry = await JournalEntry.findByIdAndUpdate(req.params.id, update, { new: true }).populate('userId', 'fullName email');
    if (!entry) return res.status(404).json({ message: 'Journal entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/journals/:id', async (req, res) => {
  try {
    const result = await JournalEntry.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Journal entry not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POSTS (Community)
// ══════════════════════════════════════════════════════════════

router.get('/posts', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search && search.trim()) {
      const s = search.trim();
      filter.$or = [
        { title: new RegExp(s, 'i') },
        { body: new RegExp(s, 'i') },
        { author: new RegExp(s, 'i') },
      ];
    }
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const [posts, total] = await Promise.all([
      Post.find(filter).populate('userId', 'fullName email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Post.countDocuments(filter),
    ]);
    res.json({
      posts,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('userId', 'fullName email').populate('comments.userId', 'fullName email').lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/posts/:id', async (req, res) => {
  try {
    const update = {};
    if (req.body?.title !== undefined) update.title = req.body.title;
    if (req.body?.body !== undefined) update.body = req.body.body;
    if (req.body?.author !== undefined) update.author = req.body.author;

    const post = await Post.findByIdAndUpdate(req.params.id, update, { new: true }).populate('userId', 'fullName email');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/posts/:id', async (req, res) => {
  try {
    const result = await Post.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Post not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/posts/:postId/comments/:commentId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.comments = post.comments.filter((c) => c._id.toString() !== req.params.commentId);
    await post.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
