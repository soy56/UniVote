# Deploy UniVote Backend to Railway

This guide will help you deploy the UniVote backend to Railway.

## Prerequisites

1. A Railway account (sign up at https://railway.app)
2. Railway CLI installed (optional, for CLI deployment)

## Method 1: Deploy via Railway Dashboard (Recommended)

### Step 1: Create New Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your `UniVote` repository

### Step 2: Configure the Service

Railway will auto-detect your Node.js backend. Configure it:

1. **Root Directory**: Set to `backend`
2. **Build Command**: `npm install`
3. **Start Command**: `node auth/server.js`
4. **Port**: Railway auto-assigns (accessible via `PORT` env var)

### Step 3: Set Environment Variables

Add these environment variables in Railway dashboard:

```
NODE_ENV=production
PORT=${{PORT}}
JWT_SECRET=your_secure_jwt_secret_here_change_this
ALLOWED_ORIGIN=https://soy56.github.io
```

**Important**: Generate a strong JWT_SECRET (use a password generator)

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (2-3 minutes)
3. Once deployed, Railway will provide a public URL like:
   `https://your-app-name.up.railway.app`

### Step 5: Update Frontend Configuration

1. Copy your Railway backend URL
2. Update `frontend/src/config.js`:
   ```javascript
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-app-name.up.railway.app';
   ```
3. Rebuild and redeploy frontend:
   ```bash
   cd frontend
   npm run build
   npm run deploy
   ```

## Method 2: Deploy via Railway CLI

### Install Railway CLI

```bash
# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex

# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh
```

### Deploy Steps

```bash
# 1. Login to Railway
railway login

# 2. Initialize project (in project root)
railway init

# 3. Link to your project or create new
railway link

# 4. Add environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your_secure_secret_here
railway variables set ALLOWED_ORIGIN=https://soy56.github.io

# 5. Deploy
railway up
```

## Verification

After deployment, test your backend:

1. **Health Check**:
   ```
   https://your-app-name.up.railway.app/health
   ```
   Should return: `{"status":"OK","timestamp":"..."}`

2. **Root Route**:
   ```
   https://your-app-name.up.railway.app/
   ```
   Should return API information

3. **Election Data**:
   ```
   https://your-app-name.up.railway.app/election
   ```
   Should return election data

## Troubleshooting

### Build Fails

- Check Railway logs in the dashboard
- Ensure `backend/package.json` has all dependencies
- Verify Node.js version compatibility

### App Crashes on Start

- Check that `PORT` environment variable is set correctly
- Verify start command is `node auth/server.js` (relative to backend dir)
- Check Railway logs for error messages

### Database/Files Not Persisting

Railway's filesystem is ephemeral. For persistent data:
- Use Railway's PostgreSQL addon (recommended)
- Or use external storage like MongoDB Atlas

## Cost

- Free tier: $5/month credit
- Hobby plan: $5/month (recommended)
- Pro plan: $20/month

## Next Steps

After successful deployment:
1. ✅ Update frontend config with Railway URL
2. ✅ Redeploy frontend to GitHub Pages
3. ✅ Test the complete application
4. ✅ (Optional) Set up custom domain in Railway
