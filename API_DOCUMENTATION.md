# Lumin Backend API Documentation

Base URL: `http://localhost:3000` (or your deployed server)

All authenticated endpoints require the `Authorization` header with a valid JWT.

---

## Authentication

Protected routes use Bearer token authentication.

| Header        | Value              | Required |
|---------------|--------------------|----------|
| `Authorization` | `Bearer <token>` | Yes (for protected routes) |
| `Content-Type`  | `application/json` | Yes (for POST/PATCH with body) |

---

## Health

### GET /api/health

Check server status. No auth required.

**Headers:** None required.

**Params:** None.

**Response (200):**
```json
{
  "ok": true
}
```

---

## Auth (`/api/auth`)
### POST /api/auth/register
Register a new user.
**Headers:**
| Header        | Value              |
|---------------|--------------------|
| `Content-Type` | `application/json` |

**Body (params):**
| Field      | Type   | Required | Description        |
|------------|--------|----------|--------------------|
| `fullName` | string | Yes      | User's full name   |
| `email`    | string | Yes      | Unique email       |
| `password` | string | Yes      | Password           |

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "ObjectId",
    "fullName": "string",
    "email": "string",
    "phone": "",
    "birthDate": "",
    "birthTime": "",
    "birthPlace": "",
    "birthCountry": "",
    "sunSign": "",
    "moonSign": "",
    "risingSign": "",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Error (400):** `{ "message": "Full name, email and password required" }` or `{ "message": "Email already registered" }`  
**Error (500):** `{ "message": "Registration failed" }`

---

### POST /api/auth/login
Login and get JWT.
**Headers:**
| Header        | Value              |
|---------------|--------------------|
| `Content-Type` | `application/json` |

**Body (params):**
| Field      | Type   | Required |
|------------|--------|----------|
| `email`    | string | Yes      |
| `password` | string | Yes      |

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "_id": "...", "fullName": "...", "email": "...", ... }
}
```

**Error (400):** `{ "message": "Email and password required" }`  
**Error (401):** `{ "message": "Invalid email or password" }`  
**Error (500):** `{ "message": "Login failed" }`

---

## Users (`/api/users`) — Auth required

### GET /api/users/me

Get current user profile.

**Headers:**
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer <token>`   |

**Params:** None.

**Response (200):**
```json
{
  "user": {
    "_id": "ObjectId",
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "birthDate": "string",
    "birthTime": "string",
    "birthPlace": "string",
    "birthCountry": "string",
    "sunSign": "string",
    "moonSign": "string",
    "risingSign": "string",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Error (401):** `{ "message": "Unauthorized" }` or `{ "message": "Invalid or expired token" }`  
**Error (500):** `{ "message": "..." }`

---

### PATCH /api/users/me

Update current user profile.

**Headers:**
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer <token>`   |
| `Content-Type`  | `application/json` |

**Body (params):** All optional.
| Field      | Type   | Description   |
|------------|--------|---------------|
| `fullName` | string | Display name  |
| `email`    | string | Email         |
| `phone`    | string | Phone number  |

**Response (200):**
```json
{
  "user": { "_id": "...", "fullName": "...", "email": "...", ... }
}
```

**Error (401/500):** Same as GET /api/users/me.

---

### PATCH /api/users/me/birth

Update birth data for current user.

**Headers:**
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer <token>`   |
| `Content-Type`  | `application/json` |

**Body (params):** All optional.
| Field          | Type   |
|----------------|--------|
| `dateOfBirth`  | string |
| `timeOfBirth`  | string |
| `placeOfBirth` | string |
| `country`      | string |

**Response (200):**
```json
{
  "user": { "_id": "...", "fullName": "...", "birthDate": "...", ... }
}
```

---

## Birth Chart (`/api`) — Auth required

### POST /api/birth-chart

Create or update birth chart for current user.

**Headers:**
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer <token>`   |
| `Content-Type`  | `application/json` |

**Body (params):** Optional; used for default chart if no stored chart.
| Field          | Type   |
|----------------|--------|
| `dateOfBirth`  | string |
| `timeOfBirth`  | string |
| `placeOfBirth` | string |

**Response (200):**
```json
{
  "date": "string",
  "time": "string",
  "place": "string",
  "bigThree": [
    { "label": "string", "sub": "string" }
  ],
  "chartPattern": "string",
  "dominantElement": "string",
  "dominantQuality": "string",
  "planets": [
    { "name": "string", "house": "string" }
  ],
  "houses": [
    { "house": "string", "meaning": "string" }
  ]
}
```

**Error (401/500):** Standard auth/server errors.

---

### GET /api/birth-chart

Get birth chart for current user (from DB or default from user birth data).

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**Params:** None.

**Response (200):** Same shape as POST /api/birth-chart response.

---

## Horoscope (`/api/horoscope`) — Auth required

### GET /api/horoscope/daily

Daily horoscope by sign.

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**Query params:**
| Param  | Type   | Required | Default     | Description        |
|--------|--------|----------|-------------|--------------------|
| `sign` | string | No       | user's sunSign or "aquarius" | Zodiac sign (e.g. aquarius, taurus) |

**Response (200):**
```json
{
  "sign": "aquarius",
  "text": "string",
  "date": "locale date string"
}
```

---

### GET /api/horoscope/weekly

Weekly horoscope by sign.

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**Query params:**
| Param  | Type   | Required | Default     |
|--------|--------|----------|-------------|
| `sign` | string | No       | user's sunSign or "aquarius" |

**Response (200):**
```json
{
  "love": "string",
  "career": "string",
  "health": "string",
  "keyDays": ["string"],
  "weekProgress": 4,
  "totalDays": 7
}
```

---

## Compatibility (`/api/compatibility`) — Auth required

### GET /api/compatibility/sign

Compatibility between two zodiac signs.

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**Query params:**
| Param         | Type   | Required | Default           |
|---------------|--------|----------|-------------------|
| `mySign`      | string | No       | user's sunSign or "Aquarius" |
| `partnerSign` | string | No       | "Taurus"           |

**Response (200):**
```json
{
  "matchPercent": 78,
  "strengths": ["string"],
  "challenges": ["string"],
  "advice": "string"
}
```

---

### POST /api/compatibility/chart

Compatibility by birth data (currently uses fixed signs in implementation).

**Headers:**
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer <token>`   |
| `Content-Type`  | `application/json` |

**Body (params):**
| Field         | Type | Description      |
|---------------|------|------------------|
| `myBirth`     | any  | Optional         |
| `partnerBirth`| any  | Optional         |

**Response (200):** Same as GET /api/compatibility/sign.

---

## Affirmations (`/api/affirmations`) — Auth required

### GET /api/affirmations

List all affirmations.

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**Params:** None.

**Response (200):**
```json
[
  { "text": "string", "theme": "string" }
]
```

---

### GET /api/affirmations/daily

Daily affirmation (rotates by date).

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**Params:** None.

**Response (200):**
```json
{
  "text": "string",
  "theme": "string"
}
```

---

## Spiritual (`/api/spiritual`) — Auth required

Data for the **Spiritual Elements** screen (Herbs & Crystals). Fetched from DB; admin manages via `/api/admin/spiritual-elements`.

### GET /api/spiritual/herbs

List herbs, optionally filtered by search (name, description, or tag).

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**Query params:**
| Param   | Type   | Required | Description        |
|---------|--------|----------|--------------------|
| `search`| string | No       | Filter by name/description/tag |

**Response (200):**
```json
[
  {
    "_id": "ObjectId",
    "name": "string",
    "tag": "string",
    "description": "string",
    "iconUrl": "string"
  }
]
```

---

### GET /api/spiritual/crystals

List crystals, optionally filtered by search (name, description, or tag).

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**Query params:**
| Param   | Type   | Required |
|---------|--------|----------|
| `search`| string | No       |

**Response (200):**
```json
[
  {
    "_id": "ObjectId",
    "name": "string",
    "tag": "string",
    "description": "string",
    "iconUrl": "string"
  }
]
```

---

### GET /api/spiritual/:id

Get a single spiritual element (herb or crystal) by id.

**Headers:** `Authorization: Bearer <token>`

**URL params:** `id` — Spiritual element ObjectId

**Response (200):**
```json
{
  "_id": "ObjectId",
  "name": "string",
  "type": "herb",
  "tag": "string",
  "description": "string",
  "iconUrl": "string"
}
```

**Error (404):** `{ "message": "Not found" }`

---

## Community (`/api/community`) — Auth required

### GET /api/community/posts

List recent posts (up to 50).

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**Params:** None.

**Response (200):**
```json
[
  {
    "_id": "ObjectId",
    "title": "string",
    "body": "string",
    "author": "string",
    "timeAgo": "string",
    "likes": 0,
    "comments": 0
  }
]
```

---

### GET /api/community/posts/:id

Get a single post with comments.

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**URL params:**
| Param | Description   |
|-------|---------------|
| `id`  | Post ObjectId |

**Response (200):**
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "title": "string",
  "body": "string",
  "author": "string",
  "likes": 0,
  "likedBy": [],
  "createdAt": "ISO date",
  "updatedAt": "ISO date",
  "timeAgo": "string",
  "comments": [
    {
      "userId": "ObjectId",
      "author": "string",
      "text": "string",
      "timeAgo": "string",
      "createdAt": "ISO date"
    }
  ]
}
```

**Error (404):** `{ "message": "Post not found" }`

---

### POST /api/community/posts

Create a new post.

**Headers:**
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer <token>`   |
| `Content-Type`  | `application/json` |

**Body (params):**
| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| `title` | string | Yes      | Post title  |
| `body`  | string | No       | Post body   |

**Response (201):**
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "title": "string",
  "body": "string",
  "author": "string",
  "likes": 0,
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

**Error (400):** `{ "message": "Title required" }`

---

### POST /api/community/posts/:id/like

Toggle like on a post.

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**URL params:**
| Param | Description   |
|-------|---------------|
| `id`  | Post ObjectId |

**Body:** None required.

**Response (200):**
```json
{
  "likes": 5
}
```

**Error (404):** `{ "message": "Post not found" }`

---

### POST /api/community/posts/:id/comments

Add a comment to a post.

**Headers:**
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer <token>`   |
| `Content-Type`  | `application/json` |

**URL params:**
| Param | Description   |
|-------|---------------|
| `id`  | Post ObjectId |

**Body (params):**
| Field  | Type   | Required | Description |
|--------|--------|----------|-------------|
| `text` | string | Yes      | Comment text (non-empty) |

**Response (201):**
```json
{
  "userId": "ObjectId",
  "author": "string",
  "text": "string",
  "timeAgo": "Just now"
}
```

**Error (400):** `{ "message": "Text required" }`  
**Error (404):** `{ "message": "Post not found" }`

---

## AI Astro (`/api/ai-astro`) — Auth required

### POST /api/ai-astro/chat

Send a message and get an astro-style reply (placeholder response).

**Headers:**
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer <token>`   |
| `Content-Type`  | `application/json` |

**Body (params):**
| Field     | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `message` | string | Yes      | User message |

**Response (200):**
```json
{
  "reply": "string",
  "message": "string"
}
```

---

## Cosmic (`/api/cosmic`) — Auth required

### GET /api/cosmic/feed

Cosmic feed items.

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**Params:** None.

**Response (200):**
```json
[
  {
    "title": "string",
    "body": "string",
    "timeAgo": "string"
  }
]
```

---

### GET /api/cosmic/today

Today's cosmic info (lucky color, number).

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**Params:** None.

**Response (200):**
```json
{
  "luckyColor": "string",
  "luckyNumber": "string"
}
```

---

## Journal (`/api/journal`) — Auth required

### GET /api/journal

List all journal entries for current user (newest first).

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**Params:** None.

**Response (200):**
```json
[
  {
    "_id": "ObjectId",
    "userId": "ObjectId",
    "title": "string",
    "body": "string",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
]
```

---

### POST /api/journal

Create a journal entry.

**Headers:**
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer <token>`   |
| `Content-Type`  | `application/json` |

**Body (params):**
| Field   | Type   | Required | Default    |
|---------|--------|----------|------------|
| `title` | string | No       | "Untitled" |
| `body`  | string | No       | ""         |

**Response (201):**
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "title": "string",
  "body": "string",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

---

### PATCH /api/journal/:id

Update a journal entry (only own entries).

**Headers:**
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer <token>`   |
| `Content-Type`  | `application/json` |

**URL params:**
| Param | Description      |
|-------|------------------|
| `id`  | Journal entry Id |

**Body (params):** Any of `title`, `body` to update.

**Response (200):** Updated journal entry object.

**Error (404):** `{ "message": "Not found" }`

---

### DELETE /api/journal/:id

Delete a journal entry (only own entries).

**Headers:**
| Header          | Value            |
|-----------------|------------------|
| `Authorization` | `Bearer <token>` |

**URL params:**
| Param | Description      |
|-------|------------------|
| `id`  | Journal entry Id |

**Response (200):**
```json
{
  "ok": true
}
```

**Error (404):** `{ "message": "Not found" }`

---

## Pages (`/api/pages`) — Public (no auth)

Content for **Help & Support**, **Privacy Policy**, and **Terms of Service** screens. Users fetch data from these endpoints.

### GET /api/pages/:slug

Get page content by slug. **No authentication required.**

**Headers:** None required.

**URL params:**
| Param  | Values                                      | Description        |
|--------|---------------------------------------------|--------------------|
| `slug` | `help-support`, `privacy-policy`, `terms-of-service` | Page identifier |

**Response (200) — help-support:**
```json
{
  "slug": "help-support",
  "title": "Help & Support",
  "content": "Optional intro text (HTML or plain).",
  "faqs": [
    { "_id": "ObjectId", "question": "string", "answer": "string", "order": 0 }
  ]
}
```

**Response (200) — privacy-policy or terms-of-service:**
```json
{
  "slug": "privacy-policy",
  "title": "Privacy Policy",
  "content": "Full page content (HTML or plain text)."
}
```

**Error (400):** `{ "message": "Invalid page slug" }`  
**Error (500):** `{ "message": "..." }`

---

## Admin (`/api/admin`) — Auth required

Endpoints for admin to save and manage content for **Help & Support**, **Privacy Policy**, and **Terms of Service**. All require `Authorization: Bearer <token>`.

### PUT /api/admin/pages/:slug

Create or update page content (title and/or body).

**Headers:**
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer <token>`   |
| `Content-Type`  | `application/json` |

**URL params:**
| Param  | Values                                      |
|--------|---------------------------------------------|
| `slug` | `help-support`, `privacy-policy`, `terms-of-service` |

**Body (params):**
| Field    | Type   | Required | Description        |
|----------|--------|----------|--------------------|
| `title`  | string | No       | Page title         |
| `content`| string | No       | Page body (HTML/text) |

**Response (200):**
```json
{
  "_id": "ObjectId",
  "slug": "privacy_policy",
  "title": "Privacy Policy",
  "content": "...",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

**Error (400):** `{ "message": "Invalid page slug. Use: help-support, privacy-policy, terms-of-service" }`

---

### GET /api/admin/pages

List all saved page contents (for admin UI).

**Headers:** `Authorization: Bearer <token>`

**Params:** None.

**Response (200):**
```json
[
  { "_id": "...", "slug": "help_support", "title": "...", "content": "...", "createdAt": "...", "updatedAt": "..." },
  { "_id": "...", "slug": "privacy_policy", "title": "...", "content": "...", "createdAt": "...", "updatedAt": "..." },
  { "_id": "...", "slug": "terms_of_service", "title": "...", "content": "...", "createdAt": "...", "updatedAt": "..." }
]
```

---

### GET /api/admin/faqs

List all FAQ items (for Help & Support screen).

**Headers:** `Authorization: Bearer <token>`

**Params:** None.

**Response (200):**
```json
[
  { "_id": "ObjectId", "question": "string", "answer": "string", "order": 0, "createdAt": "...", "updatedAt": "..." }
]
```

---

### POST /api/admin/faqs

Create a new FAQ item.

**Headers:**
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer <token>`   |
| `Content-Type`  | `application/json` |

**Body (params):**
| Field     | Type   | Required | Description   |
|-----------|--------|----------|---------------|
| `question`| string | Yes      | FAQ question  |
| `answer`  | string | Yes      | FAQ answer    |
| `order`   | number | No       | Sort order (default 0) |

**Response (201):**
```json
{
  "_id": "ObjectId",
  "question": "string",
  "answer": "string",
  "order": 0,
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

**Error (400):** `{ "message": "question and answer required" }`

---

### PATCH /api/admin/faqs/:id

Update an FAQ item.

**Headers:**
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer <token>`   |
| `Content-Type`  | `application/json` |

**URL params:** `id` — FAQ ObjectId

**Body (params):** Any of `question`, `answer`, `order`.

**Response (200):** Updated FAQ object.

**Error (404):** `{ "message": "FAQ not found" }`

---

### DELETE /api/admin/faqs/:id

Delete an FAQ item.

**Headers:** `Authorization: Bearer <token>`

**URL params:** `id` — FAQ ObjectId

**Response (200):** `{ "ok": true }`

**Error (404):** `{ "message": "FAQ not found" }`

---

### Spiritual Elements (Herbs & Crystals)

#### GET /api/admin/spiritual-elements

List all spiritual elements (herbs and crystals). Optional filters: `type`, `search`.

**Headers:** `Authorization: Bearer <token>`

**Query params:**
| Param   | Type   | Required | Description                    |
|---------|--------|----------|--------------------------------|
| `type`  | string | No       | `herb` or `crystal`            |
| `search`| string | No       | Search name, description, tag  |

**Response (200):** Array of spiritual element objects (full fields including `_id`, `name`, `type`, `tag`, `description`, `iconUrl`, `order`, `createdAt`, `updatedAt`).

---

#### GET /api/admin/spiritual-elements/:id

Get one spiritual element by id.

**Headers:** `Authorization: Bearer <token>`

**Response (200):** Single spiritual element object.

**Error (404):** `{ "message": "Spiritual element not found" }`

---

#### POST /api/admin/spiritual-elements

Create a herb or crystal.

**Headers:**
| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer <token>`   |
| `Content-Type`  | `application/json` |

**Body (params):**
| Field       | Type   | Required | Description                          |
|-------------|--------|----------|--------------------------------------|
| `name`      | string | Yes      | e.g. "Amethyst", "Lavender"           |
| `type`      | string | Yes      | `herb` or `crystal`                  |
| `description` | string | Yes    | Short description for the list       |
| `tag`       | string | No       | Badge label (e.g. "Healing", "Energy")|
| `iconUrl`   | string | No       | URL for icon image                   |
| `order`     | number | No       | Sort order (default 0)                |

**Response (201):** Created spiritual element object.

**Error (400):** `{ "message": "name, type (herb|crystal), and description required" }` or `{ "message": "type must be herb or crystal" }`

---

#### PATCH /api/admin/spiritual-elements/:id

Update a spiritual element.

**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**URL params:** `id` — Spiritual element ObjectId

**Body (params):** Any of `name`, `type`, `description`, `tag`, `iconUrl`, `order`.

**Response (200):** Updated spiritual element object.

**Error (400):** `{ "message": "type must be herb or crystal" }`  
**Error (404):** `{ "message": "Spiritual element not found" }`

---

#### DELETE /api/admin/spiritual-elements/:id

Delete a spiritual element.

**Headers:** `Authorization: Bearer <token>`

**URL params:** `id` — Spiritual element ObjectId

**Response (200):** `{ "ok": true }`

**Error (404):** `{ "message": "Spiritual element not found" }`

---

## Common error responses

| Status | When |
|--------|------|
| 400 | Bad request (missing/invalid body or params) |
| 401 | Missing/invalid/expired `Authorization` or token |
| 404 | Resource not found |
| 500 | Server error; body: `{ "message": "..." }` |

All error responses use JSON: `{ "message": "string" }`.
