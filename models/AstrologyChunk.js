const mongoose = require('mongoose');

const astrologyChunkSchema = new mongoose.Schema({
  // Source PDF info
  source: {
    type: String,
    required: true,
    index: true,
  },
  pageStart: {
    type: Number,
  },
  pageEnd: {
    type: Number,
  },

  // The actual text chunk
  text: {
    type: String,
    required: true,
  },

  // Topic tags for filtering (e.g., "transit", "natal", "aspect", "house", "vedic")
  topics: [{
    type: String,
    index: true,
  }],

  // Category for structured retrieval
  category: {
    type: String,
    enum: [
      'natal_interpretation',
      'transit_interpretation',
      'aspect_interpretation',
      'house_meaning',
      'planet_meaning',
      'sign_meaning',
      'predictive_technique',
      'relationship_synastry',
      'electional',
      'general_theory',
      'vedic',
    ],
    index: true,
  },

  // Vector embedding from Gemini embedding API
  embedding: {
    type: [Number],
    default: undefined,
  },
}, {
  timestamps: true,
});

// Text index for basic keyword search (fallback when vector search is not available)
astrologyChunkSchema.index({ text: 'text', source: 'text' });

module.exports = mongoose.model('AstrologyChunk', astrologyChunkSchema);
