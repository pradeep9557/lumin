# MongoDB Collections (Lumin Backend)

**Database name:** Set in `.env` as `MONGODB_URI` (e.g. `mongodb://192.168.2.2:27017/lumin` → database **lumin**)

Mongoose uses the **pluralized, lowercased** model name as the collection name by default. Create these collections in your database:

| # | Collection Name   | Model File      | Description                    |
|---|-------------------|-----------------|--------------------------------|
| 1 | `users`           | `models/User.js`        | User accounts (auth, profile, birth data) |
| 2 | `birthcharts`     | `models/BirthChart.js`  | Birth chart data per user      |
| 3 | `posts`           | `models/Post.js`        | Community posts (comments embedded) |
| 4 | `journalentries`  | `models/JournalEntry.js`| User journal entries           |
| 5 | `pagecontents`    | `models/PageContent.js` | Help, Privacy Policy, Terms (one doc per slug) |
| 6 | `faqs`            | `models/Faq.js`        | FAQ items for Help & Support   |
| 7 | `spiritualelements`| `models/SpiritualElement.js` | Herbs & crystals (Spiritual Elements screen) |

---

## Quick reference (names only)

```
users
birthcharts
posts
journalentries
pagecontents
faqs
spiritualelements
```

---

## Notes

- **Creating collections:** In MongoDB, you don’t have to create collections in advance. They are created when the first document is inserted. If you still want to create them explicitly (e.g. in MongoDB Compass or shell), use the names above.
- **Indexes:** Consider creating indexes for:
  - **users:** unique index on `email`
  - **birthcharts:** index on `userId` (for lookups by user)
  - **posts:** index on `createdAt` (for sorted listing)
  - **journalentries:** index on `userId` and optionally `createdAt`
- **pagecontents:** unique index on `slug`
- **faqs:** index on `order` (for sorted listing)
- **spiritualelements:** index on `type` and `order` (for tab + sort)
- **Comments** are stored as subdocuments inside the `posts` collection (no separate collection).
