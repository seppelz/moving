"""
Item template model for inventory defaults
"""
import uuid
from sqlalchemy import Column, String, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class ItemTemplate(Base):
    __tablename__ = "item_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)  # living_room, bedroom, kitchen, etc.
    volume_m3 = Column(Numeric(10, 2), nullable=False)
    weight_kg = Column(Numeric(10, 2), nullable=True)
    disassembly_minutes = Column(Integer, default=0)
    packing_minutes = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<ItemTemplate {self.name} ({self.volume_m3}m³)>"
