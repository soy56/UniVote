# Railway Configuration Fix

The previous deployment failed because Railway was trying to run `npm install` before npm was available.

## The Fix

I've updated `railway.json` to:
1. Let Nixpacks auto-detect your Node.js project
2. Automatically handle `npm install`
3. Use the correct start command relative to the backend directory

## Important: Set Root Directory in Railway

**You MUST configure the Root Directory in Railway dashboard:**

1. Go to your Railway project
2. Click on **Settings**
3. Find **Root Directory**
4. Set it to: `backend`
5. Click **Save**

This tells Railway that your Node.js app lives in the `backend` folder.

## After Setting Root Directory

Railway will:
- ✅ Auto-detect `package.json` in the `backend` folder
- ✅ Run `npm install` automatically
- ✅ Start your app with `node auth/server.js`

## Redeploy

After setting the root directory:
1. Go to **Deployments** tab
2. Click **Redeploy** on the failed deployment
OR
3. Push the updated config (I'll do this for you)

The deployment should now succeed!
