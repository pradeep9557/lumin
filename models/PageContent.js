const mongoose = require('mongoose');

const PAGE_SLUGS = ['help_support', 'privacy_policy', 'terms_of_service'];

const pageContentSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    enum: PAGE_SLUGS,
  },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('PageContent', pageContentSchema);
module.exports.PAGE_SLUGS = PAGE_SLUGS;
