"""
Quote API endpoints for calculating and submitting moving quotes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import List, Any
from datetime import datetime

from app.core.database import get_db
from app.schemas.quote import (
    QuoteCalculateRequest,
    QuoteCalculateResponse,
    QuoteSubmitRequest,
    QuoteResponse,
    ItemTemplateResponse,
    RoomTemplateResponse,
    ApartmentSize
)
from app.services.pricing_engine import pricing_engine
from app.services.maps_service import maps_service
from app.models.quote import Quote, QuoteStatus
from app.models.company import Company
from app.models.item_template import ItemTemplate
from app.models.room_template import RoomTemplate

router = APIRouter()


def convert_decimals_to_float(obj: Any) -> Any:
    """Recursively convert Decimal objects to float for JSON serialization"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: convert_decimals_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimals_to_float(item) for item in obj]
    return obj


# Default volume estimates for apartment sizes
APARTMENT_SIZE_VOLUMES = {
    ApartmentSize.STUDIO: Decimal('15'),
    ApartmentSize.ONE_BR: Decimal('25'),
    ApartmentSize.TWO_BR: Decimal('40'),
    ApartmentSize.THREE_BR: Decimal('60'),
    ApartmentSize.FOUR_BR_PLUS: Decimal('80'),
}


@router.post("/calculate", response_model=QuoteCalculateResponse)
async def calculate_quote(
    request: QuoteCalculateRequest,
    db: Session = Depends(get_db)
):
    """
    Calculate instant quote based on basic parameters
    This is the "Step 1" quick estimate
    """
    # Validate postal codes
    if not maps_service.validate_german_postal_code(request.origin_postal_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid origin postal code"
        )
    
    if not maps_service.validate_german_postal_code(request.destination_postal_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid destination postal code"
        )
    
    # Get distance from Google Maps
    distance_km, duration_hours = maps_service.calculate_distance(
        request.origin_postal_code,
        request.destination_postal_code
    )
    
    if distance_km is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not calculate distance"
        )
    
    # Determine volume
    if request.volume_m3:
        volume = request.volume_m3
    elif request.apartment_size:
        volume = APARTMENT_SIZE_VOLUMES.get(request.apartment_size, Decimal('40'))
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either volume_m3 or apartment_size must be provided"
        )
    
    # Calculate quote
    quote_data = pricing_engine.generate_quote(
        volume=volume,
        distance_km=distance_km,
        travel_time_hours=duration_hours or Decimal('0'),
        origin_floor=request.origin_floor or 0,
        destination_floor=request.destination_floor or 0,
        origin_has_elevator=request.origin_has_elevator or False,
        destination_has_elevator=request.destination_has_elevator or False,
        services=request.services or []
    )
    
    return QuoteCalculateResponse(**quote_data)


@router.post("/submit", response_model=QuoteResponse)
async def submit_quote(
    request: QuoteSubmitRequest,
    db: Session = Depends(get_db)
):
    """
    Submit full quote with detailed inventory
    This is called after the user completes all 4 steps
    """
    # Get company
    company = db.query(Company).filter(Company.slug == request.company_slug).first()
    if not company:
        # Create default company if it doesn't exist
        company = Company(
            name="MoveMaster",
            slug="default",
            pricing_config={}
        )
        db.add(company)
        db.commit()
        db.refresh(company)
    
    # Calculate total volume from inventory
    volume = pricing_engine.calculate_volume(request.inventory)
    
    # Get route info
    route_info = maps_service.get_route_info(
        request.origin.postal_code,
        request.destination.postal_code
    )
    
    if not route_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not calculate route"
        )
    
    distance_km = route_info["distance_km"]
    
    # Generate quote
    quote_data = pricing_engine.generate_quote(
        volume=volume,
        distance_km=distance_km,
        travel_time_hours=route_info.get("duration_hours", Decimal('0')),
        origin_floor=request.origin.floor or 0,
        destination_floor=request.destination.floor or 0,
        origin_has_elevator=request.origin.has_elevator or False,
        destination_has_elevator=request.destination.has_elevator or False,
        services=request.services
    )
    
    # Create quote in database
    # Convert all Decimal values to float for JSON serialization
    inventory_data = [convert_decimals_to_float(item.model_dump()) for item in request.inventory]
    services_data = [convert_decimals_to_float(service.model_dump()) for service in request.services]
    
    quote = Quote(
        company_id=company.id,
        customer_email=request.customer_email,
        customer_phone=request.customer_phone,
        customer_name=request.customer_name,
        origin_address=request.origin.model_dump(),
        destination_address=request.destination.model_dump(),
        distance_km=distance_km,
        estimated_hours=quote_data["estimated_hours"],
        inventory=inventory_data,
        services=services_data,
        min_price=quote_data["min_price"],
        max_price=quote_data["max_price"],
        volume_m3=volume,
        status=QuoteStatus.DRAFT
    )
    
    db.add(quote)
    db.commit()
    db.refresh(quote)
    
    # Return response
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


@router.get("/inventory/templates", response_model=List[ItemTemplateResponse])
async def get_item_templates(
    category: str = None,
    db: Session = Depends(get_db)
):
    """Get all item templates, optionally filtered by category"""
    query = db.query(ItemTemplate)
    
    if category:
        query = query.filter(ItemTemplate.category == category)
    
    templates = query.all()
    
    return [
        ItemTemplateResponse(
            id=str(t.id),
            name=t.name,
            category=t.category,
            volume_m3=t.volume_m3,
            weight_kg=t.weight_kg,
            disassembly_minutes=t.disassembly_minutes,
            packing_minutes=t.packing_minutes
        )
        for t in templates
    ]


@router.get("/room/templates", response_model=List[RoomTemplateResponse])
async def get_room_templates(
    apartment_size: ApartmentSize = None,
    db: Session = Depends(get_db)
):
    """Get room templates for smart defaults"""
    query = db.query(RoomTemplate)
    
    if apartment_size:
        query = query.filter(RoomTemplate.apartment_size == apartment_size.value)
    
    templates = query.all()
    
    return [
        RoomTemplateResponse(
            id=str(t.id),
            name=t.name,
            apartment_size=t.apartment_size.value,
            default_items=t.default_items
        )
        for t in templates
    ]


@router.post("/validate-address")
async def validate_address(postal_code: str):
    """Validate German postal code and return city information"""
    if not maps_service.validate_german_postal_code(postal_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid postal code format"
        )
    
    geo_data = maps_service.geocode_postal_code(postal_code)
    
    if not geo_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Postal code not found"
        )
    
    return {
        "valid": True,
        "postal_code": postal_code,
        "city": geo_data["city"],
        "formatted_address": geo_data["formatted_address"]
    }
