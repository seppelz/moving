"""
Company model for white-label support
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    logo_url = Column(String, nullable=True)
    pricing_config = Column(JSON, nullable=True, default={})
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    quotes = relationship("Quote", back_populates="company")
    
    def __repr__(self):
        return f"<Company {self.name}>"
