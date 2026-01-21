"""
Database configuration and session management
"""
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

logger.info(f"Creating database engine...")
logger.info(f"Database URL starts with: {settings.DATABASE_URL.split('@')[0] if '@' in settings.DATABASE_URL else settings.DATABASE_URL[:30]}...")

try:
    # Add pool settings for better connection handling
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using them
        pool_recycle=300,     # Recycle connections after 5 minutes
        echo=False            # Set to True for SQL query logging
    )
    logger.info("✓ Database engine created successfully")
except Exception as e:
    logger.error(f"✗ Failed to create database engine: {e}")
    # Create a fallback SQLite engine so app can still start
    logger.warning("Creating fallback SQLite engine for debugging")
    engine = create_engine("sqlite:///./fallback.db")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
