# Quick Backend Deployment Guide

## Problem
Your Vercel/Firebase frontend shows "NetworkError" because the backend isn't deployed yet.

## Solution Options

### Option 1: Use Local (Works Now ✅)
- Open **http://localhost:3000** in your browser
- Both frontend and backend are running locally
- Everything works perfectly!

### Option 2: Deploy Backend to Railway (Easiest)

Railway is simpler than Render and auto-detects Node.js:

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose `soy56/UniVote`
5. Railway will ask what to deploy - select the **backend** folder
6. Railway auto-detects Node.js and runs `npm install` + `node auth/server.js`
7. Add environment variables in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=4000
   JWT_SECRET=univote_secret_2024
   ```
8. Copy your Railway URL (e.g., `https://univote-production.up.railway.app`)

### Option 3: Manual Render Setup

1. When creating the service, **manually select "Node" from the Environment dropdown** (don't let it auto-detect)
2. Set Root Directory: `backend`
3. Build: `npm install`
4. Start: `node auth/server.js`
5. Add env vars

## After Backend URL is Live

Update frontend environment variables in Vercel:

```bash
# Set in Vercel Dashboard → Settings → Environment Variables
REACT_APP_AUTH_API_URL=<your-backend-url>
REACT_APP_API_URL=<your-backend-url>
```

Then redeploy:
```bash
cd frontend
vercel --prod
```

## Recommendation

**For now:** Use localhost (Option 1)  
**For production:** Use Railway (Option 2) - it's the easiest and most reliable
