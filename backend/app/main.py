"""
MoveMaster Backend API
FastAPI application entry point
"""
import os
import sys
import logging
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("="*60)
logger.info("MOVEMASTER BACKEND STARTING UP")
logger.info(f"Python version: {sys.version}")
logger.info(f"Working directory: {os.getcwd()}")
logger.info("="*60)

# Import settings with error handling
try:
    logger.info("Loading configuration...")
    from app.core.config import settings
    logger.info("✓ Configuration loaded successfully")
except Exception as e:
    logger.error(f"✗ Failed to load configuration: {e}")
    raise

app = FastAPI(
    title="MoveMaster API",
    description="White-label moving calculation tool API",
    version="1.0.0",
)

# Startup migrations
@app.on_event("startup")
async def startup_migrations():
    """Run simple migrations for schema changes"""
    from sqlalchemy import text
    from app.core.database import engine
    
    logger.info("Checking for database schema updates...")
    try:
        with engine.begin() as conn:
            try:
                conn.execute(text("ALTER TABLE quotes ADD COLUMN is_fixed_price BOOLEAN DEFAULT FALSE"))
                logger.info("✓ Database updated: Added 'is_fixed_price' column to quotes table")
            except Exception as e:
                error_msg = str(e).lower()
                if "already exists" in error_msg or "duplicate column" in error_msg:
                    logger.info("- Column 'is_fixed_price' already exists, skipping")
                else:
                    logger.warning(f"- Could not check/add 'is_fixed_price' column: {e}")
    except Exception as e:
        logger.error(f"✗ Schema update failed: {e}")

# Background cleanup task
async def background_cleanup():
    """Simple background task that runs once a day"""
    from app.core.database import SessionLocal
    from app.services.quote_service import quote_service
    
    logger.info("Starting background cleanup loop (Auto-Expire Quotes)")
    
    while True:
        try:
            logger.info("Running scheduled cleanup: Checking for expired quotes...")
            db = SessionLocal()
            try:
                count = quote_service.auto_expire_quotes(db)
                if count > 0:
                    logger.info(f"Cleanup: Expired {count} old quotes")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error in background cleanup: {e}")
        
        # Wait for 24 hours before next run
        await asyncio.sleep(24 * 3600)

@app.on_event("startup")
async def startup_warnings():
    """Warn if critical environment variables are not set and start background tasks"""
    logger.info("Running startup checks...")
    
    warnings = []
    configs = {}
    
    try:
        configs['SECRET_KEY'] = "SET" if settings.SECRET_KEY != "dev-secret-key-change-in-production" else "DEFAULT"
        configs['DATABASE_URL'] = "SET" if settings.DATABASE_URL != "sqlite:///./test.db" else "DEFAULT"
        configs['SUPABASE_URL'] = "SET" if settings.SUPABASE_URL else "MISSING"
        configs['SUPABASE_KEY'] = "SET" if settings.SUPABASE_KEY else "MISSING"
        configs['GOOGLE_MAPS_API_KEY'] = "SET" if settings.GOOGLE_MAPS_API_KEY else "MISSING"
        
        logger.info("Configuration status:")
        for key, value in configs.items():
            logger.info(f"  {key}: {value}")
        
        if settings.SECRET_KEY == "dev-secret-key-change-in-production":
            warnings.append("⚠️  SECRET_KEY is using default value - set in production!")
        if not settings.SUPABASE_URL:
            warnings.append("⚠️  SUPABASE_URL not set - authentication will not work")
        if settings.DATABASE_URL == "sqlite:///./test.db":
            warnings.append("⚠️  DATABASE_URL not set - using SQLite (not for production!)")
        if not settings.GOOGLE_MAPS_API_KEY:
            warnings.append("⚠️  GOOGLE_MAPS_API_KEY not set - distance calculation will fail")
        
        if warnings:
            logger.warning("\n" + "="*60)
            logger.warning("CONFIGURATION WARNINGS:")
            for warning in warnings:
                logger.warning(f"  {warning}")
            logger.warning("="*60 + "\n")
        else:
            logger.info("✓ All critical environment variables are set")
            
    except Exception as e:
        logger.error(f"Error during startup checks: {e}")
        raise
    
    # Test database connection
    try:
        logger.info("Testing database connection...")
        from app.core.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✓ Database connection successful")
    except Exception as e:
        logger.error(f"✗ Database connection failed: {e}")
    
    logger.info("Startup complete - application ready")
    
    # Start background cleanup task
    asyncio.create_task(background_cleanup())

# CORS middleware
try:
    logger.info("Setting up CORS middleware...")
    origins = settings.ALLOWED_ORIGINS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*\.railway\.app)(:\d+)?",
    )
    logger.info(f"✓ CORS configured for origins: {settings.ALLOWED_ORIGINS}")
except Exception as e:
    logger.error(f"✗ Failed to configure CORS: {e}")
    raise

# Import and include routers
try:
    logger.info("Loading API routers...")
    from app.api.v1 import quote, admin, smart_quote
    app.include_router(quote.router, prefix="/api/v1/quote", tags=["quotes"])
    app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
    app.include_router(smart_quote.router, prefix="/api/v1/smart", tags=["smart-prediction"])
    logger.info("✓ All routers loaded")
except Exception as e:
    logger.error(f"✗ Failed to load routers: {e}")
    raise

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "MoveMaster API",
        "version": "1.0.0",
        "status": "running",
        "port": os.getenv("PORT", "unknown")
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    config_status = {
        "database": "configured" if settings.DATABASE_URL != "sqlite:///./test.db" else "default",
        "supabase": "configured" if settings.SUPABASE_URL else "missing",
        "maps_api": "configured" if settings.GOOGLE_MAPS_API_KEY else "missing",
        "secret_key": "configured" if settings.SECRET_KEY != "dev-secret-key-change-in-production" else "default"
    }
    return {
        "status": "healthy",
        "environment": os.getenv("RAILWAY_ENVIRONMENT", "development"),
        "port": os.getenv("PORT", "not_set"),
        "config": config_status
    }

logger.info("Application module loaded successfully")
