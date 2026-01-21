# 🔍 Railway Deployment Debugging Guide

## What I Added

### 1. **Comprehensive Logging** in `app/main.py`
- Logs every startup step
- Shows which environment variables are set/missing
- Tests database connection on startup
- Logs CORS and router loading
- Includes PORT in health check response

### 2. **Database Error Handling** in `app/core/database.py`
- Logs database connection attempts
- Creates fallback SQLite if PostgreSQL fails
- Better connection pooling settings

### 3. **Debug Script** (`backend/debug_startup.py`)
- Standalone script to test environment
- Checks all imports and configurations
- Tests database connection
- Can run separately from main app

---

## 🔴 Step 1: Check Railway Logs (MOST IMPORTANT)

Railway will now auto-redeploy. **Go to Railway dashboard:**

1. Click on your service
2. Go to **"Deployments"** tab
3. Click on the latest deployment
4. Click **"View Logs"**

### What to Look For:

**✅ SUCCESS - You should see:**
```
MOVEMASTER BACKEND STARTING UP
Python version: 3.11.x
✓ Configuration loaded successfully
Configuration status:
  SECRET_KEY: SET
  DATABASE_URL: SET
  SUPABASE_URL: SET
  ...
✓ Database connection successful
✓ CORS configured
✓ Quote router loaded
✓ Admin router loaded
✓ Smart quote router loaded
Application module loaded successfully
INFO: Uvicorn running on http://0.0.0.0:XXXX
```

**❌ FAILURE - Look for errors like:**
```
✗ Failed to load configuration: ...
✗ Database connection failed: ...
✗ Failed to configure CORS: ...
✗ Failed to load routers: ...
```

---

## 🟡 Step 2: Run Debug Script (If Logs Don't Help)

In Railway dashboard:

1. Go to your service
2. Click **"Deployments"**
3. Scroll to bottom of logs
4. Click **"Run Command"**
5. Enter: `python backend/debug_startup.py`
6. Press Enter

This will show:
- ✓/✗ All environment variables
- ✓/✗ Python imports working
- ✓/✗ Configuration loading
- ✓/✗ Database connection
- ✓/✗ FastAPI app creation
- Network info and PORT

---

## 🟢 Step 3: Test Health Endpoint

Once the deployment shows **"Active"** or **"Deployed"**:

```bash
# Replace with your actual Railway URL
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "production",
  "port": "8765",  // or whatever Railway assigns
  "config": {
    "database": "configured",
    "supabase": "configured",
    "maps_api": "configured",
    "secret_key": "configured"
  }
}
```

---

## 🔴 Common Issues & Solutions

### Issue 1: "Database connection failed"

**Symptom in logs:**
```
✗ Database connection failed: could not connect to server
```

**Solutions:**
1. **Check DATABASE_URL format** - Should be:
   ```
   postgresql://user:password@host:port/database
   ```
   NOT:
   ```
   postgres://...  (wrong protocol)
   ```

2. **Use Railway's internal database URL** if using Railway PostgreSQL:
   - Go to PostgreSQL service → Variables
   - Look for `DATABASE_URL` or `DATABASE_PRIVATE_URL`
   - Copy the **PRIVATE_URL** (faster internal connection)

3. **If using Supabase:**
   - Go to Supabase → Settings → Database
   - Use **Connection Pooling** URL (port 6543)
   - Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

### Issue 2: "App starts but healthcheck fails"

**Symptom:**
```
Logs show: Uvicorn running on http://0.0.0.0:XXXX
But healthcheck still fails
```

**Solution:**
Check if PORT environment variable is set:
```bash
# In Railway dashboard → Run Command
echo $PORT
```

If not set, Railway should set it automatically. Check `railway.json` uses `$PORT`.

### Issue 3: "Import errors" or "Module not found"

**Symptom in logs:**
```
ModuleNotFoundError: No module named 'something'
```

**Solutions:**
1. Check `requirements.txt` includes the module
2. Rebuild: Railway → Settings → Triggers → Redeploy
3. Check Python version: Railway → Settings → Environment → Python 3.11

### Issue 4: "CORS errors" (after deployment succeeds)

**Symptom:**
Frontend gets CORS errors when calling API

**Solution:**
Add frontend URL to `ALLOWED_ORIGINS` environment variable:
```
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app
```

---

## 📊 What Each Log Message Means

| Log Message | Meaning | Action if Missing |
|------------|---------|-------------------|
| `Python version: 3.11.x` | Python installed | Check Railway Python buildpack |
| `✓ Configuration loaded` | Settings imported OK | Check config.py syntax |
| `DATABASE_URL: SET` | Database connected | Add DATABASE_URL variable |
| `✓ Database connection successful` | Can query database | Check credentials and network |
| `✓ CORS configured` | CORS middleware loaded | Check settings.ALLOWED_ORIGINS |
| `✓ routers loaded` | All API endpoints ready | Check router imports |
| `Uvicorn running on` | Server started | This means app is UP! |

---

## 🎯 Next Steps After Successful Deployment

1. **Copy your Railway URL** (e.g., `https://movemaster-production-xxxx.up.railway.app`)

2. **Test endpoints:**
   ```bash
   # Health check
   curl https://your-url/health
   
   # API docs
   open https://your-url/docs
   
   # Root endpoint
   curl https://your-url/
   ```

3. **Run database migration:**
   ```bash
   # In Railway dashboard → Run Command
   alembic upgrade head
   ```

4. **Update Vercel with backend URL:**
   - Vercel → Settings → Environment Variables
   - Add `VITE_API_URL=https://your-railway-url`
   - Redeploy frontend

---

## 📞 What to Share If Still Failing

If healthcheck still fails after these steps, share:

1. **Full logs from Railway** (copy/paste the startup logs)
2. **Output of debug script** (run `python backend/debug_startup.py`)
3. **Screenshot of Variables tab** (hide sensitive values)
4. **Error message** from Railway deployment

This will help identify the exact issue!
