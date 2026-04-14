const express = require('express');
const { auth } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const AstrologyChunk = require('../models/AstrologyChunk');

const router = express.Router();

// ─── Initialize Gemini ───────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;
let chatModel = null;
let embeddingModel = null;

// Chat model fallback chain: try 2.5-flash first, then 2.5-flash-lite
const CHAT_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
let chatModels = [];

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  chatModels = CHAT_MODELS.map(m => genAI.getGenerativeModel({ model: m }));
  chatModel = chatModels[0];
  embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
}

// Helper: try chat models in order (handles 503 high-demand errors)
async function generateWithFallback(prompt) {
  for (let i = 0; i < chatModels.length; i++) {
    try {
      const result = await chatModels[i].generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.warn(`Model ${CHAT_MODELS[i]} failed: ${err.status || err.message?.slice(0, 60)}`);
      if (i === chatModels.length - 1) throw err; // last model, re-throw
    }
  }
}

// ─── Vector Search Helper ────────────────────────────────────────────────────

async function searchByVector(queryEmbedding, filter = {}, limit = 6) {
  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: 'astrology_vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: limit * 10,
          limit: limit,
        },
      },
      {
        $project: {
          text: 1,
          source: 1,
          category: 1,
          topics: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ];

    const results = await AstrologyChunk.aggregate(pipeline);
    return results;
  } catch (err) {
    console.error('Vector search failed, falling back to text search:', err.message);
    return null;
  }
}

// ─── Text Search Fallback ────────────────────────────────────────────────────

async function searchByText(query, limit = 6) {
  try {
    const results = await AstrologyChunk
      .find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();

    return results;
  } catch (err) {
    console.error('Text search failed:', err.message);
    return [];
  }
}

// ─── Smart Query Analyzer ────────────────────────────────────────────────────

function analyzeQuery(message, chartData) {
  const q = message.toLowerCase();
  const filters = {};
  const contextParts = [];

  // Detect if asking about transits
  if (/transit|current|now|today|this (week|month|year)|forecast|predict/i.test(q)) {
    filters.category = 'transit_interpretation';
    contextParts.push('Focus on transit interpretations and predictions.');
  }

  // Detect if asking about relationships
  if (/love|relationship|partner|marriage|compatibility|synastry|composite/i.test(q)) {
    filters.category = { $in: ['relationship_synastry', 'natal_interpretation'] };
    contextParts.push('Focus on relationship and compatibility analysis.');
  }

  // Detect specific planet queries
  const planetMatches = q.match(/\b(sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|chiron|rahu|ketu)\b/gi);
  if (planetMatches) {
    contextParts.push(`User is asking about: ${[...new Set(planetMatches)].join(', ')}`);
  }

  // Detect specific sign queries
  const signMatches = q.match(/\b(aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)\b/gi);
  if (signMatches) {
    contextParts.push(`Signs mentioned: ${[...new Set(signMatches)].join(', ')}`);
  }

  // Detect aspect queries
  if (/conjunct|opposition|trine|sextile|square|aspect/i.test(q)) {
    contextParts.push('User is asking about planetary aspects.');
  }

  // Detect house queries
  const houseMatch = q.match(/\b(1st|2nd|3rd|4th|5th|6th|7th|8th|9th|10th|11th|12th)\s*house/i);
  if (houseMatch) {
    contextParts.push(`User is asking about the ${houseMatch[0]}.`);
  }

  // Add chart context if available
  if (chartData) {
    contextParts.push(`User's birth chart data:\n${JSON.stringify(chartData, null, 2)}`);
  }

  return { filters, contextHints: contextParts.join('\n') };
}

// ─── Build Gemini Prompt ─────────────────────────────────────────────────────

function buildPrompt(userMessage, retrievedChunks, contextHints, conversationHistory, birthData) {
  const bookKnowledge = retrievedChunks
    .map((c, i) => `[Source ${i + 1}: "${c.source}" — ${c.category}]\n${c.text}`)
    .join('\n\n---\n\n');

  const historyText = conversationHistory
    .slice(-6)  // last 3 exchanges
    .map(m => `${m.role === 'user' ? 'User' : 'Astrologer'}: ${m.content}`)
    .join('\n');

  // Build birth data context for personalized predictions
  let birthContext = '';
  if (birthData && birthData.dateOfBirth) {
    const dob = new Date(birthData.dateOfBirth);
    const readingFor = birthData.readingFor === 'self'
      ? 'the user themselves'
      : `the user's ${birthData.readingFor}`;

    birthContext = `\nBIRTH DATA (this reading is for ${readingFor}):
- Date of Birth: ${dob.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;

    if (birthData.timeOfBirth) {
      birthContext += `\n- Time of Birth: ${birthData.timeOfBirth}`;
    }
    if (birthData.placeOfBirth) {
      birthContext += `\n- Place of Birth: ${birthData.placeOfBirth}`;
    }

    // Calculate approximate sun sign from DOB
    const month = dob.getMonth() + 1;
    const day = dob.getDate();
    const sunSign = getSunSignFromDate(month, day);
    birthContext += `\n- Approximate Sun Sign: ${sunSign}`;
    birthContext += `\n\nIMPORTANT: Use this birth data to calculate planetary positions and give SPECIFIC, PERSONALIZED predictions. Reference their sun sign, possible moon sign tendencies, and current transits affecting their chart. Do NOT give generic answers — tailor everything to this person's birth chart.\n`;
  }

  return `You are an expert Vedic and Western astrologer with deep knowledge from classical and modern astrological texts. You provide insightful, nuanced, and personalized readings.

IMPORTANT GUIDELINES:
- Ground your interpretations in the reference material provided below
- Blend Western (Tropical) and Vedic (Sidereal) perspectives when relevant
- Be specific and detailed — reference actual planetary positions based on the person's birth data
- Use proper astrological terminology but explain complex concepts
- Be empathetic and constructive, especially with challenging aspects
- If the reference material doesn't cover the exact topic, use your general astrology knowledge but note this
- Never make definitive claims about health, legal, or financial outcomes
- Format your response with clear structure using bold and bullet points when helpful
- Keep responses conversational but substantive (300-600 words ideal)
- ALWAYS personalize the reading based on birth data when provided
${birthContext}
${contextHints ? `\nCONTEXT:\n${contextHints}\n` : ''}
${historyText ? `\nCONVERSATION HISTORY:\n${historyText}\n` : ''}

REFERENCE MATERIAL FROM ASTROLOGY TEXTS:
${bookKnowledge || 'No specific reference material found for this query.'}

USER'S QUESTION: ${userMessage}

Provide a detailed, personalized astrological interpretation:`;
}

// Helper: get approximate sun sign from month/day
function getSunSignFromDate(month, day) {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

// ─── Chat Endpoint ───────────────────────────────────────────────────────────

router.post('/chat', auth, async (req, res) => {
  try {
    const { message, chartData, birthData, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if Gemini is configured
    if (!genAI) {
      return res.status(503).json({
        reply: 'AI Astrology service is not configured. Please set GEMINI_API_KEY in the server environment.',
        message,
      });
    }

    // 1. Analyze the query (merge birthData into chartData for compatibility)
    const mergedChartData = chartData || {};
    if (birthData) {
      mergedChartData.birthData = birthData;
    }
    const { filters, contextHints } = analyzeQuery(message, mergedChartData);

    // 2. Generate embedding for the user's query
    let retrievedChunks = [];
    try {
      const embeddingResult = await embeddingModel.embedContent({
        content: { parts: [{ text: message }] },
        taskType: 'RETRIEVAL_QUERY',
        outputDimensionality: 768,
      });
      const queryEmbedding = embeddingResult.embedding.values;

      // 3. Search for relevant chunks via vector search
      const vectorResults = await searchByVector(queryEmbedding, filters, 6);

      if (vectorResults && vectorResults.length > 0) {
        retrievedChunks = vectorResults;
      } else {
        // Fallback to text search
        retrievedChunks = await searchByText(message, 6);
      }
    } catch (embErr) {
      console.error('Embedding/search error:', embErr.message);
      // Fallback to text search
      retrievedChunks = await searchByText(message, 6);
    }

    // 4. Build prompt with retrieved context and birth data
    const prompt = buildPrompt(message, retrievedChunks, contextHints, conversationHistory, birthData);

    // 5. Generate response from Gemini (with fallback models)
    const reply = await generateWithFallback(prompt);

    // 6. Return response with metadata
    res.json({
      reply,
      message,
      sources: retrievedChunks.map(c => ({
        source: c.source,
        category: c.category,
        score: c.score,
      })),
    });
  } catch (err) {
    console.error('AI Astro chat error:', err);
    res.status(500).json({
      reply: 'I encountered an issue generating your reading. Please try again in a moment.',
      error: err.message,
    });
  }
});

// ─── Knowledge Stats Endpoint ────────────────────────────────────────────────

router.get('/stats', auth, async (req, res) => {
  try {
    const total = await AstrologyChunk.countDocuments();
    const withEmbeddings = await AstrologyChunk.countDocuments({ embedding: { $exists: true, $ne: [] } });
    const categories = await AstrologyChunk.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const sources = await AstrologyChunk.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalChunks: total,
      chunksWithEmbeddings: withEmbeddings,
      categories,
      sources,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
