# Backend Deployment Guide

## Frontend Deployed ✅
**URL:** https://frontend-izyemzazq-soy56s-projects.vercel.app

## Deploy Backend to Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)

### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository OR upload the backend folder
3. Configure as follows:

**Settings:**
- **Name:** `univote-backend` (or any name you prefer)
- **Root Directory:** `backend`
- **Environment:** `Node`
- **Region:** Choose closest to your users
- **Branch:** `main` (or your default branch)

**Build & Deploy:**
- **Build Command:** `npm install`
- **Start Command:** `node auth/server.js`

**Plan:**
- Select **Free** plan

### Step 3: Add Environment Variables
Add these in Render dashboard:
```
JWT_SECRET=your_secure_random_string_here
NODE_ENV=production
PORT=4000
```

### Step 4: Deploy
Click **"Create Web Service"**

Render will provide a URL like: `https://univote-backend.onrender.com`

### Step 5: Update Frontend Environment Variables

Once backend is deployed, update your frontend's environment variables in Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `frontend` project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `REACT_APP_AUTH_API_URL` = `https://your-backend.onrender.com`
   - `REACT_APP_API_URL` = `https://your-backend.onrender.com`
5. **Redeploy** the frontend

### Step 6: Rebuild & Redeploy Frontend

Run from your local terminal:
```bash
cd frontend
vercel --prod
```

## Quick Alternative: Manual Backend Deployment

If you prefer not to use Render, you can also use:
- **Railway** (railway.app) - Similar to Render
- **Fly.io** (fly.io) - Good for WebSockets
- **DigitalOcean App Platform** - More features

All follow similar steps as above.
