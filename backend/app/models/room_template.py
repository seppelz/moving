"""
Room template model for smart defaults
"""
import uuid
from sqlalchemy import Column, String, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum


class ApartmentSize(str, enum.Enum):
    STUDIO = "studio"
    ONE_BR = "1br"
    TWO_BR = "2br"
    THREE_BR = "3br"
    FOUR_BR_PLUS = "4br+"


class RoomTemplate(Base):
    __tablename__ = "room_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)  # Living Room, Bedroom, Kitchen, etc.
    apartment_size = Column(Enum(ApartmentSize), nullable=False, index=True)
    default_items = Column(JSON, nullable=False, default=[])  # Array of {item_id, quantity}
    
    def __repr__(self):
        return f"<RoomTemplate {self.name} for {self.apartment_size.value}>"
