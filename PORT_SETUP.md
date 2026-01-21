# Port Configuration

## Default Ports

MoveMaster uses the following default ports:

- **Backend API**: `8080` (changed from 8000 to avoid conflicts)
- **Frontend Dev Server**: `5173` (Vite default)

---

## Quick Start

### Option 1: Use Start Scripts (Recommended)

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

### Option 2: Manual Start

```bash
cd backend
uvicorn app.main:app --reload --port 8080
```

---

## Changing Ports

### Change Backend Port

**Method 1: Command Line**
```bash
# Use any available port
uvicorn app.main:app --reload --port 3000
```

**Method 2: Environment Variable**
```bash
# Set in .env or shell
export PORT=3000
uvicorn app.main:app --reload --port $PORT
```

**Method 3: Update Start Scripts**

Edit `backend/start.sh` or `backend/start.bat`:
```bash
# Change from 8080 to your desired port
uvicorn app.main:app --reload --port 3000
```

### Update Frontend API URL

If you change the backend port, update the frontend:

**File:** `frontend/.env` (create if doesn't exist)
```bash
VITE_API_URL=http://localhost:3000
```

Or edit `frontend/src/services/api.ts`:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
```

---

## Production Ports

### Railway/Render (Backend)

These platforms automatically set the PORT environment variable.

**Option 1: Let platform decide (Recommended)**
```python
# In app/main.py (add this):
import os
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
```

**Option 2: Configure in railway.json**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
  }
}
```

### Vercel (Frontend)

Vercel handles ports automatically. Just set the API URL:

**Environment Variable:**
```
VITE_API_URL=https://your-backend.railway.app
```

---

## Troubleshooting

### Port Already in Use

**Check what's using a port:**

**Windows:**
```bash
netstat -ano | findstr :8080
```

**Linux/Mac:**
```bash
lsof -i :8080
```

**Kill the process:**

**Windows:**
```bash
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
kill -9 <PID>
```

### Frontend Can't Connect

**Check:**
1. Backend is running: `curl http://localhost:8080/health`
2. CORS is enabled: Check `backend/app/core/config.py` → `ALLOWED_ORIGINS`
3. Correct API URL: Check `frontend/src/services/api.ts`

**Quick Fix:**
```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload --port 8080

# Terminal 2 - Test
curl http://localhost:8080/api/v1/smart/profiles

# Should return: [] or profile list
```

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Backend API | 8080 | http://localhost:8080 |
| API Docs (Swagger) | 8080 | http://localhost:8080/docs |
| API Docs (ReDoc) | 8080 | http://localhost:8080/redoc |
| Frontend Dev | 5173 | http://localhost:5173 |

---

## Common Port Alternatives

If ports are occupied, try these alternatives:

| Service | Default | Alternative 1 | Alternative 2 |
|---------|---------|---------------|---------------|
| Backend | 8080 | 3000 | 5000 |
| Frontend | 5173 | 3001 | 5001 |

---

## Docker Configuration (Future)

```yaml
# docker-compose.yml
services:
  backend:
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
  
  frontend:
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:8080
```

---

## Need Help?

- Port conflicts? Use `--port` flag
- Can't connect? Check firewall settings
- Still stuck? Check `IMPLEMENTATION_SUMMARY.md`
