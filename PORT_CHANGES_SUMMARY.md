# Port Configuration Update - Summary

## ✅ Changes Made

### Port Change: 8000 → 8080

To avoid conflicts with services running on port 8000, all references have been updated to use **port 8080** for the backend.

---

## 📝 Files Updated

### 1. Frontend Configuration
- **`frontend/src/services/api.ts`**
  - Changed: `http://localhost:8000` → `http://localhost:8080`

### 2. Documentation Files
- **`README.md`** - Updated backend start command and API docs URLs
- **`QUICK_START_SMART.md`** - Updated all port references
- **`IMPLEMENTATION_SUMMARY.md`** - Updated test commands and quick start
- **`SMART_SYSTEM_GUIDE.md`** - Updated troubleshooting and docs URLs

### 3. New Files Created
- **`backend/start.sh`** - Bash script to start backend on port 8080
- **`backend/start.bat`** - Windows batch script to start backend on port 8080
- **`PORT_SETUP.md`** - Complete port configuration guide
- **`PORT_CHANGES_SUMMARY.md`** - This file

---

## 🚀 How to Start (Updated)

### Quick Start

**Windows:**
```bash
cd backend
start.bat
```

**Linux/Mac:**
```bash
cd backend
chmod +x start.sh
./start.sh
```

**Or manually:**
```bash
cd backend
uvicorn app.main:app --reload --port 8080
```

### Verify It's Working

```bash
# Test backend
curl http://localhost:8080/health

# Open API docs
open http://localhost:8080/docs
```

---

## 🔧 Configuration Reference

### Current Setup

| Service | Port | URL |
|---------|------|-----|
| Backend API | **8080** | http://localhost:8080 |
| Frontend Dev | 5173 | http://localhost:5173 |
| API Docs | **8080** | http://localhost:8080/docs |

### Environment Variables

**Frontend** (`frontend/.env`):
```bash
VITE_API_URL=http://localhost:8080
```

If this file doesn't exist, the default in `api.ts` will be used (already updated to 8080).

---

## ⚠️ Important Notes

### 1. No Code Changes Required
The port change is purely configuration. Your application code remains the same.

### 2. All Documentation Updated
Every reference to port 8000 has been changed to 8080 in:
- Quick start guides
- API documentation
- Test commands
- Troubleshooting sections

### 3. Production Unchanged
Production deployments (Railway, Render, Vercel) use environment variables and are not affected by local port changes.

---

## 🧪 Testing After Port Change

Run these commands to verify everything works:

```bash
# 1. Start backend (new port)
cd backend
uvicorn app.main:app --reload --port 8080

# 2. Test API (in another terminal)
curl http://localhost:8080/health
# Expected: {"status": "healthy"}

curl http://localhost:8080/api/v1/smart/profiles
# Expected: [] or list of profiles

# 3. Start frontend
cd frontend
npm run dev
# Expected: Frontend connects to http://localhost:8080
```

---

## 🔄 Reverting (If Needed)

To revert back to port 8000:

1. **Frontend:** Change `api.ts` back to `http://localhost:8000`
2. **Backend:** Start with `uvicorn app.main:app --reload --port 8000`
3. **Scripts:** Edit `start.sh` and `start.bat` to use port 8000

Or just use `PORT_SETUP.md` guide to configure any port you want.

---

## 📚 Related Documentation

- **PORT_SETUP.md** - Complete port configuration guide
- **QUICK_START_SMART.md** - Updated quick start with new ports
- **IMPLEMENTATION_SUMMARY.md** - Full implementation guide

---

## ✅ Checklist

After pulling these changes:

- [ ] Backend starts on port 8080 (not 8000)
- [ ] Frontend connects to http://localhost:8080
- [ ] API docs accessible at http://localhost:8080/docs
- [ ] All test commands work with new port
- [ ] No conflicts with existing services on port 8000

---

## 🎯 Quick Reference Card

**Start Backend:**
```bash
uvicorn app.main:app --reload --port 8080
```

**Test Backend:**
```bash
curl http://localhost:8080/health
```

**API Docs:**
```
http://localhost:8080/docs
```

**Smart Prediction Test:**
```bash
curl -X POST http://localhost:8080/api/v1/smart/smart-prediction \
  -H "Content-Type: application/json" \
  -d '{"apartment_size":"2br","household_type":"couple","furnishing_level":"normal"}'
```

---

That's it! Your MoveMaster backend now runs on port **8080** instead of 8000. 🎉
