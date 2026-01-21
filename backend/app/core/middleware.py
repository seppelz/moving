"""
Custom middleware for MoveMaster
Includes white-label/multi-tenancy support
"""
from fastapi import Request, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.company import Company
from typing import Optional


class TenantMiddleware:
    """
    Middleware to identify tenant (company) from subdomain or header
    
    Examples:
    - acme.movemaster.de → company slug: "acme"
    - movemaster.de → company slug: "default"
    - Header: X-Company-Slug: acme → company slug: "acme"
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Get host header
        headers = dict(scope.get("headers", []))
        host = headers.get(b"host", b"").decode("utf-8")
        
        # Extract subdomain
        company_slug = self.extract_company_slug(host, headers)
        
        # Store in scope for use in routes
        scope["company_slug"] = company_slug
        
        await self.app(scope, receive, send)
    
    def extract_company_slug(self, host: str, headers: dict) -> str:
        """
        Extract company slug from host or headers
        
        Priority:
        1. X-Company-Slug header
        2. Subdomain (first part of host)
        3. Default to "default"
        """
        # Check header first
        company_header = headers.get(b"x-company-slug")
        if company_header:
            return company_header.decode("utf-8")
        
        # Extract from subdomain
        parts = host.split(".")
        
        # Handle different scenarios:
        # - localhost:8000 → "default"
        # - movemaster.de → "default"
        # - acme.movemaster.de → "acme"
        # - acme.movemaster.co.uk → "acme"
        
        if len(parts) >= 3 and not host.startswith("www"):
            # Has subdomain (not www)
            return parts[0]
        
        return "default"


def get_current_company(request: Request, db: Session) -> Optional[Company]:
    """
    Get current company from request scope
    Used as dependency in routes that need tenant context
    """
    company_slug = getattr(request.scope, "company_slug", "default")
    
    company = db.query(Company).filter(Company.slug == company_slug).first()
    
    if not company:
        # Auto-create default company if it doesn't exist
        if company_slug == "default":
            company = Company(
                name="MoveMaster",
                slug="default",
                pricing_config={}
            )
            db.add(company)
            db.commit()
            db.refresh(company)
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Company '{company_slug}' not found"
            )
    
    return company
