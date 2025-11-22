# Simple Railway Deployment - Manual Steps

## Quick Steps to Deploy Your Backend

### 1. Go to Railway Dashboard
Open: https://railway.com/new/github

### 2. Select Repository
- Click "Deploy from GitHub repo"
- Find and select **"soy56/UniVote"**

### 3. Configure Service
Railway will show configuration options:
- **Root Directory:** Leave blank or enter `backend`
- **Build Command:** `npm install` (Railway auto-detects this)
- **Start Command:** `node auth/server.js` (Railway auto-detects this)

### 4. Add Environment Variables
Click "Variables" and add these THREE variables:
```
NODE_ENV = production
PORT = 4000
JWT_SECRET = univote_secret_key_2024_secure
```

### 5. Deploy!
- Click "Deploy"
- Wait 2-3 minutes for build to complete
- Railway will show you a URL like: `https://univote-backend-production.up.railway.app`

### 6. Copy Your Backend URL
Once deployed, copy the URL from Railway dashboard (it ends with `.railway.app`)

## After You Get the URL

Come back and tell me the URL, I'll update your frontend to use it!

---

## Alternative: Use Localhost for Now
Your app works perfectly on **http://localhost:3000** - you can use that while we figure out deployment!
