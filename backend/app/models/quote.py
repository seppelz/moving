"""
Quote model for storing customer requests
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, JSON, Numeric, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class QuoteStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"


class Quote(Base):
    __tablename__ = "quotes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Customer info
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)
    customer_name = Column(String, nullable=True)
    moving_date = Column(String, nullable=True)  # ISO date string
    wants_callback = Column(Boolean, default=False)
    wants_moving_tips = Column(Boolean, default=False)
    
    # Move details
    origin_address = Column(JSON, nullable=False)  # {address, postal_code, city, floor, has_elevator}
    destination_address = Column(JSON, nullable=False)
    distance_km = Column(Numeric(10, 2), nullable=False)
    estimated_hours = Column(Numeric(10, 2), nullable=False)
    
    # Inventory and services
    inventory = Column(JSON, nullable=False, default=[])  # Array of items with quantities
    services = Column(JSON, nullable=False, default=[])   # Array of selected services
    
    # Pricing
    min_price = Column(Numeric(10, 2), nullable=False)
    max_price = Column(Numeric(10, 2), nullable=False)
    volume_m3 = Column(Numeric(10, 2), nullable=False)
    
    # Status and tracking
    status = Column(Enum(QuoteStatus), default=QuoteStatus.DRAFT, nullable=False, index=True)
    is_fixed_price = Column(Boolean, default=False, nullable=False)
    pdf_url = Column(String, nullable=True)

    # Feedback / accuracy tracking (filled post-move)
    actual_cost = Column(Numeric(10, 2), nullable=True)
    actual_volume_m3 = Column(Numeric(10, 2), nullable=True)
    actual_hours = Column(Numeric(10, 2), nullable=True)
    feedback_notes = Column(String, nullable=True)
    feedback_rating = Column(Numeric(2, 1), nullable=True)  # 1.0-5.0 stars
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="quotes")
    
    def __repr__(self):
        return f"<Quote {self.id} - {self.customer_email}>"
