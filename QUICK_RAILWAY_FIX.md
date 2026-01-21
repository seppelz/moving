# ✅ Railway Deployment - Fixed!

## What Was Wrong

1. **Hardcoded Port**: Dockerfile used port 8000 instead of Railway's `$PORT` variable → **FIXED**
2. **Required Env Vars**: App crashed on startup without environment variables → **FIXED**

## What Changed

- ✅ Dockerfile now uses `${PORT:-8000}` for dynamic port
- ✅ All environment variables now have defaults
- ✅ App starts successfully even without configuration
- ✅ `/health` endpoint shows config status

## Next Steps

### 1. Wait for Railway Deployment (1-2 min)

Railway will auto-deploy the latest push. The healthcheck should now **pass**!

### 2. Add Environment Variables

Once deployed, go to Railway → **Your Service** → **Variables** tab:

```bash
# 🔴 REQUIRED - Add PostgreSQL first
DATABASE_URL=postgresql://user:pass@host:port/db

# 🔴 REQUIRED - Generate with: openssl rand -hex 32
SECRET_KEY=your-32-character-secret-key

# 🟡 RECOMMENDED - For full functionality
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
GOOGLE_MAPS_API_KEY=your-maps-key

# 🟢 OPTIONAL - Your frontend URL
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### 3. Check Deployment Status

Visit: `https://your-app.railway.app/health`

You'll see:
```json
{
  "status": "healthy",
  "environment": "production",
  "config": {
    "database": "configured" or "default",
    "supabase": "configured" or "missing",
    "maps_api": "configured" or "missing",
    "secret_key": "configured" or "default"
  }
}
```

### 4. Run Database Migration

After adding `DATABASE_URL`:

```bash
# Option 1: Railway CLI
railway run alembic upgrade head

# Option 2: Railway Dashboard
# Go to service → View Logs → Run Command
# Enter: alembic upgrade head
```

### 5. Test the API

```bash
# Health check
curl https://your-app.railway.app/health

# API docs (interactive)
https://your-app.railway.app/docs

# Root endpoint
curl https://your-app.railway.app/
```

## Troubleshooting

### Still seeing "service unavailable"?

Check Railway logs:
1. Go to your service
2. Click **"Deployments"**
3. Click latest deployment
4. View **logs** - look for Python errors

### App starts but features don't work?

Add the missing environment variables shown in `/health` endpoint.

### Database connection errors?

Make sure:
- PostgreSQL service is added to Railway project
- `DATABASE_URL` environment variable exists
- Format: `postgresql://user:pass@host:port/database`

## Current Defaults (Change These!)

⚠️ **These are development defaults - NOT FOR PRODUCTION:**

- `SECRET_KEY`: `"dev-secret-key-change-in-production"`
- `DATABASE_URL`: `"sqlite:///./test.db"` (won't persist!)
- `SUPABASE_*`: Empty strings (features disabled)
- `GOOGLE_MAPS_API_KEY`: Empty string (distance calc fails)

## Success Checklist

- [ ] Railway deployment shows "Deployed" status
- [ ] `/health` endpoint returns `{"status": "healthy"}`
- [ ] `/docs` shows API documentation
- [ ] Added `DATABASE_URL` environment variable
- [ ] Added `SECRET_KEY` environment variable
- [ ] Ran `alembic upgrade head` migration
- [ ] Added Supabase credentials (optional but recommended)
- [ ] Added Google Maps API key (optional)
- [ ] Updated Vercel `VITE_API_URL` to Railway URL

---

**Your Railway URL**: Check Railway dashboard → Your Service → Domain

Example: `https://movemaster-production-xxxx.up.railway.app`
