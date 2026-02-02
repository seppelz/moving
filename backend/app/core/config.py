"""
Configuration settings for MoveMaster backend
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "MoveMaster"
    ADMIN_EMAIL: str = Field(default="admin@movemaster.de", env="ADMIN_EMAIL")
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://app.movemaster.de",
    ]
    
    # Supabase
    SUPABASE_URL: str = Field(default="", env="SUPABASE_URL")
    SUPABASE_KEY: str = Field(default="", env="SUPABASE_KEY")
    SUPABASE_SERVICE_KEY: str = Field(default="", env="SUPABASE_SERVICE_KEY")
    
    # Database
    DATABASE_URL: str = Field(default="sqlite:///./test.db", env="DATABASE_URL")
    
    # Google Maps
    GOOGLE_MAPS_API_KEY: str = Field(default="", env="GOOGLE_MAPS_API_KEY")
    
    # Email (optional - can use Supabase Auth or SendGrid)
    SMTP_HOST: str = Field(default="smtp.gmail.com", env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USER: str = Field(default="", env="SMTP_USER")
    SMTP_PASSWORD: str = Field(default="", env="SMTP_PASSWORD")
    
    # Security
    SECRET_KEY: str = Field(default="dev-secret-key-change-in-production", env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Pricing Defaults (German Market - Validated January 2026)
    # See backend/docs/PRICING_RESEARCH.md for full market analysis
    
    # Volume-based pricing (per m³)
    # Market range: €25-40/m³ (mid-range companies)
    # MoveMaster positioning: Premium value
    BASE_RATE_PER_M3_MIN: float = 25.0  # Competitive baseline
    BASE_RATE_PER_M3_MAX: float = 35.0  # Premium service quality
    
    # Distance rates (tiered pricing)
    # Near: €1.50-2.50/km market average
    # Far: €0.80-1.20/km market average
    RATE_PER_KM_NEAR: float = 2.0   # First 50km - market average
    RATE_PER_KM_FAR: float = 1.0    # Beyond 50km - fair pricing
    KM_THRESHOLD: float = 50.0      # Industry standard threshold
    
    # Labor costs (per mover per hour)
    # Market range: €45-65/hour (2026)
    # Note: Current rates are upper quartile - consider adjustment to €50-70 for better competitiveness
    HOURLY_LABOR_MIN: float = 60.0  # ⚠️ Upper quartile
    HOURLY_LABOR_MAX: float = 80.0  # ⚠️ Upper quartile
    MIN_MOVERS: int = 2              # Standard 2-man crew minimum
    
    # Surcharges and additional services
    FLOOR_SURCHARGE_PERCENT: float = 0.15  # 15% per floor above 2nd without elevator
    
    # German-specific services (validated 2026)
    HVZ_PERMIT_COST: float = 120.0              # €80-150 market range - mid-range
    KITCHEN_ASSEMBLY_PER_METER: float = 45.0    # €35-60 market range - good value
    EXTERNAL_LIFT_COST_MIN: float = 350.0       # €250-600 market range - competitive
    EXTERNAL_LIFT_COST_MAX: float = 500.0
    
    # Regional multipliers (optional - for future implementation)
    # Apply based on postal code or city detection
    ENABLE_REGIONAL_PRICING: bool = False
    REGIONAL_MULTIPLIERS: dict = {
        "munich": 1.15,      # +15% (postal: 80###)
        "frankfurt": 1.12,   # +12% (postal: 60###)
        "stuttgart": 1.10,   # +10% (postal: 70###)
        "hamburg": 1.10,     # +10% (postal: 20###, 22###)
        "berlin": 1.08,      # +8%  (postal: 10###, 12###)
        "cologne": 1.05,     # +5%  (postal: 50###)
        "default": 1.0       # Baseline (Leipzig, Dresden, etc.)
    }
    
    # Seasonal pricing (optional - for future implementation)
    # Peak: May-September (+15-20%)
    # Standard: March-April, October-November (0%)
    # Off-peak: December-February (-10% to 0%)
    ENABLE_SEASONAL_PRICING: bool = False
    SEASONAL_PEAK_MONTHS: list = [5, 6, 7, 8, 9]  # May through September
    SEASONAL_PEAK_MULTIPLIER: float = 1.15         # +15% during peak season
    SEASONAL_OFFPEAK_MONTHS: list = [12, 1, 2]    # December through February
    SEASONAL_OFFPEAK_MULTIPLIER: float = 1.0       # No discount (lease changeovers)
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
