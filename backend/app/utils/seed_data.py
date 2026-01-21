"""
Seed script to populate database with default templates
Run with: python -m app.utils.seed_data
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.core.database import SessionLocal
from app.models.item_template import ItemTemplate
from app.models.room_template import RoomTemplate, ApartmentSize
from app.models.company import Company
from decimal import Decimal


def seed_item_templates(db):
    """Seed default furniture items"""
    # Check if already seeded
    if db.query(ItemTemplate).count() > 0:
        print("[*] Item templates already exist, skipping...")
        return
    
    items = [
        # Living Room
        {"name": "Sofa (2-Seater)", "category": "living_room", "volume_m3": 2.0, "weight_kg": 50, "disassembly_minutes": 0, "packing_minutes": 15},
        {"name": "Sofa (3-Seater)", "category": "living_room", "volume_m3": 3.0, "weight_kg": 75, "disassembly_minutes": 0, "packing_minutes": 20},
        {"name": "TV Stand", "category": "living_room", "volume_m3": 0.8, "weight_kg": 30, "disassembly_minutes": 10, "packing_minutes": 10},
        {"name": "Bookshelf", "category": "living_room", "volume_m3": 1.2, "weight_kg": 40, "disassembly_minutes": 15, "packing_minutes": 20},
        {"name": "Coffee Table", "category": "living_room", "volume_m3": 0.5, "weight_kg": 20, "disassembly_minutes": 0, "packing_minutes": 5},
        {"name": "Armchair", "category": "living_room", "volume_m3": 1.5, "weight_kg": 30, "disassembly_minutes": 0, "packing_minutes": 10},
        
        # Bedroom
        {"name": "Single Bed", "category": "bedroom", "volume_m3": 2.5, "weight_kg": 60, "disassembly_minutes": 20, "packing_minutes": 15},
        {"name": "Double Bed", "category": "bedroom", "volume_m3": 4.0, "weight_kg": 100, "disassembly_minutes": 30, "packing_minutes": 20},
        {"name": "Wardrobe (2-Door)", "category": "bedroom", "volume_m3": 3.5, "weight_kg": 80, "disassembly_minutes": 30, "packing_minutes": 25},
        {"name": "Wardrobe (3-Door)", "category": "bedroom", "volume_m3": 5.0, "weight_kg": 120, "disassembly_minutes": 45, "packing_minutes": 35},
        {"name": "Nightstand", "category": "bedroom", "volume_m3": 0.3, "weight_kg": 15, "disassembly_minutes": 0, "packing_minutes": 5},
        {"name": "Dresser", "category": "bedroom", "volume_m3": 1.8, "weight_kg": 50, "disassembly_minutes": 15, "packing_minutes": 15},
        {"name": "Desk", "category": "bedroom", "volume_m3": 1.2, "weight_kg": 35, "disassembly_minutes": 10, "packing_minutes": 10},
        
        # Kitchen
        {"name": "Dining Table (4-Person)", "category": "kitchen", "volume_m3": 1.5, "weight_kg": 40, "disassembly_minutes": 10, "packing_minutes": 10},
        {"name": "Dining Table (6-Person)", "category": "kitchen", "volume_m3": 2.5, "weight_kg": 60, "disassembly_minutes": 15, "packing_minutes": 15},
        {"name": "Dining Chair", "category": "kitchen", "volume_m3": 0.4, "weight_kg": 8, "disassembly_minutes": 0, "packing_minutes": 5},
        {"name": "Kitchen Cabinet (Base)", "category": "kitchen", "volume_m3": 0.8, "weight_kg": 30, "disassembly_minutes": 20, "packing_minutes": 15},
        {"name": "Kitchen Cabinet (Wall)", "category": "kitchen", "volume_m3": 0.5, "weight_kg": 20, "disassembly_minutes": 15, "packing_minutes": 10},
        {"name": "Refrigerator", "category": "kitchen", "volume_m3": 1.2, "weight_kg": 80, "disassembly_minutes": 5, "packing_minutes": 10},
        {"name": "Washing Machine", "category": "kitchen", "volume_m3": 0.8, "weight_kg": 70, "disassembly_minutes": 10, "packing_minutes": 10},
        
        # Other
        {"name": "Moving Box (Small)", "category": "other", "volume_m3": 0.03, "weight_kg": 10, "disassembly_minutes": 0, "packing_minutes": 0},
        {"name": "Moving Box (Medium)", "category": "other", "volume_m3": 0.06, "weight_kg": 15, "disassembly_minutes": 0, "packing_minutes": 0},
        {"name": "Moving Box (Large)", "category": "other", "volume_m3": 0.12, "weight_kg": 20, "disassembly_minutes": 0, "packing_minutes": 0},
        {"name": "Bicycle", "category": "other", "volume_m3": 0.5, "weight_kg": 15, "disassembly_minutes": 0, "packing_minutes": 5},
        {"name": "Lamp", "category": "other", "volume_m3": 0.2, "weight_kg": 3, "disassembly_minutes": 0, "packing_minutes": 5},
    ]
    
    for item_data in items:
        item = ItemTemplate(**item_data)
        db.add(item)
    
    db.commit()
    print(f"[+] Seeded {len(items)} item templates")


def seed_room_templates(db):
    """Seed room templates for different apartment sizes"""
    # Check if already seeded
    if db.query(RoomTemplate).count() > 0:
        print("[*] Room templates already exist, skipping...")
        return
    
    # Get item IDs (in production, would query by name)
    # For simplicity, using generic structure
    
    templates = [
        # Studio
        {
            "name": "Living Area",
            "apartment_size": ApartmentSize.STUDIO,
            "default_items": [
                {"category": "living_room", "item_name": "Sofa (2-Seater)", "quantity": 1},
                {"category": "bedroom", "item_name": "Single Bed", "quantity": 1},
                {"category": "kitchen", "item_name": "Dining Table (4-Person)", "quantity": 1},
                {"category": "kitchen", "item_name": "Dining Chair", "quantity": 2},
                {"category": "other", "item_name": "Moving Box (Medium)", "quantity": 15},
            ]
        },
        
        # 1 Bedroom
        {
            "name": "Living Room",
            "apartment_size": ApartmentSize.ONE_BR,
            "default_items": [
                {"category": "living_room", "item_name": "Sofa (3-Seater)", "quantity": 1},
                {"category": "living_room", "item_name": "TV Stand", "quantity": 1},
                {"category": "living_room", "item_name": "Coffee Table", "quantity": 1},
                {"category": "other", "item_name": "Moving Box (Medium)", "quantity": 10},
            ]
        },
        {
            "name": "Bedroom",
            "apartment_size": ApartmentSize.ONE_BR,
            "default_items": [
                {"category": "bedroom", "item_name": "Double Bed", "quantity": 1},
                {"category": "bedroom", "item_name": "Wardrobe (2-Door)", "quantity": 1},
                {"category": "bedroom", "item_name": "Nightstand", "quantity": 2},
                {"category": "other", "item_name": "Moving Box (Medium)", "quantity": 10},
            ]
        },
        
        # 2 Bedroom
        {
            "name": "Living Room",
            "apartment_size": ApartmentSize.TWO_BR,
            "default_items": [
                {"category": "living_room", "item_name": "Sofa (3-Seater)", "quantity": 1},
                {"category": "living_room", "item_name": "TV Stand", "quantity": 1},
                {"category": "living_room", "item_name": "Coffee Table", "quantity": 1},
                {"category": "living_room", "item_name": "Bookshelf", "quantity": 1},
                {"category": "other", "item_name": "Moving Box (Medium)", "quantity": 15},
            ]
        },
        {
            "name": "Master Bedroom",
            "apartment_size": ApartmentSize.TWO_BR,
            "default_items": [
                {"category": "bedroom", "item_name": "Double Bed", "quantity": 1},
                {"category": "bedroom", "item_name": "Wardrobe (3-Door)", "quantity": 1},
                {"category": "bedroom", "item_name": "Nightstand", "quantity": 2},
                {"category": "bedroom", "item_name": "Dresser", "quantity": 1},
                {"category": "other", "item_name": "Moving Box (Medium)", "quantity": 10},
            ]
        },
        {
            "name": "Second Bedroom",
            "apartment_size": ApartmentSize.TWO_BR,
            "default_items": [
                {"category": "bedroom", "item_name": "Single Bed", "quantity": 1},
                {"category": "bedroom", "item_name": "Wardrobe (2-Door)", "quantity": 1},
                {"category": "bedroom", "item_name": "Desk", "quantity": 1},
                {"category": "other", "item_name": "Moving Box (Medium)", "quantity": 8},
            ]
        },
        
        # 3 Bedroom
        {
            "name": "Living Room",
            "apartment_size": ApartmentSize.THREE_BR,
            "default_items": [
                {"category": "living_room", "item_name": "Sofa (3-Seater)", "quantity": 1},
                {"category": "living_room", "item_name": "Armchair", "quantity": 1},
                {"category": "living_room", "item_name": "TV Stand", "quantity": 1},
                {"category": "living_room", "item_name": "Coffee Table", "quantity": 1},
                {"category": "living_room", "item_name": "Bookshelf", "quantity": 2},
                {"category": "other", "item_name": "Moving Box (Large)", "quantity": 20},
            ]
        },
        {
            "name": "Master Bedroom",
            "apartment_size": ApartmentSize.THREE_BR,
            "default_items": [
                {"category": "bedroom", "item_name": "Double Bed", "quantity": 1},
                {"category": "bedroom", "item_name": "Wardrobe (3-Door)", "quantity": 1},
                {"category": "bedroom", "item_name": "Nightstand", "quantity": 2},
                {"category": "bedroom", "item_name": "Dresser", "quantity": 1},
                {"category": "other", "item_name": "Moving Box (Medium)", "quantity": 12},
            ]
        },
    ]
    
    for template_data in templates:
        template = RoomTemplate(**template_data)
        db.add(template)
    
    db.commit()
    print(f"[+] Seeded {len(templates)} room templates")


def seed_default_company(db):
    """Create default company"""
    # Check if already exists
    if db.query(Company).filter(Company.slug == "default").first():
        print("[*] Default company already exists, skipping...")
        return
    
    company = Company(
        name="MoveMaster Demo",
        slug="default",
        pricing_config={
            "base_rate_m3_min": 25.0,
            "base_rate_m3_max": 35.0,
            "rate_per_km": 2.0
        }
    )
    db.add(company)
    db.commit()
    print("[+] Created default company")


def main():
    """Run all seed functions"""
    db = SessionLocal()
    
    try:
        print("Seeding database...")
        seed_default_company(db)
        seed_item_templates(db)
        seed_room_templates(db)
        print("\n[+] Database seeded successfully!")
    except Exception as e:
        print(f"\n[!] Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
