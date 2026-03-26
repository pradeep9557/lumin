const express = require('express');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');

const router = express.Router();

function timeAgo(date) {
  const sec = Math.floor((Date.now() - new Date(date)) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`;
  return new Date(date).toLocaleDateString();
}

router.get('/posts', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const list = posts.map((p) => ({
      _id: p._id,
      title: p.title,
      body: p.body,
      author: p.author,
      timeAgo: timeAgo(p.createdAt),
      likes: p.likes || 0,
      likedBy: (p.likedBy || []).map(String),
      comments: (p.comments || []).length,
    }));
    if (list.length === 0) {
      const seed = await Post.insertMany([
        { userId: req.user._id, title: 'Understanding Mercury Retrograde', body: 'Share your experiences with Mercury retrograde.', author: req.user.fullName || 'Luna Star', likes: 2 },
        { userId: req.user._id, title: 'Birth Chart Interpretations Help', body: 'Looking for help reading my chart.', author: 'Star Seeker', likes: 3 },
        { userId: req.user._id, title: 'Full Moon Rituals for Beginners', body: 'What rituals do you do on full moon?', author: 'Cosmic Guide', likes: 1 },
      ]);
      const withTime = seed.map((p) => ({
        _id: p._id,
        title: p.title,
        author: p.author,
        timeAgo: 'Recently',
        likes: p.likes,
        comments: 0,
      }));
      return res.json(withTime);
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comments = (post.comments || []).map((c) => ({
      _id: c._id,
      userId: c.userId,
      author: c.author,
      text: c.text,
      likes: c.likes || 0,
      likedBy: (c.likedBy || []).map(String),
      timeAgo: timeAgo(c.createdAt),
      createdAt: c.createdAt,
    }));
    res.json({
      _id: post._id,
      userId: post.userId,
      title: post.title,
      body: post.body,
      author: post.author,
      likes: post.likes || 0,
      likedBy: (post.likedBy || []).map(String),
      timeAgo: timeAgo(post.createdAt),
      comments,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/posts', auth, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title) return res.status(400).json({ message: 'Title required' });
    const post = await Post.create({
      userId: req.user._id,
      title,
      body: body || '',
      author: req.user.fullName || 'User',
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const uid = req.user._id.toString();
    const idx = (post.likedBy || []).indexOf(uid);
    if (idx >= 0) {
      post.likedBy.splice(idx, 1);
      post.likes = Math.max(0, (post.likes || 0) - 1);
    } else {
      post.likedBy = post.likedBy || [];
      post.likedBy.push(uid);
      post.likes = (post.likes || 0) + 1;
    }
    await post.save();
    res.json({ likes: post.likes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/posts/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Text required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.comments = post.comments || [];
    post.comments.push({
      userId: req.user._id,
      author: req.user.fullName || 'User',
      text: text.trim(),
    });
    await post.save();
    const raw = post.comments[post.comments.length - 1];
    res.status(201).json({
      _id: raw._id,
      userId: raw.userId,
      author: raw.author,
      text: raw.text,
      likes: raw.likes || 0,
      likedBy: (raw.likedBy || []).map(String),
      timeAgo: 'Just now',
      createdAt: raw.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle like on a comment
router.post('/posts/:id/comments/:commentId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const uid = req.user._id.toString();
    const likedBy = comment.likedBy || [];
    const idx = likedBy.map(String).indexOf(uid);
    if (idx >= 0) {
      comment.likedBy.splice(idx, 1);
      comment.likes = Math.max(0, (comment.likes || 0) - 1);
    } else {
      comment.likedBy = comment.likedBy || [];
      comment.likedBy.push(req.user._id);
      comment.likes = (comment.likes || 0) + 1;
    }
    await post.save();
    res.json({ likes: comment.likes, commentId: comment._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
