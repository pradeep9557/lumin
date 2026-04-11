/**
 * Embedding Generation Script
 *
 * Generates vector embeddings for all astrology chunks using
 * Google Gemini's embedding API, then stores them in MongoDB.
 *
 * Uses single requests with adaptive rate limiting to stay within free tier.
 *
 * Usage:
 *   node scripts/generateEmbeddings.js
 *   node scripts/generateEmbeddings.js --skip-existing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const AstrologyChunk = require('../models/AstrologyChunk');

// ─── Configuration ───────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lumin-guide';
const SKIP_EXISTING = process.argv.includes('--skip-existing');
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;  // Reduced from 3072 to fit Atlas free tier (512MB)

// Rate limiting — with billing enabled, Gemini allows ~1500 RPM for embeddings
// Using batch API: 100 items per batch call, 200ms between batches = ~500/min safe
const BATCH_SIZE = 100;          // items per batchEmbedContents call
const MIN_DELAY_MS = 200;       // delay between batch calls (with billing)
const MAX_DELAY_MS = 10000;     // slow down on pressure
const SAVE_BATCH_SIZE = 100;    // bulk-save to MongoDB

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is required.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to:', mongoose.connection.db.databaseName);

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

  const query = SKIP_EXISTING ? { embedding: { $exists: false } } : {};
  const totalChunks = await AstrologyChunk.countDocuments(query);
  console.log(`\nFound ${totalChunks} chunks to embed${SKIP_EXISTING ? ' (skipping existing)' : ''}\n`);

  if (totalChunks === 0) {
    console.log('Nothing to do!');
    await mongoose.disconnect();
    return;
  }

  let processed = 0;
  let errors = 0;
  let currentDelay = MIN_DELAY_MS;
  let bulkOps = [];
  const startTime = Date.now();

  // Use pagination instead of a long-lived cursor to avoid
  // MongoDB "cursor not found" errors (cursors expire after 10 min)
  const PAGE_SIZE = 500;
  let lastId = null;
  let hasMore = true;

  while (hasMore) {
    // Fetch a page of chunk IDs + text
    const pageQuery = { ...query };
    if (lastId) pageQuery._id = { ...pageQuery._id, $gt: lastId };

    const page = await AstrologyChunk.find(pageQuery)
      .sort({ _id: 1 })
      .limit(PAGE_SIZE)
      .select('_id text')
      .lean();

    if (page.length === 0) {
      hasMore = false;
      break;
    }

    lastId = page[page.length - 1]._id;
    if (page.length < PAGE_SIZE) hasMore = false;

    // Process page in batches of BATCH_SIZE using batchEmbedContents
    for (let i = 0; i < page.length; i += BATCH_SIZE) {
      const batch = page.slice(i, i + BATCH_SIZE);
      let batchSuccess = 0;

      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          const result = await embeddingModel.batchEmbedContents({
            requests: batch.map(chunk => ({
              content: { parts: [{ text: chunk.text.slice(0, 2048) }] },
              taskType: 'RETRIEVAL_DOCUMENT',
              outputDimensionality: EMBEDDING_DIMENSIONS,
            })),
          });

          for (let j = 0; j < batch.length; j++) {
            if (result.embeddings[j]) {
              bulkOps.push({
                updateOne: {
                  filter: { _id: batch[j]._id },
                  update: { $set: { embedding: result.embeddings[j].values } },
                },
              });
              batchSuccess++;
            } else {
              errors++;
            }
          }
          currentDelay = Math.max(MIN_DELAY_MS, currentDelay - 50);
          break;
        } catch (err) {
          if (err.message.includes('429')) {
            const retryMatch = err.message.match(/retry in ([\d.]+)s/i);
            const waitSec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) + 5 : 30 * attempt;
            console.log(`   ⏳ Rate limited (attempt ${attempt}/5). Waiting ${waitSec}s...`);
            await sleep(waitSec * 1000);
            currentDelay = Math.min(MAX_DELAY_MS, currentDelay + 1000);
          } else {
            console.error(`   ❌ Batch error (attempt ${attempt}): ${err.message.slice(0, 120)}`);
            if (attempt === 5) { errors += batch.length; break; }
            await sleep(5000);
          }
        }
      }

      processed += batchSuccess;

      // Bulk save to MongoDB periodically
      if (bulkOps.length >= SAVE_BATCH_SIZE) {
        await AstrologyChunk.bulkWrite(bulkOps);
        bulkOps = [];
      }

      // Progress logging every batch
      const pct = ((processed + errors) / totalChunks * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
      const rate = (processed / (Date.now() - startTime) * 60000).toFixed(0);
      const eta = rate > 0 ? ((totalChunks - processed - errors) / rate).toFixed(0) : '?';
      console.log(`Progress: ${processed + errors}/${totalChunks} (${pct}%) | ${errors} errors | ${rate}/min | ETA: ${eta} min`);

      // Pace between batches
      await sleep(currentDelay);
    }
  }

  // Save remaining
  if (bulkOps.length > 0) {
    await AstrologyChunk.bulkWrite(bulkOps);
  }

  const totalMin = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n✨ Done! Embedded ${processed} chunks (${errors} errors) in ${totalMin} minutes`);
  console.log('\n' + '='.repeat(60));
  console.log('NEXT STEP: Create a MongoDB Atlas Vector Search Index');
  console.log('='.repeat(60));
  console.log(`
Index name: "astrology_vector_index"
Collection: "astrologychunks"

{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "category"
    },
    {
      "type": "filter",
      "path": "topics"
    }
  ]
}
`);

  await mongoose.disconnect();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
