"""
MoveMaster Backend API
FastAPI application entry point
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="MoveMaster API",
    description="White-label moving calculation tool API",
    version="1.0.0",
)

# Startup warnings for missing configuration
@app.on_event("startup")
async def startup_warnings():
    """Warn if critical environment variables are not set"""
    warnings = []
    
    if settings.SECRET_KEY == "dev-secret-key-change-in-production":
        warnings.append("⚠️  SECRET_KEY is using default value - set in production!")
    
    if not settings.SUPABASE_URL:
        warnings.append("⚠️  SUPABASE_URL not set - authentication will not work")
    
    if settings.DATABASE_URL == "sqlite:///./test.db":
        warnings.append("⚠️  DATABASE_URL not set - using SQLite (not for production!)")
    
    if not settings.GOOGLE_MAPS_API_KEY:
        warnings.append("⚠️  GOOGLE_MAPS_API_KEY not set - distance calculation will fail")
    
    if warnings:
        print("\n" + "="*60)
        print("CONFIGURATION WARNINGS:")
        for warning in warnings:
            print(f"  {warning}")
        print("="*60 + "\n")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from app.api.v1 import quote, admin, smart_quote

app.include_router(quote.router, prefix="/api/v1/quote", tags=["quotes"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(smart_quote.router, prefix="/api/v1/smart", tags=["smart-prediction"])


@app.get("/")
async def root():
    return {
        "message": "MoveMaster API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for Railway and monitoring"""
    config_status = {
        "database": "configured" if settings.DATABASE_URL != "sqlite:///./test.db" else "default",
        "supabase": "configured" if settings.SUPABASE_URL else "missing",
        "maps_api": "configured" if settings.GOOGLE_MAPS_API_KEY else "missing",
        "secret_key": "configured" if settings.SECRET_KEY != "dev-secret-key-change-in-production" else "default"
    }
    
    return {
        "status": "healthy",
        "environment": os.getenv("RAILWAY_ENVIRONMENT", "development"),
        "config": config_status
    }
