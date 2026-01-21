"""
Smart apartment profile model for AI-powered volume prediction
"""
import uuid
from sqlalchemy import Column, String, Integer, Numeric, JSON, Float
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class ApartmentProfile(Base):
    """Pre-built apartment profiles based on real moving data"""
    __tablename__ = "apartment_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_key = Column(String, unique=True, nullable=False, index=True)
    
    # Profile metadata
    apartment_size = Column(String, nullable=False)  # studio, 1br, 2br, etc.
    household_type = Column(String, nullable=False)  # single, couple, family, etc.
    furnishing_level = Column(String, nullable=False)  # minimal, normal, full
    persona_description = Column(String, nullable=True)
    
    # Volume estimates
    typical_volume_min = Column(Numeric(10, 2), nullable=False)
    typical_volume_max = Column(Numeric(10, 2), nullable=False)
    typical_boxes = Column(Integer, nullable=False)
    
    # Confidence and usage data
    confidence_score = Column(Float, default=0.85)  # 0-1
    usage_count = Column(Integer, default=0)  # How many times selected
    accuracy_rating = Column(Float, default=0.90)  # Actual vs predicted
    
    # Detailed item breakdown (JSON)
    # Structure: { "living_room": [...], "bedroom": [...], etc. }
    typical_items = Column(JSON, nullable=False)
    
    # Common variations/adjustments
    common_additions = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<ApartmentProfile {self.profile_key}>"
