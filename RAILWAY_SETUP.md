# Railway Deployment Guide for MoveMaster Backend

## 🚂 Quick Setup

### 1. Create New Project on Railway

1. Go to [Railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `seppelz/moving` repository
5. Railway will auto-detect it's a Python app

### 2. Configure Build Settings

Railway should automatically use the `nixpacks.toml` configuration, but verify:

- **Root Directory**: `backend`
- **Build Command**: Auto-detected from `nixpacks.toml`
- **Start Command**: Auto-detected from `railway.json`

### 3. Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database" → "PostgreSQL"**
3. Railway will automatically create a `DATABASE_URL` variable

### 4. Set Environment Variables

Go to your service → **Variables** tab and add:

#### Required Variables

```bash
# Auto-created by Railway when you add PostgreSQL
DATABASE_URL=postgresql://...  # This should already exist

# Generate a secret key (run: openssl rand -hex 32)
SECRET_KEY=your-secret-key-here

# From Supabase (https://app.supabase.com)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-public-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Your frontend URL (add after deploying to Vercel)
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app,https://*.vercel.app
```

#### Optional Variables

```bash
# Google Maps API (for distance calculation)
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Email Configuration (if using SendGrid)
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@yourdomain.com

# Optional: Admin credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-password
```

### 5. Run Database Migration

After the first deployment, you need to run the migration:

**Option A: Railway CLI**
```bash
railway run alembic upgrade head
```

**Option B: Railway Dashboard**
1. Go to your service
2. Click on **"Settings"** → **"Deploy"**
3. Under **"Custom Start Command"**, temporarily add:
   ```
   alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
4. After successful deployment, remove `alembic upgrade head &&` 

**Option C: One-time Command**
1. Go to service → **Deployments**
2. Click latest deployment → **View Logs**
3. At bottom, click **"Run Command"**
4. Enter: `alembic upgrade head`

### 6. Verify Deployment

Once deployed, Railway will provide a URL like `https://movemaster.railway.app`

Test these endpoints:
```bash
# Health check
curl https://your-app.railway.app/health

# API root
curl https://your-app.railway.app/

# API docs (interactive)
https://your-app.railway.app/docs
```

## 🔍 Troubleshooting

### Build Fails with "network healthcheck failure"

**Cause**: Railway can't reach your app on the expected port.

**Solution**: Make sure `railway.json` uses `$PORT` variable:
```json
"startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
```

### Database Connection Error

**Cause**: `DATABASE_URL` not set or incorrect format.

**Solution**: 
1. Make sure PostgreSQL service is added to your project
2. Check that `DATABASE_URL` variable exists
3. Format should be: `postgresql://user:pass@host:port/database`

### Migration Fails

**Cause**: Database not accessible or already migrated.

**Solution**:
```bash
# Check current migration status
railway run alembic current

# Show migration history
railway run alembic history

# Force to latest
railway run alembic upgrade head
```

### Import Errors (ModuleNotFoundError)

**Cause**: Dependencies not installed or wrong Python path.

**Solution**:
1. Check `requirements.txt` is complete
2. Verify Railway is using Python 3.11+
3. Check build logs for pip install errors

### CORS Errors from Frontend

**Cause**: `ALLOWED_ORIGINS` doesn't include your frontend URL.

**Solution**:
```bash
# Add your Vercel URLs to ALLOWED_ORIGINS
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app,https://*.vercel.app,http://localhost:3000
```

## 📊 Monitoring

### View Logs
1. Go to your service in Railway
2. Click **"Deployments"**
3. Click latest deployment
4. View real-time logs

### Metrics
- Railway provides CPU, Memory, and Network metrics
- Check under **"Metrics"** tab

### Set up Alerts
1. Go to project **"Settings"**
2. Set up notifications for deployment failures

## 💰 Costs

Railway pricing (as of 2026):
- **Hobby Plan**: $5/month (includes $5 credit)
- **Pro Plan**: $20/month (includes $20 credit)
- Additional usage: ~$0.000463/GB-hour

Typical costs for small app:
- Backend: ~$5-10/month
- PostgreSQL: ~$2-5/month

## 🔐 Security Checklist

- [ ] `SECRET_KEY` is unique and secure (32+ characters)
- [ ] `DATABASE_URL` uses strong password
- [ ] `SUPABASE_SERVICE_KEY` is set but not exposed in frontend
- [ ] `ALLOWED_ORIGINS` only includes your domains (no wildcards in production)
- [ ] Environment variables are not committed to git
- [ ] PostgreSQL database has regular backups enabled

## 🚀 Deployment Workflow

1. **Push to GitHub** → Railway auto-deploys
2. **Check build logs** → Fix any errors
3. **Run migrations** → If schema changed
4. **Test API** → Hit `/health` endpoint
5. **Update Vercel** → Set `VITE_API_URL` to Railway URL

## Next Steps

After backend is deployed:
1. Copy your Railway URL (e.g., `https://movemaster.railway.app`)
2. Go to Vercel → Set `VITE_API_URL` to Railway URL
3. Redeploy frontend
4. Test full flow: Calculator → Quote submission → Admin dashboard → PDF generation

## Need Help?

- [Railway Docs](https://docs.railway.app)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
