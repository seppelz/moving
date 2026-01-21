# MoveMaster - Getting Started Guide

Welcome to MoveMaster! This guide will help you get the project up and running quickly.

## 🎯 Project Overview

MoveMaster is a white-label moving calculation tool designed for German moving companies. It features:

- **Smart Defaults**: Pre-filled room templates based on apartment size
- **Progressive Disclosure**: 4-step wizard that doesn't overwhelm users
- **Real-time Pricing**: Instant quote calculation with German market rates
- **Admin Dashboard**: Comprehensive quote management and analytics
- **White-Label Ready**: Full multi-tenancy with custom branding
- **German Market Specific**: HVZ permits, kitchen assembly, external lift suggestions

## 🚀 Quick Start (5 minutes)

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or Supabase account)
- Google Maps API key

### 1. Clone and Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials

# Frontend
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your API URL
```

### 2. Database Setup

```bash
cd backend

# Create database (if using local PostgreSQL)
createdb movemaster

# Run migrations
alembic upgrade head

# Seed with default data
python -m app.utils.seed_data
```

### 3. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open http://localhost:3000 🎉

## 📁 Project Structure

```
movemaster/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Configuration
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utilities
│   ├── alembic/         # Database migrations
│   └── tests/           # Backend tests
│
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API clients
│   │   ├── store/       # State management
│   │   └── types/       # TypeScript types
│   └── public/          # Static assets
│
├── docs/                # Documentation
├── DEPLOYMENT.md        # Deployment guide
├── WHITE_LABEL.md       # White-label guide
└── docker-compose.yml   # Docker setup
```

## 🔑 Key Features & Files

### Backend

**Pricing Engine** (`backend/app/services/pricing_engine.py`)
- Real-time quote calculation
- German market defaults (€25-35/m³, €1.50-2.50/km)
- Floor surcharges, service costs
- Smart suggestions (external lift, HVZ)

**Google Maps Integration** (`backend/app/services/maps_service.py`)
- Distance calculation
- Postal code validation
- Address geocoding
- Route optimization

**PDF Generation** (`backend/app/services/pdf_service.py`)
- Professional quote PDFs
- Company branding
- QR codes for acceptance
- Terms & conditions

**Email Automation** (`backend/app/services/email_service.py`)
- Instant confirmation emails
- PDF quote delivery
- Follow-up automation
- HTML templates

### Frontend

**4-Step Calculator**

1. **Instant Estimate** (`frontend/src/components/calculator/StepInstant.tsx`)
   - Postal code inputs (from → to)
   - Apartment size selector
   - Real-time price display

2. **Smart Inventory** (`frontend/src/components/calculator/StepInventory.tsx`)
   - Pre-filled room templates
   - Visual item selection
   - Category-based browsing
   - Real-time volume calculation

3. **Services & Extras** (`frontend/src/components/calculator/StepServices.tsx`)
   - Packing service toggle
   - HVZ permit checkbox
   - Kitchen assembly slider (linear meters)
   - External lift auto-suggestion
   - Floor/elevator inputs

4. **Contact & Submit** (`frontend/src/components/calculator/StepContact.tsx`)
   - Email/phone/name capture
   - Final quote display
   - Submission with confirmation
   - Success screen

**Admin Dashboard** (`frontend/src/pages/admin/`)
- Quote list with filters
- Status management (draft → sent → accepted)
- Analytics dashboard
- Pricing configuration

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest                    # Run all tests
pytest tests/test_pricing_engine.py  # Specific test
pytest --cov             # With coverage
```

### Frontend Tests

```bash
cd frontend
npm run test            # Run tests
npm run test:watch      # Watch mode
```

## 📊 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

**Public:**
- `POST /api/v1/quote/calculate` - Calculate instant quote
- `POST /api/v1/quote/submit` - Submit full quote
- `GET /api/v1/quote/inventory/templates` - Get item templates
- `GET /api/v1/quote/room/templates` - Get room templates

**Admin:**
- `GET /api/v1/admin/quotes` - List all quotes
- `GET /api/v1/admin/analytics` - Get analytics data
- `PATCH /api/v1/admin/quotes/{id}` - Update quote status
- `PUT /api/v1/admin/pricing` - Update pricing config

## 🎨 Customization

### Pricing Configuration

Edit `backend/app/core/config.py`:

```python
BASE_RATE_PER_M3_MIN: float = 25.0  # Min €/m³
BASE_RATE_PER_M3_MAX: float = 35.0  # Max €/m³
RATE_PER_KM_NEAR: float = 2.0       # First 50km
RATE_PER_KM_FAR: float = 1.0        # Beyond 50km
```

### Branding

For white-label partners, see [`WHITE_LABEL.md`](WHITE_LABEL.md).

Quick branding via database:

```sql
UPDATE companies 
SET 
  name = 'Your Company',
  logo_url = 'https://your-cdn.com/logo.png',
  pricing_config = '{
    "branding": {
      "primary_color": "#ff6600",
      "tagline": "Your Custom Tagline"
    }
  }'
WHERE slug = 'default';
```

### Item Templates

Add custom items:

```python
# backend/app/utils/seed_data.py
items = [
    {
        "name": "Custom Item",
        "category": "other",
        "volume_m3": 1.5,
        "weight_kg": 20,
        "disassembly_minutes": 10,
        "packing_minutes": 5
    }
]
```

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Set environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m app.utils.seed_data

# View logs
docker-compose logs -f
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- PostgreSQL: localhost:5432

## 🚢 Production Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**

1. **Backend** → Railway/Render
2. **Frontend** → Vercel
3. **Database** → Supabase

Estimated cost: ~€25-55/month

## 🔧 Troubleshooting

### Backend won't start

```bash
# Check Python version
python --version  # Should be 3.11+

# Check dependencies
pip list

# Check database connection
python -c "from app.core.database import engine; engine.connect()"
```

### Frontend build errors

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+
```

### Google Maps API errors

- Ensure API key is valid
- Enable "Distance Matrix API" and "Geocoding API"
- Check billing is enabled

### Database migration errors

```bash
# Reset migrations (development only!)
alembic downgrade base
alembic upgrade head

# Or create new migration
alembic revision --autogenerate -m "description"
```

## 📚 Additional Resources

- **API Documentation**: http://localhost:8000/docs
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **White-Label Guide**: [WHITE_LABEL.md](WHITE_LABEL.md)
- **Backend README**: [backend/README.md](backend/README.md)
- **Frontend README**: [frontend/README.md](frontend/README.md)

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Make changes and test
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 License

Proprietary - All rights reserved

## 💬 Support

- **Email**: support@movemaster.de
- **Documentation**: https://docs.movemaster.de
- **Issues**: GitHub Issues (if repo is public)

## 🎉 Success Checklist

After setup, verify:

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Database migrations completed
- [ ] Seed data loaded
- [ ] Can calculate a quote
- [ ] Can submit a quote
- [ ] Admin dashboard accessible
- [ ] Tests passing

## 🚀 Next Steps

1. **Customize branding** - Update company name and colors
2. **Configure pricing** - Set your market rates
3. **Add item templates** - Customize furniture items
4. **Test calculator flow** - Submit a test quote
5. **Set up email** - Configure SMTP for notifications
6. **Deploy to production** - Follow DEPLOYMENT.md
7. **Add white-label partners** - See WHITE_LABEL.md

---

**Welcome to MoveMaster! Let's make moving easier for everyone.** 🚚✨
