# Lumin Guide — Deployment Guide

Architecture: **MongoDB Atlas** (database) → **Render** (backend API) → **Cloudflare Pages** (frontend/admin) → **Cloudflare R2** (file storage) → **UptimeRobot** (keep-alive)

---

## 1. MongoDB Atlas

### Create Cluster

1. Log in to [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Create Cluster** → choose **M0 Free Tier** (or M2/M5 for production)
3. Provider: **AWS** | Region: pick the one closest to your Render region (e.g. `us-west-2` for Oregon)
4. Cluster name: `lumin-guide`

### Create Database User

1. **Security → Database Access → Add New Database User**
2. Auth method: **Password**
3. Username: `lumin-api`
4. Auto-generate a strong password (N0Y0eVSA7SWT0x6M) — **copy it now**
5. Role: **Read and write to any database**

### Allow Network Access

1. **Security → Network Access → Add IP Address**
2. Click **Allow Access from Anywhere** (`0.0.0.0/0`) — required for Render's dynamic IPs
3. For production, use Render's static outbound IPs if you upgrade to a paid plan

### Get Connection String

1. **Deployment → Connect → Drivers**
2. Copy the URI. It looks like:
   ```
   mongodb+srv://lumin-api:<password>@lumin-guide.xxxxx.mongodb.net/lumin-guide?retryWrites=true&w=majority
   (mongodb+srv://lumin-api:N0Y0eVSA7SWT0x6M@lumin-guide.tr8nbgn.mongodb.net/?appName=lumin-guide)
   ```
3. Replace `<password>` with the password you copied earlier
4. The database name `lumin-guide` at the end of the path is what Mongoose will use

### Recommended Atlas Settings

- Enable **Backup** (even on free tier, daily snapshots are available)
- Create indexes on frequently queried fields (the app already uses `userId` refs)
- Set up **Atlas Alerts** for connection spikes

---

## 2. Render (Backend Deployment)

### Option A — Blueprint (Recommended)

1. Push your code to GitHub/GitLab (make sure `render.yaml` is in the repo root)
2. Render Dashboard → **New → Blueprint**
3. Connect your repo → Render auto-detects `render.yaml`
4. Fill in the `sync: false` env vars in the dashboard:
   - `MONGODB_URI` — the Atlas connection string from Step 1
   - `CORS_ORIGIN` — your Cloudflare Pages URL (e.g. `https://lumin-guide.pages.dev`)
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL`
5. Click **Apply** → deployment starts

### Option B — Manual Setup

1. Render Dashboard → **New → Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name:** `lumin-guide-api`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
4. **Environment → Add env vars** (same as above)
5. **Health Check Path:** `/api/health`
6. Click **Deploy**

### After Deployment

- Your API will be live at: `https://lumin-guide-api.onrender.com`
- Test: `curl https://lumin-guide-api.onrender.com/api/health`
- Expected: `{"ok":true}`

### Note on Free Tier

Render free tier spins down after 15 minutes of inactivity. The first request after spin-down takes ~30-50 seconds. UptimeRobot (Step 5) solves this.

---

## 3. Cloudflare R2 (File Storage)

### Create Bucket

1. Cloudflare Dashboard → **R2 Object Storage**
2. **Create Bucket**
3. Bucket name: `lumin-guide-assets`
4. Region: **Automatic** (or pick closest to your Render region)

### Enable Public Access

1. Click your bucket → **Settings → Public Access**
2. Enable **R2.dev subdomain** — you'll get a URL like `https://pub-abc123.r2.dev`
3. Copy this URL → use as `R2_PUBLIC_URL` in your env vars
4. (Optional) Set up a **custom domain** like `assets.luminapp.com`

### Create API Token

1. R2 → **Manage R2 API Tokens → Create API Token**
2. Permissions: **Object Read & Write**
3. Scope: Apply to `lumin-guide-assets` bucket only
4. Copy the **Access Key ID** and **Secret Access Key**
5. Set these as `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in Render

### Install SDK in Your Project

```bash
npm install @aws-sdk/client-s3
```

The R2 utility is already created at `utils/r2.js`. Use it in routes like:

```javascript
const { uploadFile } = require('../utils/r2');

// In a route handler:
const { url } = await uploadFile(fileBuffer, 'icon.png', 'icons');
// url → https://pub-abc123.r2.dev/icons/uuid.png
```

### CORS Policy (for direct browser uploads)

In your R2 bucket settings, add a CORS policy if your frontend will upload directly:

```json
[
  {
    "AllowedOrigins": ["https://lumin-guide.pages.dev"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 4. Cloudflare Pages (Frontend / Admin)

### When You're Ready to Build the Frontend

1. Create a frontend project (React, Next.js, Vue, etc.)
2. Push to GitHub

### Deploy to Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages → Create Application → Pages**
2. Connect your GitHub repo
3. Build settings (example for React/Vite):
   - **Framework preset:** `Vite` (or `Create React App`, `Next.js`, etc.)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist` (Vite) or `build` (CRA)
4. **Environment Variables:**
   - `VITE_API_URL` = `https://lumin-guide-api.onrender.com/api`
   (or `REACT_APP_API_URL` for CRA)
5. Click **Save and Deploy**

### Custom Domain (Optional)

1. Pages project → **Custom Domains → Set up a custom domain**
2. Enter: `app.luminapp.com` (or whatever you own)
3. Cloudflare auto-configures DNS if the domain is on Cloudflare

### Preview Deployments

Every push to a non-production branch gets a preview URL like:
`https://<commit-hash>.lumin-guide.pages.dev` — great for testing.

---

## 5. UptimeRobot (Keep-Alive for Render Free Tier)

1. Sign up at [uptimerobot.com](https://uptimerobot.com) (free plan = 50 monitors)
2. **Add New Monitor:**
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** `Lumin Guide API`
   - **URL:** `https://lumin-guide-api.onrender.com/api/health`
   - **Monitoring Interval:** 5 minutes
3. (Optional) Set up alert contacts for downtime notifications (email, Slack, etc.)

This pings your health endpoint every 5 minutes, preventing Render from spinning down.

---

## 6. Environment Variables — Quick Reference

| Variable | Where to Set | Example Value |
|---|---|---|
| `MONGODB_URI` | Render env vars | `mongodb+srv://lumin-api:pass@cluster.mongodb.net/lumin-guide` |
| `JWT_SECRET` | Render env vars | (auto-generated by blueprint, or set a 64-char random string) |
| `JWT_EXPIRES_IN` | Render env vars | `7d` |
| `PORT` | Render env vars | `3000` |
| `NODE_ENV` | Render env vars | `production` |
| `CORS_ORIGIN` | Render env vars | `https://lumin-guide.pages.dev` |
| `R2_ACCOUNT_ID` | Render env vars | Your Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Render env vars | From R2 API token |
| `R2_SECRET_ACCESS_KEY` | Render env vars | From R2 API token |
| `R2_BUCKET_NAME` | Render env vars | `lumin-guide-assets` |
| `R2_PUBLIC_URL` | Render env vars | `https://pub-xxxx.r2.dev` |
| `VITE_API_URL` | Cloudflare Pages env vars | `https://lumin-guide-api.onrender.com/api` |

---

## 7. Deployment Checklist

- [ ] MongoDB Atlas cluster created and connection string copied
- [ ] Atlas network access set to allow `0.0.0.0/0`
- [ ] Atlas database user created with read/write permissions
- [ ] Render web service deployed and passing health check
- [ ] All env vars set in Render dashboard
- [ ] `JWT_SECRET` is a strong, unique value (not the dev default)
- [ ] R2 bucket created with public access enabled
- [ ] R2 API token created and credentials added to Render
- [ ] `@aws-sdk/client-s3` installed in project
- [ ] CORS_ORIGIN set to your actual Cloudflare Pages domain
- [ ] UptimeRobot monitor active and pinging `/api/health`
- [ ] Test auth endpoints: register → login → access protected route
- [ ] Test R2 upload with a sample image

---

## 8. Useful Commands

```bash
# Generate a strong JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Test health endpoint
curl https://lumin-guide-api.onrender.com/api/health

# Test auth flow
curl -X POST https://lumin-guide-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"Test1234!"}'
```
