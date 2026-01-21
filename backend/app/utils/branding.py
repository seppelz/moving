"""
Branding utilities for white-label support
"""
from typing import Dict, Any
from app.models.company import Company


class BrandingService:
    """
    Service to handle company-specific branding
    """
    
    @staticmethod
    def get_branding(company: Company) -> Dict[str, Any]:
        """
        Get branding configuration for a company
        
        Returns colors, logos, and other brand assets
        """
        # Default branding
        default_branding = {
            "company_name": "MoveMaster",
            "logo_url": "/assets/logo.png",
            "primary_color": "#0369a1",
            "secondary_color": "#0284c7",
            "accent_color": "#38bdf8",
            "font_family": "Inter, sans-serif",
            "tagline": "Ihr Umzug, vereinfacht",
            "support_email": "info@movemaster.de",
            "support_phone": "+49 30 1234 5678",
            "address": "Musterstraße 123, 10115 Berlin",
            "website": "https://movemaster.de"
        }
        
        # Merge with company-specific branding if available
        company_branding = company.pricing_config.get("branding", {}) if company.pricing_config else {}
        
        return {
            **default_branding,
            "company_name": company.name,
            "logo_url": company.logo_url or default_branding["logo_url"],
            **company_branding
        }
    
    @staticmethod
    def get_pricing_overrides(company: Company) -> Dict[str, float]:
        """
        Get company-specific pricing overrides
        
        Allows white-label partners to set custom rates
        """
        if not company.pricing_config:
            return {}
        
        return company.pricing_config.get("pricing_overrides", {})
    
    @staticmethod
    def apply_pricing_overrides(
        base_config: Dict[str, float],
        company: Company
    ) -> Dict[str, float]:
        """
        Apply company-specific pricing overrides to base config
        """
        overrides = BrandingService.get_pricing_overrides(company)
        return {**base_config, **overrides}


branding_service = BrandingService()
