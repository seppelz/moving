#!/usr/bin/env python3
"""
Debug script to test Railway environment and startup issues
Run this via Railway CLI: railway run python debug_startup.py
"""
import os
import sys

print("="*60)
print("MOVEMASTER DEBUG SCRIPT")
print("="*60)

# Check Python version
print(f"\nPython version: {sys.version}")
print(f"Python executable: {sys.executable}")

# Check working directory
print(f"\nWorking directory: {os.getcwd()}")
print(f"Directory contents: {os.listdir('.')}")

# Check environment variables
print("\n" + "="*60)
print("ENVIRONMENT VARIABLES")
print("="*60)

critical_vars = [
    "PORT",
    "DATABASE_URL",
    "SECRET_KEY",
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "SUPABASE_SERVICE_KEY",
    "GOOGLE_MAPS_API_KEY",
    "RAILWAY_ENVIRONMENT"
]

for var in critical_vars:
    value = os.getenv(var)
    if value:
        if "KEY" in var or "PASSWORD" in var or "SECRET" in var:
            print(f"{var}: {'*' * 10} (hidden)")
        elif "URL" in var and "@" in value:
            # Hide password in URLs
            parts = value.split("@")
            print(f"{var}: {parts[0].split(':')[0]}://***@{parts[1]}")
        else:
            print(f"{var}: {value[:50]}..." if len(value) > 50 else f"{var}: {value}")
    else:
        print(f"{var}: NOT SET ❌")

# Test imports
print("\n" + "="*60)
print("TESTING IMPORTS")
print("="*60)

try:
    print("Importing FastAPI...", end=" ")
    import fastapi
    print(f"✓ (version {fastapi.__version__})")
except Exception as e:
    print(f"✗ ERROR: {e}")

try:
    print("Importing SQLAlchemy...", end=" ")
    import sqlalchemy
    print(f"✓ (version {sqlalchemy.__version__})")
except Exception as e:
    print(f"✗ ERROR: {e}")

try:
    print("Importing Pydantic...", end=" ")
    import pydantic
    print(f"✓ (version {pydantic.__version__})")
except Exception as e:
    print(f"✗ ERROR: {e}")

# Test configuration loading
print("\n" + "="*60)
print("TESTING CONFIGURATION")
print("="*60)

try:
    print("Loading app.core.config...", end=" ")
    from app.core.config import settings
    print("✓")
    
    print(f"  DATABASE_URL set: {'Yes' if settings.DATABASE_URL != 'sqlite:///./test.db' else 'No (using default)'}")
    print(f"  SECRET_KEY set: {'Yes' if settings.SECRET_KEY != 'dev-secret-key-change-in-production' else 'No (using default)'}")
    print(f"  SUPABASE_URL set: {'Yes' if settings.SUPABASE_URL else 'No'}")
    print(f"  GOOGLE_MAPS_API_KEY set: {'Yes' if settings.GOOGLE_MAPS_API_KEY else 'No'}")
    
except Exception as e:
    print(f"✗ ERROR: {e}")
    import traceback
    traceback.print_exc()

# Test database connection
print("\n" + "="*60)
print("TESTING DATABASE CONNECTION")
print("="*60)

try:
    print("Creating database engine...", end=" ")
    from app.core.database import engine
    print("✓")
    
    print("Testing connection...", end=" ")
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("✓")
        print(f"  Connection successful!")
        
except Exception as e:
    print(f"✗ ERROR: {e}")
    import traceback
    traceback.print_exc()

# Test FastAPI app creation
print("\n" + "="*60)
print("TESTING FASTAPI APP")
print("="*60)

try:
    print("Importing app.main...", end=" ")
    from app.main import app
    print("✓")
    
    print(f"  App title: {app.title}")
    print(f"  Routes: {len(app.routes)}")
    
    # List all routes
    print("\n  Available routes:")
    for route in app.routes:
        if hasattr(route, 'path'):
            print(f"    {route.path}")
    
except Exception as e:
    print(f"✗ ERROR: {e}")
    import traceback
    traceback.print_exc()

# Network check
print("\n" + "="*60)
print("NETWORK INFORMATION")
print("="*60)

try:
    import socket
    hostname = socket.gethostname()
    ip = socket.gethostbyname(hostname)
    print(f"Hostname: {hostname}")
    print(f"IP Address: {ip}")
    
    port = os.getenv("PORT", "8000")
    print(f"Expected PORT: {port}")
    
except Exception as e:
    print(f"Error getting network info: {e}")

print("\n" + "="*60)
print("DEBUG SCRIPT COMPLETE")
print("="*60)
