/**
 * PDF Text Extraction & Chunking Script
 *
 * Extracts text from all astrology PDFs, splits into meaningful chunks,
 * auto-tags with topic categories, and stores in MongoDB.
 *
 * Usage:
 *   node scripts/extractAndChunkPDFs.js <path-to-pdf-folder>
 *
 * Example:
 *   node scripts/extractAndChunkPDFs.js ./pdfs
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');
const AstrologyChunk = require('../models/AstrologyChunk');

// ─── Configuration ───────────────────────────────────────────────────────────

const CHUNK_SIZE = 1500;       // target characters per chunk
const CHUNK_OVERLAP = 200;     // overlap between consecutive chunks
const MIN_CHUNK_SIZE = 100;    // skip very small chunks

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lumin-guide';

// ─── Custom PDF page renderer (fixes "Ran out of space in font private use area") ─
// The default renderer tries to map every glyph to a private-use Unicode codepoint.
// PDFs with many custom fonts exhaust that space. This renderer extracts raw text
// content items directly, bypassing the font-mapping issue entirely.

function customPageRender(pageData) {
  return pageData.getTextContent().then(function (textContent) {
    let lastY = null;
    let text = '';
    for (const item of textContent.items) {
      if (lastY !== null && lastY !== item.transform[5]) {
        text += '\n';
      }
      text += item.str;
      lastY = item.transform[5];
    }
    return text;
  });
}

const PDF_PARSE_OPTIONS = {
  pagerender: customPageRender,
  // Increase the max pages limit for large books
  max: 0, // 0 = no limit
};

// ─── Topic Detection ─────────────────────────────────────────────────────────

const TOPIC_PATTERNS = {
  transit_interpretation: [
    /\btransit/i, /\btransiting\b/i, /\bprogress(ed|ion)/i,
    /\bsolar return/i, /\blunar return/i, /\bretrograde\b/i,
  ],
  natal_interpretation: [
    /\bnatal\b/i, /\bbirth\s*chart/i, /\bradix/i, /\bnative\b/i,
  ],
  aspect_interpretation: [
    /\bconjunct(ion)?\b/i, /\bopposit(ion|e)\b/i, /\btrine\b/i,
    /\bsextile\b/i, /\bsquare\b/i, /\bquincunx\b/i, /\baspect/i,
    /\borb\b/i, /\bsemi-?sextile/i,
  ],
  house_meaning: [
    /\b(1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|11th|12th)\s*house/i,
    /\bhouse\s*(system|cusp|ruler)/i, /\bhous(e|es)\b/i,
    /\bmidheaven\b/i, /\bascendant\b/i, /\bMC\b/, /\bIC\b/,
  ],
  planet_meaning: [
    /\bsun\b/i, /\bmoon\b/i, /\bmercury\b/i, /\bvenus\b/i,
    /\bmars\b/i, /\bjupiter\b/i, /\bsaturn\b/i, /\buranus\b/i,
    /\bneptune\b/i, /\bpluto\b/i, /\bchiron\b/i,
    /\bnorth\s*node/i, /\bsouth\s*node/i,
  ],
  sign_meaning: [
    /\baries\b/i, /\btaurus\b/i, /\bgemini\b/i, /\bcancer\b/i,
    /\bleo\b/i, /\bvirgo\b/i, /\blibra\b/i, /\bscorpio\b/i,
    /\bsagittarius\b/i, /\bcapricorn\b/i, /\baquarius\b/i, /\bpisces\b/i,
  ],
  relationship_synastry: [
    /\bsynastry\b/i, /\bcomposit(e|ion)\b/i, /\brelationship/i,
    /\bcompatibil/i, /\bpartner/i, /\bkundali/i,
  ],
  predictive_technique: [
    /\bpredict(ive|ion)/i, /\bforecast/i, /\bdasha\b/i,
    /\bdirection/i, /\bprofect/i, /\beclipse/i,
  ],
  electional: [
    /\belectional/i, /\belect(ion|ing)\b/i, /\btiming\b/i,
    /\bmuhurta/i,
  ],
  vedic: [
    /\bvedic\b/i, /\bjyotish/i, /\bsidereal\b/i, /\bnakshatra/i,
    /\brashi\b/i, /\bgraha\b/i, /\blagna\b/i, /\bayanamsa/i,
    /\bnavamsa/i, /\bdivisional/i,
  ],
};

function detectCategory(text) {
  const scores = {};

  for (const [category, patterns] of Object.entries(TOPIC_PATTERNS)) {
    scores[category] = 0;
    for (const pattern of patterns) {
      const matches = text.match(new RegExp(pattern, 'gi'));
      if (matches) scores[category] += matches.length;
    }
  }

  // Get the top category
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] === 0) return { category: 'general_theory', topics: [] };

  const category = sorted[0][0];
  const topics = sorted
    .filter(([_, score]) => score > 0)
    .slice(0, 4)
    .map(([cat]) => cat.replace('_interpretation', '').replace('_meaning', '').replace('_technique', ''));

  return { category, topics };
}

// ─── Text Chunking ───────────────────────────────────────────────────────────

function chunkText(text, source) {
  const chunks = [];

  // Clean up the text
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')        // collapse excessive newlines
    .replace(/[ \t]{3,}/g, ' ')           // collapse excessive spaces
    .replace(/\f/g, '\n\n');              // form feeds -> double newline

  // Try to split on paragraph/section boundaries first
  const paragraphs = cleaned.split(/\n\n+/);
  let currentChunk = '';
  let approxPage = 1;
  let chunkStartPage = 1;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Track approximate page (rough heuristic: ~3000 chars per page)
    approxPage = Math.ceil(chunks.length * CHUNK_SIZE / 3000) + 1;

    if (currentChunk.length + trimmed.length + 2 <= CHUNK_SIZE) {
      if (currentChunk) currentChunk += '\n\n';
      else chunkStartPage = approxPage;
      currentChunk += trimmed;
    } else {
      // Save current chunk if it's big enough
      if (currentChunk.length >= MIN_CHUNK_SIZE) {
        const { category, topics } = detectCategory(currentChunk);
        chunks.push({
          source,
          text: currentChunk,
          pageStart: chunkStartPage,
          pageEnd: approxPage,
          category,
          topics,
        });
      }

      // Start new chunk with overlap
      if (currentChunk.length > CHUNK_OVERLAP) {
        // Take the last CHUNK_OVERLAP characters as overlap
        const overlapText = currentChunk.slice(-CHUNK_OVERLAP);
        currentChunk = overlapText + '\n\n' + trimmed;
      } else {
        currentChunk = trimmed;
      }
      chunkStartPage = approxPage;

      // If a single paragraph is larger than CHUNK_SIZE, split it
      while (currentChunk.length > CHUNK_SIZE) {
        const splitAt = currentChunk.lastIndexOf('. ', CHUNK_SIZE);
        const cutPoint = splitAt > CHUNK_SIZE * 0.5 ? splitAt + 1 : CHUNK_SIZE;
        const piece = currentChunk.slice(0, cutPoint).trim();

        if (piece.length >= MIN_CHUNK_SIZE) {
          const { category, topics } = detectCategory(piece);
          chunks.push({
            source,
            text: piece,
            pageStart: chunkStartPage,
            pageEnd: approxPage,
            category,
            topics,
          });
        }
        currentChunk = currentChunk.slice(cutPoint - CHUNK_OVERLAP).trim();
      }
    }
  }

  // Don't forget the last chunk
  if (currentChunk.length >= MIN_CHUNK_SIZE) {
    const { category, topics } = detectCategory(currentChunk);
    chunks.push({
      source,
      text: currentChunk,
      pageStart: chunkStartPage,
      pageEnd: approxPage,
      category,
      topics,
    });
  }

  return chunks;
}

// ─── PDF Processing ──────────────────────────────────────────────────────────

async function processPDF(filePath) {
  const fileName = path.basename(filePath, '.pdf');
  console.log(`\n📖 Processing: ${fileName}`);

  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer, PDF_PARSE_OPTIONS);

    console.log(`   Pages: ${data.numpages}, Text length: ${data.text.length} chars`);

    if (data.text.length < 500) {
      console.log(`   ⚠️  Very little text extracted (possibly scanned PDF). Skipping.`);
      return [];
    }

    const chunks = chunkText(data.text, fileName);
    console.log(`   ✅ Created ${chunks.length} chunks`);

    // Log category distribution
    const catCounts = {};
    for (const c of chunks) {
      catCounts[c.category] = (catCounts[c.category] || 0) + 1;
    }
    console.log(`   📊 Categories:`, catCounts);

    return chunks;
  } catch (err) {
    console.error(`   ❌ Error processing ${fileName}:`, err.message);
    return [];
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const pdfFolder = process.argv[2];
  if (!pdfFolder) {
    console.error('Usage: node scripts/extractAndChunkPDFs.js <path-to-pdf-folder>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(pdfFolder);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Folder not found: ${resolvedPath}`);
    process.exit(1);
  }

  // Find all PDFs
  const pdfFiles = fs.readdirSync(resolvedPath)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .map(f => path.join(resolvedPath, f));

  console.log(`Found ${pdfFiles.length} PDF files in ${resolvedPath}`);

  // Connect to MongoDB
  console.log('\nConnecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB:', mongoose.connection.db.databaseName);

  // Clear existing chunks (fresh import)
  const existingCount = await AstrologyChunk.countDocuments();
  if (existingCount > 0) {
    console.log(`\nClearing ${existingCount} existing chunks...`);
    await AstrologyChunk.deleteMany({});
  }

  // Process each PDF
  let totalChunks = 0;
  const allChunks = [];

  for (const pdfFile of pdfFiles) {
    const chunks = await processPDF(pdfFile);
    allChunks.push(...chunks);
    totalChunks += chunks.length;
  }

  // Bulk insert all chunks
  if (allChunks.length > 0) {
    console.log(`\n💾 Inserting ${allChunks.length} chunks into MongoDB...`);
    // Insert in batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);
      await AstrologyChunk.insertMany(batch);
      console.log(`   Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allChunks.length / BATCH_SIZE)}`);
    }
  }

  console.log(`\n✨ Done! Total chunks stored: ${totalChunks}`);
  console.log('\nNext step: Run "node scripts/generateEmbeddings.js" to generate vector embeddings.');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
