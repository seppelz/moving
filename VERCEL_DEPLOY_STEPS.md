# 🚀 Vercel Deployment Steps for MoveMaster Frontend

## Prerequisites

1. ✅ Railway backend is deployed and running
2. ✅ You have your Railway backend URL (e.g., `https://movemaster-production-xxxx.up.railway.app`)
3. ✅ GitHub repository is pushed (`seppelz/moving`)

---

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Create New Project

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New..."** → **"Project"**
4. Find and select your repository: **`seppelz/moving`**
5. Click **"Import"**

### Step 2: Configure Build Settings

Vercel should auto-detect Vite, but verify these settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Step 3: Add Environment Variables

**CRITICAL:** Add this environment variable before deploying:

| Name | Value | Environments |
|------|-------|--------------|
| `VITE_API_URL` | `https://your-railway-url.railway.app` | Production, Preview, Development |

**Example:**
```
VITE_API_URL=https://movemaster-production-abc123.up.railway.app
```

⚠️ **Important:** 
- NO trailing slash at the end
- Must start with `https://`
- Use your actual Railway URL

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Vercel will show you the live URL

---

## Method 2: Deploy via Vercel CLI (Alternative)

### Install Vercel CLI

```bash
npm install -g vercel
```

### Deploy

```bash
cd frontend
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? (select your account)
- Link to existing project? **N**
- Project name? **moving** (or your preferred name)
- Directory? `./` (current directory)
- Override settings? **N**

### Add Environment Variable

```bash
vercel env add VITE_API_URL production
```

Paste your Railway URL when prompted.

### Redeploy with Environment Variable

```bash
vercel --prod
```

---

## Step 3: Update Railway ALLOWED_ORIGINS

After Vercel deployment, you'll get URLs like:
- Production: `https://your-app.vercel.app`
- Preview: `https://your-app-git-main.vercel.app`

### Add these to Railway:

1. Go to Railway → Your service → **Variables**
2. Add new variable:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app,https://your-app-preview.vercel.app,http://localhost:3000
   ```
3. Railway will automatically redeploy

---

## Step 4: Test the Deployment

### Test Calculator Flow

1. Go to your Vercel URL: `https://your-app.vercel.app`
2. Test the calculator:
   - Enter postal codes
   - Select apartment size
   - Go through smart profile questions
   - Check if price estimate shows
   - Fill out contact form
   - Submit quote

### Check Backend Connection

Open browser console (F12) and check for:
- ✅ No CORS errors
- ✅ Successful API calls to Railway backend
- ✅ Data loading correctly

### Test Admin Dashboard

1. Go to: `https://your-app.vercel.app/admin`
2. Check if quotes appear
3. Try to download PDF
4. Verify all features work

---

## Troubleshooting

### Issue 1: "Failed to fetch" errors

**Cause:** `VITE_API_URL` not set or incorrect

**Fix:**
1. Vercel → Your Project → **Settings** → **Environment Variables**
2. Add/update `VITE_API_URL`
3. Redeploy: **Deployments** → Three dots → **Redeploy**

### Issue 2: CORS errors

**Cause:** Vercel URL not in Railway's `ALLOWED_ORIGINS`

**Fix:**
1. Railway → Variables → Update `ALLOWED_ORIGINS`
2. Add your Vercel URLs (production and preview)

### Issue 3: Build fails

**Cause:** Missing dependencies or build errors

**Check:**
1. Vercel build logs for specific error
2. Make sure `frontend/package.json` is correct
3. Try building locally: `cd frontend && npm run build`

### Issue 4: Blank page after deployment

**Cause:** Routing issues or base path

**Fix:**
1. Check Vercel logs
2. Verify `vite.config.ts` has correct base path
3. Check browser console for errors

---

## Environment Variables Summary

### Frontend (Vercel)

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_URL` | Railway backend URL | ✅ Yes |

### Backend (Railway)

| Variable | Example | Required |
|----------|---------|----------|
| `DATABASE_URL` | `postgresql://...` | ✅ Yes |
| `SECRET_KEY` | `32-char-random-string` | ✅ Yes |
| `SUPABASE_URL` | `https://xxx.supabase.co` | ⚠️ Recommended |
| `SUPABASE_KEY` | `eyJhbGci...` | ⚠️ Recommended |
| `SUPABASE_SERVICE_KEY` | `eyJhbGci...` | ⚠️ Recommended |
| `GOOGLE_MAPS_API_KEY` | `AIza...` | ⚠️ Recommended |
| `ALLOWED_ORIGINS` | `https://app.vercel.app,...` | ✅ Yes |

---

## Success Checklist

- [ ] Vercel deployment shows "Ready" status
- [ ] Frontend loads without errors
- [ ] Calculator flow works end-to-end
- [ ] Backend API calls succeed (check Network tab)
- [ ] No CORS errors in console
- [ ] Quote submission works
- [ ] Admin dashboard loads
- [ ] PDF download works
- [ ] Smart profile matching shows results

---

## Next Steps After Successful Deployment

1. **Test thoroughly** - Go through entire user flow
2. **Run database migration** (if not done):
   ```bash
   # In Railway dashboard → Run Command
   alembic upgrade head
   ```
3. **Monitor logs** - Check both Vercel and Railway logs for errors
4. **Set up custom domain** (optional):
   - Vercel: Settings → Domains
   - Railway: Settings → Domains
5. **Enable analytics** (optional) - Vercel Analytics

---

## Cost Estimates

### Vercel (Frontend)
- **Hobby Plan:** FREE
  - 100 GB bandwidth/month
  - Unlimited projects
  - Automatic HTTPS
  - Preview deployments

### Railway (Backend + Database)
- **Hobby Plan:** ~$5-10/month
- **Pro Plan:** ~$20/month + usage
- PostgreSQL: ~$2-5/month

### Total: ~$0-15/month (depending on usage)

---

## Support

If you encounter issues:
1. Check browser console (F12)
2. Check Vercel build logs
3. Check Railway deployment logs
4. Verify environment variables are set correctly

---

**Your Deployment URLs:**
- Frontend: `https://your-app.vercel.app` (after deployment)
- Backend: `https://your-railway-url.railway.app`
- API Docs: `https://your-railway-url.railway.app/docs`
