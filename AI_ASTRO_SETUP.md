# AI Astrology RAG Pipeline — Setup Guide

This document explains how to set up the AI-powered astrology chat that uses your 19 astrology PDF books as a knowledge base.

## Architecture Overview

```
User Question → Gemini Embedding → MongoDB Atlas Vector Search → Top 6 Chunks → Gemini 2.0 Flash → Personalized Response
```

1. **PDF Extraction** — Text is extracted from all 19 PDFs and split into ~1500-char chunks
2. **Embedding** — Each chunk gets a 768-dimensional vector from Gemini's `gemini-embedding-001` (reduced from 3072 to fit Atlas free tier)
3. **Storage** — Chunks + embeddings stored in MongoDB Atlas with a Vector Search index
4. **Retrieval** — When a user asks a question, the query is embedded and matched against stored chunks
5. **Generation** — Top matching chunks are fed to Gemini 2.0 Flash alongside the user's birth chart to generate a personalized reading

## Prerequisites

- MongoDB Atlas cluster (free tier works) with Vector Search enabled
- Google Gemini API key (get from https://aistudio.google.com/apikey)

## Step-by-Step Setup

### 1. Environment Variables

Add these to your `.env` file in the LuminBackend root:

```
GEMINI_API_KEY=your-gemini-api-key-here
MONGODB_URI=mongodb+srv://your-atlas-connection-string
```

For the frontend, add to `.env.local` in the Lumin root:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Place PDF Files

Copy all 19 astrology PDFs into a folder (e.g., `./pdfs/` inside LuminBackend, or any accessible path).

### 3. Extract & Chunk PDFs

```bash
npm run extract-pdfs ./path-to-your-pdf-folder
```

This will:
- Read all PDFs in the folder
- Extract text from each one
- Split text into ~1500-character chunks with 200-char overlap
- Auto-tag each chunk with topic categories (transits, aspects, houses, etc.)
- Store all chunks in MongoDB (`astrologychunks` collection)

Expected output: ~15,000+ chunks across 19 books.

### 4. Generate Embeddings

```bash
npm run generate-embeddings
```

This will:
- Read all chunks from MongoDB
- Send them to Gemini's embedding API in batches
- Store the 768-dimensional vectors back in MongoDB

This may take 2–3 hours on the free tier (~100 requests/min) for ~15,000 chunks. Use `--skip-existing` to resume if interrupted.

### 5. Create MongoDB Atlas Vector Search Index

Go to **MongoDB Atlas → Your Cluster → Atlas Search → Create Index**

- **Index Name:** `astrology_vector_index`
- **Collection:** `astrologychunks`
- **Type:** Atlas Vector Search

Use this JSON definition:

```json
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
```

Wait for the index to become "Active" (usually 1–2 minutes).

### 6. Start the Server

```bash
npm run dev
```

The AI Astro chat endpoint is now live at `POST /api/ai-astro/chat`.

### 7. Test It

You can check the knowledge base stats:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/ai-astro/stats
```

## API Reference

### POST /api/ai-astro/chat

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "message": "What does my Saturn in Capricorn mean for my career?",
  "chartData": {
    "planets": [...],
    "ascendant": {...},
    "houses": [...],
    "aspects": [...]
  },
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "reply": "Based on classical astrological texts...",
  "message": "What does my Saturn...",
  "sources": [
    { "source": "Planets-in-Transit...", "category": "transit_interpretation", "score": 0.87 }
  ]
}
```

### GET /api/ai-astro/stats

Returns knowledge base statistics (total chunks, embeddings status, category distribution, sources).

## Files Created/Modified

### New Files
- `models/AstrologyChunk.js` — MongoDB schema for knowledge chunks
- `scripts/extractAndChunkPDFs.js` — PDF extraction & chunking script
- `scripts/generateEmbeddings.js` — Gemini embedding generation script

### Modified Files
- `routes/aiAstro.js` — Replaced hardcoded response with full RAG pipeline
- `package.json` — Added new scripts and dependencies (`@google/generative-ai`, `pdf-parse`)

### Frontend Modified
- `src/components/AstroChat.tsx` — Now calls backend API with chart data, shows loading state, includes graceful fallback

## Troubleshooting

**"Vector search failed, falling back to text search"**
- Ensure the Atlas Vector Search index is created and active
- The system automatically falls back to MongoDB text search, so it still works

**"AI Astrology service is not configured"**
- Set `GEMINI_API_KEY` in your `.env` file

**Empty or poor responses**
- Check `GET /api/ai-astro/stats` to verify chunks are loaded
- Re-run `npm run generate-embeddings --skip-existing` if some embeddings failed
