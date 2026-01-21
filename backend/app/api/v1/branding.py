"""
Branding API endpoint for white-label support
Returns company-specific branding configuration
"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_company
from app.utils.branding import branding_service
from app.models.company import Company

router = APIRouter()


@router.get("/branding")
async def get_branding(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get branding configuration for current tenant
    
    Used by frontend to apply company-specific styling and content
    """
    company = get_current_company(request, db)
    
    branding = branding_service.get_branding(company)
    
    return {
        "company": {
            "id": str(company.id),
            "name": company.name,
            "slug": company.slug
        },
        "branding": branding
    }
