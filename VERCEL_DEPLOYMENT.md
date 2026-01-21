# Vercel Deployment Guide

## Overview

This guide covers deploying the MoveMaster frontend to Vercel and configuring the necessary environment variables.

## Architecture

- **Frontend**: Deployed on Vercel (React + Vite)
- **Backend**: Must be deployed separately (Railway, Render, or your own server)
- **Database**: PostgreSQL (Supabase or your own instance)

## Prerequisites

1. Vercel account (https://vercel.com)
2. Backend API deployed and accessible via HTTPS
3. Database (PostgreSQL) set up and accessible
4. Google Maps API key (optional but recommended)

## Step 1: Backend Deployment

Before deploying the frontend, deploy your backend first:

### Option A: Railway (Recommended)

1. Push your code to GitHub
2. Go to https://railway.app
3. Create new project from GitHub repo
4. Select `backend` directory as root
5. Railway will auto-detect Python and use `Dockerfile`
6. Add environment variables (see below)
7. Get your backend URL (e.g., `https://your-app.up.railway.app`)

### Option B: Render

1. Go to https://render.com
2. Create new Web Service
3. Connect your GitHub repo
4. Set root directory to `backend`
5. Build command: `pip install -r requirements.txt`
6. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. Add environment variables

## Step 2: Frontend Deployment to Vercel

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel
```

### Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables (see below)
5. Deploy!

## Environment Variables

### Backend Environment Variables

Set these in your backend deployment platform (Railway/Render):

```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/database
SECRET_KEY=your-secret-key-min-32-chars
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Recommended
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Optional
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# CORS - Include your Vercel domain
ALLOWED_ORIGINS=https://your-app.vercel.app,https://app.movemaster.de

# Environment
ENV=production
```

### Frontend Environment Variables (Vercel)

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://your-backend.railway.app` | Your backend API URL (HTTPS required) |
| `VITE_GA_TRACKING_ID` | `G-XXXXXXXXXX` | Google Analytics ID (optional) |
| `VITE_ENABLE_ANALYTICS` | `true` | Enable analytics (optional) |

**Important**: 
- Set these for **Production** environment in Vercel
- `VITE_API_URL` must be HTTPS (no trailing slash)
- Update backend CORS to include your Vercel domain

## Step 3: Configure CORS

After deployment, update your backend's `ALLOWED_ORIGINS` to include:

```python
ALLOWED_ORIGINS: List[str] = [
    "http://localhost:3000",           # Local development
    "http://localhost:5173",           # Local development (Vite)
    "https://your-app.vercel.app",     # Vercel deployment
    "https://app.movemaster.de",       # Custom domain
]
```

## Step 4: Database Setup

### Using Supabase (Recommended)

1. Create project at https://supabase.com
2. Go to Settings → Database
3. Copy connection string
4. Run migrations:

```bash
cd backend
export DATABASE_URL="postgresql://..."
alembic upgrade head
python -m app.utils.seed_data
python -m app.utils.seed_profiles
```

### Database Connection String Format

```
postgresql://user:password@host:5432/database?sslmode=require
```

## Step 5: Post-Deployment Checklist

- [ ] Backend is accessible via HTTPS
- [ ] Database migrations run successfully
- [ ] Seed data loaded (item templates, apartment profiles)
- [ ] Frontend can reach backend API
- [ ] CORS configured correctly
- [ ] Environment variables set in Vercel
- [ ] Google Maps API key configured (optional)
- [ ] Test quote submission end-to-end
- [ ] Test PDF generation
- [ ] Test admin dashboard access

## Custom Domain (Optional)

### Frontend (Vercel)

1. Go to Vercel Dashboard → Domains
2. Add your domain (e.g., `app.movemaster.de`)
3. Configure DNS as instructed
4. SSL certificate is automatic

### Backend

1. Add custom domain in Railway/Render
2. Update CORS in backend config
3. Update `VITE_API_URL` in Vercel

## Troubleshooting

### CORS Errors

**Problem**: `No 'Access-Control-Allow-Origin' header`

**Solution**:
1. Check backend `ALLOWED_ORIGINS` includes your Vercel domain
2. Ensure backend is running and accessible
3. Verify `VITE_API_URL` is correct (HTTPS, no trailing slash)

### API Not Found (404)

**Problem**: Frontend can't reach backend

**Solution**:
1. Check `VITE_API_URL` in Vercel environment variables
2. Verify backend is deployed and running
3. Test backend health: `curl https://your-backend/health`

### Database Connection Failed

**Problem**: Backend can't connect to database

**Solution**:
1. Verify `DATABASE_URL` is correct
2. Check database is accessible (firewall, SSL settings)
3. Ensure connection string includes `?sslmode=require` for SSL

### PDF Generation Fails

**Problem**: 500 error when generating PDFs

**Solution**:
1. Ensure `reportlab` and `qrcode` are in `requirements.txt`
2. Check backend logs for specific error
3. Verify enough memory allocated (Railway: 512MB minimum)

## Monitoring & Logs

### Vercel Logs

```bash
# View deployment logs
vercel logs your-deployment-url

# View function logs (if using serverless functions)
vercel logs --follow
```

### Backend Logs

- **Railway**: Dashboard → Deployments → View Logs
- **Render**: Dashboard → Logs

## Security Best Practices

1. **Never commit `.env` files** - Always use `.env.example` as template
2. **Use strong SECRET_KEY** - Minimum 32 characters, random string
3. **Rotate API keys** - Regularly update sensitive keys
4. **Monitor API usage** - Google Maps API can incur costs
5. **Enable rate limiting** - Protect against abuse
6. **Use HTTPS only** - Never use HTTP in production
7. **Restrict CORS** - Only allow specific origins

## Cost Estimates

### Vercel (Frontend)
- **Hobby**: Free for personal projects
- **Pro**: $20/month (commercial use, better limits)

### Railway (Backend)
- **Developer**: $5/month for 500 hours ($10 credit)
- **Pay-as-you-go**: ~$5-20/month depending on usage

### Supabase (Database)
- **Free**: 500MB database, 2GB bandwidth
- **Pro**: $25/month (8GB database, 50GB bandwidth)

### Google Maps API
- **Free**: $200/month credit (~40,000 requests)
- **Pay-as-you-go**: $0.005 per request after credit

**Total estimated cost**: $0-60/month depending on tier and usage

## Support

For deployment issues:
- Check backend logs first
- Verify all environment variables are set
- Test API endpoints manually with curl
- Check CORS configuration
- Review Vercel build logs

## Next Steps

After successful deployment:
1. Test all functionality end-to-end
2. Set up monitoring (Sentry, LogRocket)
3. Configure custom domains
4. Set up automated backups for database
5. Implement CI/CD pipeline
6. Add rate limiting
7. Set up email notifications
