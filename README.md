# MoveMaster

A white-label moving calculation tool for German moving companies that reduces user friction and increases conversion rates through smart defaults and progressive disclosure.

## Features

- **Smart Defaults**: Pre-filled room templates based on apartment size
- **Progressive Disclosure**: 4-step wizard that doesn't overwhelm users
- **Real-time Pricing**: Instant quote calculation based on volume, distance, and services
- **German Market Specific**: HVZ permits, kitchen assembly, external lift suggestions
- **Admin Dashboard**: Quote management, pricing configuration, and analytics
- **White-Label Ready**: Multi-tenant architecture with custom branding

## Tech Stack

### Backend
- Python 3.11+ with FastAPI
- PostgreSQL via Supabase
- SQLAlchemy ORM
- Google Maps API
- ReportLab for PDF generation

### Frontend
- React 18 with TypeScript
- Tailwind CSS
- Framer Motion
- Zustand state management
- React Hook Form

## Project Structure

```
movemaster/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── core/     # Config, security
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic
│   │   └── utils/    # Helpers
│   ├── alembic/      # DB migrations
│   └── tests/
├── frontend/         # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   └── package.json
└── docs/            # Documentation
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (via Supabase)
- Google Maps API key

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
uvicorn app.main:app --reload --port 8080
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Database Setup

```bash
cd backend
alembic upgrade head
python -m app.utils.seed_data  # Seed with default templates
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8080/docs
- ReDoc: http://localhost:8080/redoc

## Deployment

### Backend (Railway/Render)
1. Connect GitHub repository
2. Set environment variables
3. Deploy from main branch

### Frontend (Vercel)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Configure environment variables

## License

Proprietary - All rights reserved

## Support

For questions or support, contact: support@movemaster.de
