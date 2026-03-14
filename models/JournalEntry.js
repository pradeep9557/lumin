const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Untitled' },
  body: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('JournalEntry', journalSchema);
