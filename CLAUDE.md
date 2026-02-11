# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MoveMaster is a white-label SaaS moving cost calculator for the German market. Full-stack app with a FastAPI backend and React frontend. Multi-tenant architecture where each moving company gets branded quotes with configurable pricing.

## Development Commands

### Backend (from `backend/`)
```bash
# Setup
python -m venv venv && venv\Scripts\activate  # Windows
pip install -r requirements.txt
alembic upgrade head                           # Run migrations
python -m app.utils.seed_profiles              # Populate smart profiles

# Run
uvicorn app.main:app --reload --port 8000      # Dev server (Swagger at /docs)

# Test
pytest                                         # Run test suite
```

### Frontend (from `frontend/`)
```bash
npm install
npm run dev       # Vite dev server on port 3000 (proxies /api → localhost:8000)
npm run build     # Production build (tsc && vite build)
npm run lint      # ESLint
```

### Full Stack
```bash
docker-compose up   # PostgreSQL:5432, Backend:8000, Frontend:3000
```

## Architecture

### Backend (`backend/app/`)
- **FastAPI** with Python 3.11+, **PostgreSQL** via SQLAlchemy + Alembic migrations
- `api/v1/` — REST endpoints: `quote.py` (calculation/submission), `smart_quote.py` (AI prediction), `admin.py` (dashboard CRUD), `branding.py` (white-label)
- `services/` — Business logic: `pricing_engine.py` (volume/distance/labor costing), `smart_predictor.py` (apartment profile matching), `maps_service.py` (Google Maps), `pdf_service.py` (ReportLab), `email_service.py`
- `models/` — SQLAlchemy ORM: quotes, companies, apartment_profiles, item_templates, room_templates
- `schemas/` — Pydantic request/response models
- `core/config.py` — Settings with German market pricing defaults (€25-35/m³, distance tiers, floor surcharges, HVZ permits)

### Frontend (`frontend/src/`)
- **React 18 + TypeScript + Vite**, styled with **Tailwind CSS**
- `store/calculatorStore.ts` — **Zustand** store managing all wizard state
- `pages/Calculator.tsx` — Main 6-step wizard container
- `components/calculator/` — Step components: StepInstant (postal codes), StepSmartProfile (user profile), StepSmartPreview (AI prediction), StepInventory (manual items), StepServices (add-ons), StepContact (submission)
- `pages/admin/` — Dashboard, Quotes list, QuoteDetail, PricingConfig
- `services/api.ts` — Axios client wrapping all backend endpoints
- `types/index.ts` — Shared TypeScript enums and interfaces
- Path alias: `@/` → `./src/`

### Key Domain Concepts
- **Smart Prediction:** Matches user inputs (apartment size + household type + furnishing level) to pre-built apartment profiles for volume estimation with 85-95% confidence
- **Pricing Engine:** Base rate per m³ + distance tiers (€2/km first 50km, €1/km beyond) + labor (€60-80/hr, 2-person min) + surcharges (floor %, HVZ €120, external lift €350-500)
- **Quote Lifecycle:** draft → sent → accepted/rejected → expired (auto-expiry background task)
- **Multi-tenant:** Quotes scoped by `company_id`, each company has own branding and pricing config

## Environment Variables

Backend: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, `GOOGLE_MAPS_API_KEY`, `SECRET_KEY`, `SMTP_USER`, `SMTP_PASSWORD`
Frontend: `VITE_API_URL` (defaults to `http://localhost:8000`)

## Deployment

- Backend → Railway (Dockerfile runs alembic + uvicorn)
- Frontend → Vercel (`tsc && vite build`)
- All UI text is in German
