# MoveMaster Deployment Guide

## Prerequisites

- Supabase account (for database)
- Google Maps API key
- Railway or Render account (for backend)
- Vercel account (for frontend)
- Domain name (optional)

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/movemaster
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Security
SECRET_KEY=generate-with-openssl-rand-hex-32

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Frontend (.env)

```env
VITE_API_URL=https://api.movemaster.de
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## Backend Deployment (Railway)

1. **Create Railway Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   cd backend
   railway init
   ```

2. **Add PostgreSQL Database**
   - In Railway dashboard, add PostgreSQL plugin
   - Copy DATABASE_URL from plugin settings

3. **Set Environment Variables**
   ```bash
   railway variables set SUPABASE_URL=xxx
   railway variables set GOOGLE_MAPS_API_KEY=xxx
   # ... set all other variables
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Run Migrations**
   ```bash
   railway run alembic upgrade head
   railway run python -m app.utils.seed_data
   ```

## Frontend Deployment (Vercel)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variables**
   - Go to Vercel dashboard → Project Settings → Environment Variables
   - Add `VITE_API_URL` pointing to your Railway backend
   - Add `VITE_GOOGLE_MAPS_API_KEY`

4. **Configure Domain** (optional)
   - In Vercel dashboard, add custom domain
   - Update DNS records as instructed

## Alternative: Docker Deployment

### Using Docker Compose

1. **Set up environment**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit .env files with your credentials
   ```

2. **Build and run**
   ```bash
   docker-compose up -d
   ```

3. **Run migrations**
   ```bash
   docker-compose exec backend alembic upgrade head
   docker-compose exec backend python -m app.utils.seed_data
   ```

### Production Docker Deployment

1. **Build production images**
   ```bash
   # Backend
   docker build -t movemaster-backend:latest ./backend
   
   # Frontend (with production build)
   cd frontend
   npm run build
   docker build -t movemaster-frontend:latest .
   ```

2. **Deploy to your server**
   ```bash
   # Push to registry
   docker tag movemaster-backend:latest registry.example.com/movemaster-backend
   docker push registry.example.com/movemaster-backend
   
   # Similar for frontend
   ```

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Seed data loaded (item templates, room templates)
- [ ] Google Maps API working
- [ ] Email service configured (test with sample quote)
- [ ] Admin dashboard accessible
- [ ] SSL certificates configured
- [ ] CORS properly configured
- [ ] Error monitoring setup (Sentry recommended)
- [ ] Backup strategy in place
- [ ] Domain DNS configured

## Monitoring

### Backend Health Check

```bash
curl https://api.movemaster.de/health
# Should return: {"status": "healthy"}
```

### Frontend Check

```bash
curl https://movemaster.de
# Should return HTML
```

### Database Check

```bash
railway run alembic current
# Should show current migration version
```

## Troubleshooting

### Database Connection Issues

```bash
# Check DATABASE_URL format
# Should be: postgresql://user:pass@host:port/dbname

# Test connection
railway run python -c "from app.core.database import engine; engine.connect()"
```

### Google Maps API Errors

- Check API key is valid
- Ensure "Distance Matrix API" and "Geocoding API" are enabled
- Check billing is enabled on Google Cloud Console

### CORS Errors

- Verify frontend URL is in `ALLOWED_ORIGINS` (backend/.env)
- Check Vercel deployment URL matches

## Scaling

### Backend Scaling

- Railway: Auto-scales based on load
- Manual: Increase memory/CPU in project settings

### Frontend Scaling

- Vercel: Auto-scales globally via CDN
- No manual configuration needed

### Database Scaling

- Supabase: Upgrade plan for more connections
- Railway: Upgrade PostgreSQL plugin

## Backup Strategy

### Database Backups

```bash
# Automated via Supabase (daily backups included)
# Manual backup:
railway run pg_dump -Fc $DATABASE_URL > backup.dump

# Restore:
railway run pg_restore -d $DATABASE_URL backup.dump
```

### Code Backups

- Use Git for version control
- Tag releases: `git tag v1.0.0`
- Push to GitHub/GitLab for safety

## Security

- [ ] Environment variables never committed to Git
- [ ] SECRET_KEY is cryptographically secure
- [ ] API rate limiting enabled
- [ ] Database RLS policies configured (Supabase)
- [ ] HTTPS enforced everywhere
- [ ] Admin endpoints protected by authentication

## Cost Estimates (Monthly)

- **Supabase Free Tier:** $0 (500MB DB, 50k API calls)
- **Railway Hobby:** $5 (backend hosting)
- **Vercel Hobby:** $0 (frontend hosting)
- **Google Maps API:** ~$20-50 (depends on usage)

**Total:** ~$25-55/month for small-medium traffic

## Support

For issues:
1. Check logs: `railway logs` or Vercel deployment logs
2. Review environment variables
3. Test API endpoints manually
4. Check database connection

For questions, contact: support@movemaster.de
