# Environment Variables Reference

Complete reference for all environment variables used in MoveMaster.

## Backend Environment Variables

### Required Variables

These are **essential** for the application to run:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | ✅ Yes |
| `SECRET_KEY` | JWT/session secret (min 32 chars) | `your-super-secret-key-min-32-characters` | ✅ Yes |
| `SUPABASE_URL` | Supabase project URL | `https://abcdefgh.supabase.co` | ✅ Yes |
| `SUPABASE_KEY` | Supabase anon public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Yes |

### Recommended Variables

Highly recommended for production use:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GOOGLE_MAPS_API_KEY` | Google Maps Distance Matrix API key | `AIzaSyDxxxxxxxxxxxxxxxxx` | ⚠️ Recommended |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `https://app.movemaster.de,https://*.vercel.app` | ⚠️ Recommended |

**Without Google Maps API**: The system falls back to approximate distance calculation (100km for different cities, 10km for same city).

### Optional Variables

Nice to have but not required:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SMTP_HOST` | Email server hostname | `smtp.gmail.com` | ❌ Optional |
| `SMTP_PORT` | Email server port | `587` | ❌ Optional |
| `SMTP_USER` | Email username | `your-email@example.com` | ❌ Optional |
| `SMTP_PASSWORD` | Email password/app password | `your-app-password` | ❌ Optional |
| `ENV` | Environment name | `production` or `development` | ❌ Optional |

## Frontend Environment Variables

### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API base URL (HTTPS) | `https://api.movemaster.railway.app` | ✅ Yes |

### Optional Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_GA_TRACKING_ID` | Google Analytics tracking ID | `G-XXXXXXXXXX` | ❌ Optional |
| `VITE_ENABLE_ANALYTICS` | Enable/disable analytics | `true` or `false` | ❌ Optional |

## How to Set Environment Variables

### Local Development

#### Backend
```bash
# Create .env file in backend directory
cd backend
cp .env.example .env
# Edit .env with your values
nano .env
```

#### Frontend
```bash
# Create .env.local file in frontend directory
cd frontend
cp .env.example .env.local
# Edit .env.local with your values
nano .env.local
```

### Vercel (Frontend)

1. Go to your project dashboard
2. Settings → Environment Variables
3. Add each variable:
   - **Key**: Variable name (e.g., `VITE_API_URL`)
   - **Value**: Your value (e.g., `https://api.movemaster.railway.app`)
   - **Environments**: Select Production, Preview, Development

### Railway (Backend)

1. Go to your project dashboard
2. Click on your service
3. Variables tab
4. Add each variable:
   - Click "+ New Variable"
   - Enter key and value
   - Save

### Render (Backend)

1. Go to your web service
2. Environment tab
3. Add each variable:
   - Click "Add Environment Variable"
   - Enter key and value
   - Save

## Getting API Keys

### Supabase

1. Go to https://supabase.com
2. Create new project
3. Go to Settings → API
4. Copy:
   - Project URL → `SUPABASE_URL`
   - anon public key → `SUPABASE_KEY`
   - service_role key → `SUPABASE_SERVICE_KEY`
5. Go to Settings → Database
6. Copy connection string → `DATABASE_URL`

### Google Maps API

1. Go to https://console.cloud.google.com
2. Create new project
3. Enable "Distance Matrix API"
4. Create credentials → API key
5. Restrict API key:
   - API restrictions: Distance Matrix API
   - Application restrictions: HTTP referrers or IP addresses
6. Copy API key → `GOOGLE_MAPS_API_KEY`

**Free tier**: $200/month credit (~40,000 requests)

### Gmail SMTP (Optional)

1. Enable 2-Factor Authentication on your Google account
2. Go to Account Settings → Security
3. Generate App Password
4. Use:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=your-email@gmail.com`
   - `SMTP_PASSWORD=your-app-password`

## Security Best Practices

### ✅ DO

- Use `.env.example` files as templates
- Add `.env` to `.gitignore`
- Use strong, random `SECRET_KEY` (32+ characters)
- Rotate API keys regularly
- Use different keys for dev/staging/production
- Restrict API keys to specific domains/IPs
- Use environment-specific values

### ❌ DON'T

- Never commit `.env` files to Git
- Never share production keys publicly
- Never use default/example values in production
- Never hardcode credentials in source code
- Never use HTTP URLs in production (HTTPS only)
- Never use the same keys across environments

## Validation

### Backend Health Check

```bash
# Test backend is running
curl https://your-backend.railway.app/health

# Expected response:
{"status":"healthy"}
```

### Database Connection Test

```bash
# From backend directory
cd backend
export DATABASE_URL="your-connection-string"
python -c "from app.core.database import engine; engine.connect(); print('Database connected successfully')"
```

### Google Maps API Test

```bash
# Test API key
curl "https://maps.googleapis.com/maps/api/distancematrix/json?origins=10115&destinations=10117&key=YOUR_API_KEY"

# Should return distance data (not error)
```

### Frontend API Connection Test

```bash
# Test frontend can reach backend
curl https://your-frontend.vercel.app
# Should load the React app

# Check browser console for API errors
# Open browser DevTools → Network → Look for API calls
```

## Troubleshooting

### Missing Environment Variables

**Error**: `Field required` or `None is not allowed`

**Solution**: Check all required variables are set in your deployment platform.

### Invalid Database URL

**Error**: `Could not translate host name` or `connection refused`

**Solution**: 
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:5432/db?sslmode=require`
- Check database is accessible (firewall, SSL)
- For Supabase, use the connection string from Settings → Database

### CORS Errors

**Error**: `No 'Access-Control-Allow-Origin' header`

**Solution**: Update `ALLOWED_ORIGINS` in backend to include your frontend domain.

### Google Maps API Quota Exceeded

**Error**: `OVER_QUERY_LIMIT`

**Solution**:
- Check API usage in Google Cloud Console
- Enable billing to increase quota
- Implement caching to reduce API calls

## Environment-Specific Configurations

### Development

```bash
# Backend (.env)
DATABASE_URL=sqlite:///./movemaster.db
SECRET_KEY=dev-secret-key-change-in-production
SUPABASE_URL=https://your-dev-project.supabase.co
ENV=development

# Frontend (.env.local)
VITE_API_URL=http://localhost:8080
VITE_ENABLE_ANALYTICS=false
```

### Staging

```bash
# Backend
DATABASE_URL=postgresql://staging_db_url
SECRET_KEY=staging-secret-key-min-32-chars
SUPABASE_URL=https://your-staging-project.supabase.co
ALLOWED_ORIGINS=https://staging.movemaster.vercel.app
ENV=staging

# Frontend
VITE_API_URL=https://api-staging.movemaster.railway.app
VITE_ENABLE_ANALYTICS=true
```

### Production

```bash
# Backend
DATABASE_URL=postgresql://production_db_url?sslmode=require
SECRET_KEY=production-secret-key-min-32-chars-super-secure
SUPABASE_URL=https://your-production-project.supabase.co
SUPABASE_KEY=production-anon-key
SUPABASE_SERVICE_KEY=production-service-key
GOOGLE_MAPS_API_KEY=production-google-maps-key
ALLOWED_ORIGINS=https://app.movemaster.de,https://movemaster.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@movemaster.de
SMTP_PASSWORD=production-smtp-password
ENV=production

# Frontend
VITE_API_URL=https://api.movemaster.de
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_ENABLE_ANALYTICS=true
```

## Summary Checklist

Before deploying, ensure you have:

### Backend
- [x] `DATABASE_URL` - PostgreSQL connection string
- [x] `SECRET_KEY` - Strong random key (32+ chars)
- [x] `SUPABASE_URL` - Your Supabase project URL
- [x] `SUPABASE_KEY` - Supabase anon key
- [x] `SUPABASE_SERVICE_KEY` - Supabase service key
- [ ] `GOOGLE_MAPS_API_KEY` - Recommended for accurate distances
- [ ] `ALLOWED_ORIGINS` - Include your frontend domain
- [ ] `SMTP_*` - Optional, for email notifications

### Frontend
- [x] `VITE_API_URL` - Your deployed backend URL (HTTPS)
- [ ] `VITE_GA_TRACKING_ID` - Optional, for analytics

**Minimum viable production**: 6 required variables (5 backend + 1 frontend)
