"""
Admin API endpoints for quote management and configuration
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

from app.core.database import get_db
from app.models.quote import Quote, QuoteStatus
from app.models.company import Company
from app.schemas.quote import QuoteResponse
from app.services.pdf_service import pdf_service
from app.services.email_service import email_service

router = APIRouter()


# TODO: Add proper authentication middleware
# For now, these endpoints are unprotected for development


@router.get("/quotes", response_model=List[QuoteResponse])
async def list_quotes(
    status_filter: Optional[QuoteStatus] = None,
    company_slug: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List all quotes with optional filtering"""
    query = db.query(Quote)
    
    if status_filter:
        query = query.filter(Quote.status == status_filter)
    
    if company_slug:
        company = db.query(Company).filter(Company.slug == company_slug).first()
        if company:
            query = query.filter(Quote.company_id == company.id)
    
    quotes = query.order_by(desc(Quote.created_at)).offset(skip).limit(limit).all()
    
    return [
        QuoteResponse(
            id=str(q.id),
            company_id=str(q.company_id),
            customer_email=q.customer_email,
            customer_phone=q.customer_phone,
            customer_name=q.customer_name,
            origin_address=q.origin_address,
            destination_address=q.destination_address,
            distance_km=q.distance_km,
            estimated_hours=q.estimated_hours,
            inventory=q.inventory,
            services=q.services,
            min_price=q.min_price,
            max_price=q.max_price,
            volume_m3=q.volume_m3,
            status=q.status,
            pdf_url=q.pdf_url,
            created_at=q.created_at
        )
        for q in quotes
    ]


@router.get("/quotes/{quote_id}", response_model=QuoteResponse)
async def get_quote(
    quote_id: str,
    db: Session = Depends(get_db)
):
    """Get specific quote by ID"""
    import uuid
    
    # Convert string to UUID
    try:
        quote_uuid = uuid.UUID(quote_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid quote ID format"
        )
    
    quote = db.query(Quote).filter(Quote.id == quote_uuid).first()
    
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found"
        )
    
    return QuoteResponse(
        id=str(quote.id),
        company_id=str(quote.company_id),
        customer_email=quote.customer_email,
        customer_phone=quote.customer_phone,
        customer_name=quote.customer_name,
        origin_address=quote.origin_address,
        destination_address=quote.destination_address,
        distance_km=quote.distance_km,
        estimated_hours=quote.estimated_hours,
        inventory=quote.inventory,
        services=quote.services,
        min_price=quote.min_price,
        max_price=quote.max_price,
        volume_m3=quote.volume_m3,
        status=quote.status,
        pdf_url=quote.pdf_url,
        created_at=quote.created_at
    )


@router.patch("/quotes/{quote_id}")
async def update_quote_status(
    quote_id: str,
    new_status: QuoteStatus,
    db: Session = Depends(get_db)
):
    """Update quote status"""
    import uuid
    
    # Convert string to UUID
    try:
        quote_uuid = uuid.UUID(quote_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid quote ID format"
        )
    
    quote = db.query(Quote).filter(Quote.id == quote_uuid).first()
    
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found"
        )
    
    old_status = quote.status
    quote.status = new_status
    quote.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(quote)
    
    # Trigger email based on status transition
    if new_status == QuoteStatus.SENT and old_status != QuoteStatus.SENT:
        try:
            email_service.send_quote_confirmation(
                to_email=quote.customer_email,
                customer_name=quote.customer_name,
                quote_id=str(quote.id),
                min_price=float(quote.min_price),
                max_price=float(quote.max_price)
            )
        except Exception as e:
            logger.error(f"Failed to trigger email confirmation on status change: {e}")
    
    return {"success": True, "quote_id": quote_id, "new_status": new_status}


@router.get("/analytics")
async def get_analytics(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get analytics data for dashboard"""
    since_date = datetime.utcnow() - timedelta(days=days)
    
    # Total quotes
    total_quotes = db.query(func.count(Quote.id)).filter(
        Quote.created_at >= since_date
    ).scalar()
    
    # Quotes by status
    quotes_by_status = db.query(
        Quote.status,
        func.count(Quote.id)
    ).filter(
        Quote.created_at >= since_date
    ).group_by(Quote.status).all()
    
    # Average quote value
    avg_quote = db.query(
        func.avg((Quote.min_price + Quote.max_price) / 2)
    ).filter(
        Quote.created_at >= since_date
    ).scalar()
    
    # Total revenue (accepted quotes only)
    total_revenue = db.query(
        func.sum((Quote.min_price + Quote.max_price) / 2)
    ).filter(
        Quote.created_at >= since_date,
        Quote.status == QuoteStatus.ACCEPTED
    ).scalar()
    
    # Conversion rate
    accepted_count = db.query(func.count(Quote.id)).filter(
        Quote.created_at >= since_date,
        Quote.status == QuoteStatus.ACCEPTED
    ).scalar()
    
    conversion_rate = (accepted_count / total_quotes * 100) if total_quotes > 0 else 0
    
    # Most common apartment sizes (from volume)
    volume_distribution = db.query(
        func.avg(Quote.volume_m3).label('avg_volume'),
        func.count(Quote.id).label('count')
    ).filter(
        Quote.created_at >= since_date
    ).first()
    
    return {
        "period_days": days,
        "total_quotes": total_quotes or 0,
        "quotes_by_status": {
            status.value: count for status, count in quotes_by_status
        },
        "average_quote_value": float(avg_quote or 0),
        "total_revenue": float(total_revenue or 0),
        "conversion_rate": round(conversion_rate, 2),
        "average_volume_m3": float(volume_distribution.avg_volume or 0) if volume_distribution else 0
    }


@router.get("/pricing")
async def get_pricing_config(
    company_slug: str = "default",
    db: Session = Depends(get_db)
):
    """
    Get current pricing configuration
    
    Returns pricing config from company settings, or falls back to
    system defaults from config.py if no company-specific config exists.
    """
    from app.core.config import settings
    
    company = db.query(Company).filter(Company.slug == company_slug).first()
    
    # Build default config from settings
    default_config = {
        "base_rate_m3_min": settings.BASE_RATE_PER_M3_MIN,
        "base_rate_m3_max": settings.BASE_RATE_PER_M3_MAX,
        "rate_km_near": settings.RATE_PER_KM_NEAR,
        "rate_km_far": settings.RATE_PER_KM_FAR,
        "km_threshold": settings.KM_THRESHOLD,
        "hourly_labor_min": settings.HOURLY_LABOR_MIN,
        "hourly_labor_max": settings.HOURLY_LABOR_MAX,
        "min_movers": settings.MIN_MOVERS,
        "floor_surcharge_percent": settings.FLOOR_SURCHARGE_PERCENT,
        "hvz_permit_cost": settings.HVZ_PERMIT_COST,
        "kitchen_assembly_per_meter": settings.KITCHEN_ASSEMBLY_PER_METER,
        "external_lift_cost_min": settings.EXTERNAL_LIFT_COST_MIN,
        "external_lift_cost_max": settings.EXTERNAL_LIFT_COST_MAX,
        "enable_regional_pricing": settings.ENABLE_REGIONAL_PRICING,
        "enable_seasonal_pricing": settings.ENABLE_SEASONAL_PRICING,
    }
    
    # If company exists and has custom config, merge with defaults
    if company and company.pricing_config:
        pricing_config = {**default_config, **company.pricing_config}
    else:
        pricing_config = default_config
    
    return {
        "company_slug": company.slug if company else "default",
        "pricing_config": pricing_config,
        "using_defaults": not (company and company.pricing_config)
    }


@router.put("/pricing")
async def update_pricing_config(
    company_slug: str,
    pricing_config: dict,
    db: Session = Depends(get_db)
):
    """Update pricing configuration"""
    company = db.query(Company).filter(Company.slug == company_slug).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    company.pricing_config = pricing_config
    db.commit()
    
    return {"success": True, "company_slug": company_slug}


@router.post("/quotes/{quote_id}/pdf")
async def generate_quote_pdf(
    quote_id: str,
    db: Session = Depends(get_db)
):
    """
    Generate PDF for a specific quote
    
    Returns a PDF file as a streaming response that can be downloaded
    by the admin or sent to customers.
    """
    import uuid
    
    # Convert string to UUID
    try:
        quote_uuid = uuid.UUID(quote_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid quote ID format"
        )
    
    quote = db.query(Quote).filter(Quote.id == quote_uuid).first()
    
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found"
        )
    
    # Get company for branding
    company = db.query(Company).filter(Company.id == quote.company_id).first()
    company_name = company.name if company else "MoveMaster"
    
    # Prepare quote data for PDF
    quote_data = {
        'id': str(quote.id),
        'customer_name': quote.customer_name,
        'customer_email': quote.customer_email,
        'customer_phone': quote.customer_phone,
        'origin_address': quote.origin_address,
        'destination_address': quote.destination_address,
        'distance_km': float(quote.distance_km),
        'volume_m3': float(quote.volume_m3),
        'estimated_hours': float(quote.estimated_hours),
        'min_price': float(quote.min_price),
        'max_price': float(quote.max_price),
        'inventory': quote.inventory,
        'services': quote.services,
        'created_at': quote.created_at,
    }
    
    # Generate PDF
    try:
        pdf_buffer = pdf_service.generate_quote_pdf(quote_data, company_name)
        
        # Optional: Update quote with PDF generation timestamp
        # TODO: Add pdf_generated_at column to Quote model in future migration
        # quote.pdf_generated_at = datetime.utcnow()
        # db.commit()
        
        # Return as streaming response
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=quote_{quote_id[:8]}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating PDF: {str(e)}"
        )


@router.get("/quotes/{quote_id}/breakdown")
async def get_quote_breakdown(
    quote_id: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed pricing breakdown for a quote
    
    Shows all calculation components so admin can understand
    and potentially adjust pricing for individual needs.
    """
    import uuid
    
    # Convert string to UUID
    try:
        quote_uuid = uuid.UUID(quote_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid quote ID format"
        )
    
    quote = db.query(Quote).filter(Quote.id == quote_uuid).first()
    
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found"
        )
    
    # Reconstruct pricing breakdown using pricing engine
    from app.services.pricing_engine import pricing_engine
    from app.schemas.quote import Service
    
    # Convert services to proper format
    services = [
        Service(**service) if isinstance(service, dict) else service
        for service in quote.services
    ]
    
    # Approximate travel time for breakdown if not stored (distance / 65km/h for trucks)
    # This ensures the breakdown remains realistic even without DB migration
    approx_travel_time = Decimal(str(quote.distance_km)) / Decimal('65') if quote.distance_km > 50 else Decimal('1')
    
    # Regenerate quote to get breakdown
    detailed_quote = pricing_engine.generate_quote(
        volume=Decimal(str(quote.volume_m3)),
        distance_km=Decimal(str(quote.distance_km)),
        travel_time_hours=approx_travel_time,
        origin_floor=quote.origin_address.get('floor', 0),
        destination_floor=quote.destination_address.get('floor', 0),
        origin_has_elevator=quote.origin_address.get('has_elevator', False),
        destination_has_elevator=quote.destination_address.get('has_elevator', False),
        services=services
    )
    
    # Add configuration parameters used
    return {
        'quote_id': quote_id,
        'breakdown': detailed_quote['breakdown'],
        'total_min': detailed_quote['min_price'],
        'total_max': detailed_quote['max_price'],
        'configuration_used': {
            'base_rate_m3': f"€{pricing_engine.base_rate_m3_min}-{pricing_engine.base_rate_m3_max}/m³",
            'rate_km_near': f"€{pricing_engine.rate_km_near}/km (0-50km)",
            'rate_km_far': f"€{pricing_engine.rate_km_far}/km (>50km)",
            'hourly_labor': f"€{pricing_engine.hourly_labor_min}-{pricing_engine.hourly_labor_max}/hour",
            'min_movers': pricing_engine.min_movers,
            'floor_surcharge': f"{pricing_engine.floor_surcharge_percent * 100}% per floor",
            'hvz_permit': f"€{pricing_engine.hvz_permit_cost}",
            'kitchen_assembly': f"€{pricing_engine.kitchen_assembly_per_meter}/meter",
            'external_lift': f"€{pricing_engine.external_lift_cost_min}-{pricing_engine.external_lift_cost_max}",
        },
        'quote_details': {
            'volume_m3': float(quote.volume_m3),
            'distance_km': float(quote.distance_km),
            'estimated_hours': float(quote.estimated_hours),
            'origin_floor': quote.origin_address.get('floor', 0),
            'destination_floor': quote.destination_address.get('floor', 0),
            'origin_has_elevator': quote.origin_address.get('has_elevator', False),
            'destination_has_elevator': quote.destination_address.get('has_elevator', False),
            'services_enabled': [s.get('service_type') for s in quote.services if s.get('enabled')],
        }
    }
