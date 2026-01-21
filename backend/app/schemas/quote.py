"""
Quote Pydantic schemas for request/response validation
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field
from enum import Enum


class QuoteStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"


class ApartmentSize(str, Enum):
    STUDIO = "studio"
    ONE_BR = "1br"
    TWO_BR = "2br"
    THREE_BR = "3br"
    FOUR_BR_PLUS = "4br+"


class Address(BaseModel):
    """Address model"""
    address: str = ""
    postal_code: str
    city: str
    floor: int = 0
    has_elevator: bool = False


class InventoryItem(BaseModel):
    """Inventory item model"""
    item_id: str
    name: str
    quantity: int = 1
    volume_m3: Decimal
    category: Optional[str] = None


class Service(BaseModel):
    """Service model"""
    service_type: str  # packing, disassembly, hvz_permit, kitchen_assembly, external_lift
    enabled: bool
    cost: Optional[Decimal] = None
    metadata: Optional[Dict[str, Any]] = {}  # For kitchen_meters, etc.


class QuoteCalculateRequest(BaseModel):
    """Request for quick quote calculation"""
    origin_postal_code: str = Field(..., min_length=5, max_length=5)
    destination_postal_code: str = Field(..., min_length=5, max_length=5)
    apartment_size: Optional[ApartmentSize] = None
    volume_m3: Optional[Decimal] = None  # Either apartment_size OR volume_m3
    origin_floor: Optional[int] = 0
    destination_floor: Optional[int] = 0
    origin_has_elevator: Optional[bool] = False
    destination_has_elevator: Optional[bool] = False
    services: Optional[List[Service]] = []


class QuoteCalculateResponse(BaseModel):
    """Response with calculated quote"""
    min_price: Decimal
    max_price: Decimal
    distance_km: Decimal
    estimated_hours: Decimal
    volume_m3: Decimal
    breakdown: Dict[str, Any]


class QuoteSubmitRequest(BaseModel):
    """Request for full quote submission"""
    company_slug: Optional[str] = "default"
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    customer_name: Optional[str] = None
    origin: Address
    destination: Address
    inventory: List[InventoryItem]
    services: List[Service]


class QuoteResponse(BaseModel):
    """Full quote response"""
    id: str
    company_id: str
    customer_email: str
    customer_phone: Optional[str]
    customer_name: Optional[str]
    origin_address: Dict[str, Any]
    destination_address: Dict[str, Any]
    distance_km: Decimal
    estimated_hours: Decimal
    inventory: List[Dict[str, Any]]
    services: List[Dict[str, Any]]
    min_price: Decimal
    max_price: Decimal
    volume_m3: Decimal
    status: QuoteStatus
    pdf_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ItemTemplateResponse(BaseModel):
    """Item template response"""
    id: str
    name: str
    category: str
    volume_m3: Decimal
    weight_kg: Optional[Decimal]
    disassembly_minutes: int
    packing_minutes: int
    
    class Config:
        from_attributes = True


class RoomTemplateResponse(BaseModel):
    """Room template response"""
    id: str
    name: str
    apartment_size: str
    default_items: List[Dict[str, Any]]
    
    class Config:
        from_attributes = True
