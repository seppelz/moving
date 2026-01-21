"""
MoveMaster Backend API
FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="MoveMaster API",
    description="White-label moving calculation tool API",
    version="1.0.0",
)

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
    return {"message": "MoveMaster API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
