# Troubleshooting Guide

## Common Issues

### 1. Frontend Can't Connect to Backend (404 Error)

**Problem:** Frontend shows 404 errors when trying to connect to API endpoints.

**Solution:**
1. Check that backend is running on the correct port:
   ```bash
   curl http://localhost:8080/health
   ```

2. Verify frontend `.env.local` has correct API URL:
   ```bash
   # Should show: VITE_API_URL=http://127.0.0.1:8080
   cat frontend/.env.local
   ```

3. If wrong port, update it:
   ```bash
   echo "VITE_API_URL=http://127.0.0.1:8080" > frontend/.env.local
   ```

4. Restart frontend to pick up changes:
   ```bash
   # Kill existing frontend process
   # Then restart:
   cd frontend
   npm run dev
   ```

### 2. Backend Shows "Running in DEV MODE"

**Problem:** Backend warning about missing Google Maps API key.

**Solution:** This is normal for development! The backend works without it. To add it:

1. Get a Google Maps API key at: https://console.cloud.google.com/apis/credentials
2. Update `backend/.env`:
   ```bash
   GOOGLE_MAPS_API_KEY=your-actual-api-key-here
   ```
3. Restart backend

### 3. Smart AI Prediction Not Working

**Symptoms:**
- "Failed to get prediction" error
- API returns 404

**Solution:**
1. Check backend is running:
   ```bash
   curl http://localhost:8080/api/v1/smart/profiles
   ```

2. Verify database migrations are applied:
   ```bash
   cd backend
   source venv/Scripts/activate  # or venv\Scripts\activate on Windows
   alembic upgrade head
   ```

3. Seed smart profiles:
   ```bash
   python -m app.utils.seed_profiles
   ```

4. Test prediction endpoint:
   ```bash
   curl -X POST http://localhost:8080/api/v1/smart/smart-prediction \
     -H "Content-Type: application/json" \
     -d '{"apartment_size":"2br","household_type":"young_professional","furnishing_level":"normal"}'
   ```

### 4. Port Already in Use

**Problem:** "Port 8080 already in use" or "Port 3000 already in use"

**Solution:**

**Windows:**
```bash
# Find process using port
netstat -ano | findstr :8080

# Kill it (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find process using port
lsof -i :8080

# Kill it (replace PID with actual process ID)
kill -9 <PID>
```

### 5. Database Errors

**Problem:** "No such table" or "Database locked"

**Solution:**
```bash
cd backend
rm movemaster.db  # Delete old database
alembic upgrade head  # Recreate with migrations
python -m app.utils.seed_data  # Seed basic data
python -m app.utils.seed_profiles  # Seed smart profiles
```

## Quick Health Check

Run these commands to verify everything is working:

```bash
# 1. Backend health
curl http://localhost:8080/health
# Expected: {"status":"healthy"}

# 2. Smart profiles available
curl http://localhost:8080/api/v1/smart/profiles
# Expected: JSON array of profiles

# 3. Frontend running
# Open browser: http://localhost:3000
# Expected: MoveMaster calculator loads

# 4. Smart prediction test
curl -X POST http://localhost:8080/api/v1/smart/smart-prediction \
  -H "Content-Type: application/json" \
  -d '{"apartment_size":"2br","household_type":"couple","furnishing_level":"normal"}'
# Expected: JSON with predicted_volume_m3, breakdown, etc.
```

## Still Having Issues?

1. Check `PORT_SETUP.md` for port configuration
2. Check `QUICK_START_SMART.md` for setup instructions
3. Verify both backend and frontend are running:
   - Backend: http://localhost:8080/docs
   - Frontend: http://localhost:3000

## Environment Variables

### Frontend (frontend/.env.local)
```
VITE_API_URL=http://127.0.0.1:8080
```

### Backend (backend/.env)
```
DATABASE_URL=sqlite:///./movemaster.db
GOOGLE_MAPS_API_KEY=your-key-here  # Optional for dev
SECRET_KEY=dev-secret-key
```

See `.env.example` files for complete configuration options.
