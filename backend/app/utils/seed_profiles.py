"""
Seed smart apartment profiles based on real moving data patterns
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.core.database import SessionLocal
from app.models.apartment_profile import ApartmentProfile
from decimal import Decimal


# Comprehensive profile definitions
SMART_PROFILES = [
    # ===== STUDIO APARTMENTS =====
    {
        "profile_key": "studio_single_minimal",
        "apartment_size": "studio",
        "household_type": "single",
        "furnishing_level": "minimal",
        "persona_description": "Student oder Young Professional, minimalistisch",
        "typical_volume_min": 12,
        "typical_volume_max": 18,
        "typical_boxes": 10,
        "confidence_score": 0.88,
        "typical_items": {
            "living_sleeping_area": [
                {"name": "Einzelbett/Sofa-Bett", "volume_m3": 2.0, "quantity": 1, "confidence": 0.95},
                {"name": "Kleiner Kleiderschrank", "volume_m3": 1.5, "quantity": 1, "confidence": 0.90},
                {"name": "Schreibtisch klein", "volume_m3": 0.8, "quantity": 1, "confidence": 0.75},
                {"name": "Stuhl", "volume_m3": 0.3, "quantity": 1, "confidence": 0.85},
                {"name": "Kleines Regal", "volume_m3": 0.5, "quantity": 1, "confidence": 0.70},
            ],
            "kitchen": [
                {"name": "Kleiner Tisch", "volume_m3": 0.4, "quantity": 1, "confidence": 0.80},
                {"name": "Stühle", "volume_m3": 0.3, "quantity": 2, "confidence": 0.80},
            ]
        },
        "common_additions": [
            {"question": "Haben Sie ein Fahrrad?", "item": "bicycle", "volume_m3": 0.5},
            {"question": "TV vorhanden?", "item": "tv_small", "volume_m3": 0.1},
        ]
    },
    
    {
        "profile_key": "studio_single_normal",
        "apartment_size": "studio",
        "household_type": "single",
        "furnishing_level": "normal",
        "persona_description": "Single, Standard-Ausstattung",
        "typical_volume_min": 18,
        "typical_volume_max": 24,
        "typical_boxes": 15,
        "confidence_score": 0.90,
        "typical_items": {
            "living_sleeping_area": [
                {"name": "Doppelbett", "volume_m3": 3.0, "quantity": 1, "confidence": 0.92},
                {"name": "Kleiderschrank 2-türig", "volume_m3": 2.5, "quantity": 1, "confidence": 0.90},
                {"name": "Kommode", "volume_m3": 1.0, "quantity": 1, "confidence": 0.85},
                {"name": "TV-Möbel", "volume_m3": 0.6, "quantity": 1, "confidence": 0.88},
                {"name": "Bücherregal", "volume_m3": 1.0, "quantity": 1, "confidence": 0.75},
                {"name": "Sessel", "volume_m3": 1.2, "quantity": 1, "confidence": 0.65},
            ],
            "kitchen": [
                {"name": "Esstisch 2-Person", "volume_m3": 0.6, "quantity": 1, "confidence": 0.85},
                {"name": "Stühle", "volume_m3": 0.3, "quantity": 2, "confidence": 0.85},
            ]
        }
    },
    
    # ===== 1 BEDROOM APARTMENTS =====
    {
        "profile_key": "1br_single_normal",
        "apartment_size": "1br",
        "household_type": "single",
        "furnishing_level": "normal",
        "persona_description": "Single, 1-Zimmer Wohnung, normal möbliert",
        "typical_volume_min": 22,
        "typical_volume_max": 30,
        "typical_boxes": 18,
        "confidence_score": 0.90,
        "typical_items": {
            "living_room": [
                {"name": "Sofa 2-Sitzer", "volume_m3": 2.0, "quantity": 1, "confidence": 0.90},
                {"name": "TV-Möbel", "volume_m3": 0.8, "quantity": 1, "confidence": 0.88},
                {"name": "Couchtisch", "volume_m3": 0.4, "quantity": 1, "confidence": 0.85},
                {"name": "Bücherregal", "volume_m3": 1.2, "quantity": 1, "confidence": 0.75},
            ],
            "bedroom": [
                {"name": "Doppelbett", "volume_m3": 3.5, "quantity": 1, "confidence": 0.95},
                {"name": "Kleiderschrank 2-türig", "volume_m3": 3.0, "quantity": 1, "confidence": 0.92},
                {"name": "Nachttisch", "volume_m3": 0.3, "quantity": 2, "confidence": 0.80},
                {"name": "Kommode", "volume_m3": 1.2, "quantity": 1, "confidence": 0.75},
            ],
            "kitchen": [
                {"name": "Esstisch 4-Person", "volume_m3": 1.2, "quantity": 1, "confidence": 0.85},
                {"name": "Essstühle", "volume_m3": 0.4, "quantity": 4, "confidence": 0.85},
            ]
        }
    },
    
    {
        "profile_key": "1br_couple_normal",
        "apartment_size": "1br",
        "household_type": "couple",
        "furnishing_level": "normal",
        "persona_description": "Paar, 1-Zimmer, vollständig eingerichtet",
        "typical_volume_min": 28,
        "typical_volume_max": 36,
        "typical_boxes": 22,
        "confidence_score": 0.92,
        "typical_items": {
            "living_room": [
                {"name": "Sofa 3-Sitzer", "volume_m3": 3.0, "quantity": 1, "confidence": 0.92},
                {"name": "TV-Möbel", "volume_m3": 0.9, "quantity": 1, "confidence": 0.90},
                {"name": "Couchtisch", "volume_m3": 0.5, "quantity": 1, "confidence": 0.88},
                {"name": "Bücherregal", "volume_m3": 1.5, "quantity": 1, "confidence": 0.80},
                {"name": "Sideboard", "volume_m3": 1.2, "quantity": 1, "confidence": 0.70},
            ],
            "bedroom": [
                {"name": "Doppelbett", "volume_m3": 4.0, "quantity": 1, "confidence": 0.98},
                {"name": "Kleiderschrank 3-türig", "volume_m3": 4.5, "quantity": 1, "confidence": 0.85},
                {"name": "Nachttisch", "volume_m3": 0.3, "quantity": 2, "confidence": 0.90},
                {"name": "Kommode", "volume_m3": 1.5, "quantity": 1, "confidence": 0.80},
            ],
            "kitchen": [
                {"name": "Esstisch 4-Person", "volume_m3": 1.5, "quantity": 1, "confidence": 0.88},
                {"name": "Essstühle", "volume_m3": 0.4, "quantity": 4, "confidence": 0.88},
                {"name": "Waschmaschine", "volume_m3": 0.8, "quantity": 1, "confidence": 0.85},
            ]
        }
    },
    
    # ===== 2 BEDROOM APARTMENTS =====
    {
        "profile_key": "2br_young_professional_normal",
        "apartment_size": "2br",
        "household_type": "young_professional",
        "furnishing_level": "normal",
        "persona_description": "25-35 Jahre, Urban, Modern eingerichtet",
        "typical_volume_min": 35,
        "typical_volume_max": 45,
        "typical_boxes": 20,
        "confidence_score": 0.93,
        "typical_items": {
            "living_room": [
                {"name": "Sofa 3-Sitzer", "volume_m3": 3.0, "quantity": 1, "confidence": 0.95},
                {"name": "TV-Möbel", "volume_m3": 0.9, "quantity": 1, "confidence": 0.92},
                {"name": "Couchtisch", "volume_m3": 0.5, "quantity": 1, "confidence": 0.88},
                {"name": "Bücherregal IKEA Kallax", "volume_m3": 1.2, "quantity": 1, "confidence": 0.80},
                {"name": "Stehlampe", "volume_m3": 0.3, "quantity": 1, "confidence": 0.70},
            ],
            "bedroom": [
                {"name": "Doppelbett 160x200", "volume_m3": 3.8, "quantity": 1, "confidence": 0.98},
                {"name": "PAX Kleiderschrank 2-türig", "volume_m3": 3.5, "quantity": 1, "confidence": 0.90},
                {"name": "Nachttisch", "volume_m3": 0.3, "quantity": 2, "confidence": 0.85},
                {"name": "Kommode", "volume_m3": 1.2, "quantity": 1, "confidence": 0.75},
            ],
            "office": [
                {"name": "Schreibtisch", "volume_m3": 1.5, "quantity": 1, "confidence": 0.75},
                {"name": "Bürostuhl", "volume_m3": 0.6, "quantity": 1, "confidence": 0.75},
                {"name": "Regal", "volume_m3": 1.0, "quantity": 1, "confidence": 0.60},
            ],
            "kitchen": [
                {"name": "Esstisch 4-Person", "volume_m3": 1.5, "quantity": 1, "confidence": 0.90},
                {"name": "Essstühle", "volume_m3": 0.4, "quantity": 4, "confidence": 0.90},
                {"name": "Küche 3-4m", "volume_m3": 5.0, "quantity": 1, "confidence": 0.70},
                {"name": "Waschmaschine", "volume_m3": 0.8, "quantity": 1, "confidence": 0.88},
            ]
        },
        "common_additions": [
            {"question": "Haben Sie Fahrräder?", "item": "bicycles", "volume_m3": 1.0},
            {"question": "Große Pflanzen (3+)?", "item": "plants", "volume_m3": 1.5},
            {"question": "Balkontisch & Stühle?", "item": "balcony_furniture", "volume_m3": 1.2},
        ]
    },
    
    {
        "profile_key": "2br_couple_normal",
        "apartment_size": "2br",
        "household_type": "couple",
        "furnishing_level": "normal",
        "persona_description": "Paar, 2-Zimmer, komplett eingerichtet",
        "typical_volume_min": 38,
        "typical_volume_max": 48,
        "typical_boxes": 25,
        "confidence_score": 0.92,
        "typical_items": {
            "living_room": [
                {"name": "Sofa 3-Sitzer", "volume_m3": 3.2, "quantity": 1, "confidence": 0.95},
                {"name": "Sessel", "volume_m3": 1.5, "quantity": 1, "confidence": 0.70},
                {"name": "TV-Möbel", "volume_m3": 1.0, "quantity": 1, "confidence": 0.92},
                {"name": "Couchtisch", "volume_m3": 0.6, "quantity": 1, "confidence": 0.90},
                {"name": "Bücherregal", "volume_m3": 1.5, "quantity": 2, "confidence": 0.75},
                {"name": "Sideboard", "volume_m3": 1.3, "quantity": 1, "confidence": 0.70},
            ],
            "bedroom": [
                {"name": "Doppelbett", "volume_m3": 4.0, "quantity": 1, "confidence": 0.98},
                {"name": "Kleiderschrank 3-türig", "volume_m3": 5.0, "quantity": 1, "confidence": 0.88},
                {"name": "Nachttisch", "volume_m3": 0.3, "quantity": 2, "confidence": 0.92},
                {"name": "Kommode", "volume_m3": 1.5, "quantity": 1, "confidence": 0.82},
            ],
            "office_guest": [
                {"name": "Gästebett/Sofa", "volume_m3": 2.0, "quantity": 1, "confidence": 0.75},
                {"name": "Schreibtisch", "volume_m3": 1.2, "quantity": 1, "confidence": 0.65},
                {"name": "Regal", "volume_m3": 1.0, "quantity": 1, "confidence": 0.70},
            ],
            "kitchen": [
                {"name": "Esstisch 6-Person", "volume_m3": 2.0, "quantity": 1, "confidence": 0.85},
                {"name": "Essstühle", "volume_m3": 0.4, "quantity": 6, "confidence": 0.85},
                {"name": "Küche 4-5m", "volume_m3": 6.0, "quantity": 1, "confidence": 0.75},
                {"name": "Waschmaschine", "volume_m3": 0.8, "quantity": 1, "confidence": 0.90},
            ]
        }
    },
    
    {
        "profile_key": "2br_family_kids_normal",
        "apartment_size": "2br",
        "household_type": "family_kids",
        "furnishing_level": "normal",
        "persona_description": "Familie mit 1-2 Kindern",
        "typical_volume_min": 50,
        "typical_volume_max": 65,
        "typical_boxes": 35,
        "confidence_score": 0.90,
        "typical_items": {
            "living_room": [
                {"name": "Sofa 3-Sitzer", "volume_m3": 3.5, "quantity": 1, "confidence": 0.95},
                {"name": "TV-Möbel", "volume_m3": 1.0, "quantity": 1, "confidence": 0.92},
                {"name": "Couchtisch", "volume_m3": 0.6, "quantity": 1, "confidence": 0.88},
                {"name": "Spielzeugkiste", "volume_m3": 0.6, "quantity": 2, "confidence": 0.85},
                {"name": "Bücherregal", "volume_m3": 1.5, "quantity": 1, "confidence": 0.80},
            ],
            "bedroom_parents": [
                {"name": "Doppelbett", "volume_m3": 4.0, "quantity": 1, "confidence": 0.98},
                {"name": "Kleiderschrank groß", "volume_m3": 5.5, "quantity": 1, "confidence": 0.90},
                {"name": "Nachttisch", "volume_m3": 0.3, "quantity": 2, "confidence": 0.90},
                {"name": "Kommode", "volume_m3": 1.5, "quantity": 1, "confidence": 0.85},
            ],
            "bedroom_kids": [
                {"name": "Kinderbett", "volume_m3": 2.0, "quantity": 1, "confidence": 0.92},
                {"name": "Hochstuhl", "volume_m3": 0.4, "quantity": 1, "confidence": 0.70},
                {"name": "Wickeltisch", "volume_m3": 0.8, "quantity": 1, "confidence": 0.60},
                {"name": "Kinderschrank", "volume_m3": 2.0, "quantity": 1, "confidence": 0.85},
                {"name": "Spielzeugkiste", "volume_m3": 0.5, "quantity": 2, "confidence": 0.90},
            ],
            "kitchen": [
                {"name": "Esstisch 6-Person", "volume_m3": 2.2, "quantity": 1, "confidence": 0.90},
                {"name": "Essstühle", "volume_m3": 0.4, "quantity": 6, "confidence": 0.90},
                {"name": "Hochstuhl", "volume_m3": 0.5, "quantity": 1, "confidence": 0.80},
                {"name": "Küche 4-5m", "volume_m3": 6.0, "quantity": 1, "confidence": 0.75},
                {"name": "Waschmaschine", "volume_m3": 0.8, "quantity": 1, "confidence": 0.95},
            ]
        }
    },
    
    # ===== 3 BEDROOM APARTMENTS =====
    {
        "profile_key": "3br_family_kids_normal",
        "apartment_size": "3br",
        "household_type": "family_kids",
        "furnishing_level": "normal",
        "persona_description": "Familie mit 2-3 Kindern, vollständig eingerichtet",
        "typical_volume_min": 60,
        "typical_volume_max": 75,
        "typical_boxes": 40,
        "confidence_score": 0.88,
        "typical_items": {
            "living_room": [
                {"name": "Sofa 3-Sitzer", "volume_m3": 3.5, "quantity": 1, "confidence": 0.95},
                {"name": "Sessel", "volume_m3": 1.5, "quantity": 1, "confidence": 0.75},
                {"name": "TV-Möbel", "volume_m3": 1.2, "quantity": 1, "confidence": 0.92},
                {"name": "Couchtisch", "volume_m3": 0.7, "quantity": 1, "confidence": 0.90},
                {"name": "Bücherregal", "volume_m3": 1.5, "quantity": 2, "confidence": 0.85},
                {"name": "Sideboard", "volume_m3": 1.5, "quantity": 1, "confidence": 0.70},
            ],
            "bedroom_parents": [
                {"name": "Doppelbett", "volume_m3": 4.0, "quantity": 1, "confidence": 0.98},
                {"name": "Kleiderschrank groß", "volume_m3": 6.0, "quantity": 1, "confidence": 0.92},
                {"name": "Nachttisch", "volume_m3": 0.3, "quantity": 2, "confidence": 0.92},
                {"name": "Kommode", "volume_m3": 1.8, "quantity": 1, "confidence": 0.88},
            ],
            "bedroom_child1": [
                {"name": "Kinderbett", "volume_m3": 2.2, "quantity": 1, "confidence": 0.95},
                {"name": "Kinderschrank", "volume_m3": 2.5, "quantity": 1, "confidence": 0.90},
                {"name": "Kinderschreibtisch", "volume_m3": 1.0, "quantity": 1, "confidence": 0.75},
                {"name": "Spielzeugkiste", "volume_m3": 0.6, "quantity": 2, "confidence": 0.88},
            ],
            "bedroom_child2": [
                {"name": "Kinderbett", "volume_m3": 2.2, "quantity": 1, "confidence": 0.95},
                {"name": "Kinderschrank", "volume_m3": 2.5, "quantity": 1, "confidence": 0.90},
                {"name": "Regal", "volume_m3": 1.0, "quantity": 1, "confidence": 0.80},
            ],
            "kitchen": [
                {"name": "Esstisch groß", "volume_m3": 2.5, "quantity": 1, "confidence": 0.90},
                {"name": "Essstühle", "volume_m3": 0.4, "quantity": 6, "confidence": 0.90},
                {"name": "Küche 5-6m", "volume_m3": 7.0, "quantity": 1, "confidence": 0.80},
                {"name": "Waschmaschine", "volume_m3": 0.8, "quantity": 1, "confidence": 0.95},
            ]
        }
    },
    
    {
        "profile_key": "3br_couple_normal",
        "apartment_size": "3br",
        "household_type": "couple",
        "furnishing_level": "normal",
        "persona_description": "Paar, 3-Zimmer, mit Home Office oder Hobbyzimmer",
        "typical_volume_min": 52,
        "typical_volume_max": 65,
        "typical_boxes": 30,
        "confidence_score": 0.90,
        "typical_items": {
            "living_room": [
                {"name": "Sofa 3-Sitzer", "volume_m3": 3.5, "quantity": 1, "confidence": 0.95},
                {"name": "Sessel", "volume_m3": 1.5, "quantity": 1, "confidence": 0.75},
                {"name": "TV-Möbel", "volume_m3": 1.2, "quantity": 1, "confidence": 0.92},
                {"name": "Couchtisch", "volume_m3": 0.7, "quantity": 1, "confidence": 0.90},
                {"name": "Bücherregal", "volume_m3": 1.8, "quantity": 2, "confidence": 0.82},
                {"name": "Sideboard", "volume_m3": 1.5, "quantity": 1, "confidence": 0.75},
            ],
            "bedroom": [
                {"name": "Doppelbett", "volume_m3": 4.0, "quantity": 1, "confidence": 0.98},
                {"name": "Kleiderschrank groß", "volume_m3": 6.0, "quantity": 1, "confidence": 0.90},
                {"name": "Nachttisch", "volume_m3": 0.3, "quantity": 2, "confidence": 0.92},
                {"name": "Kommode", "volume_m3": 1.8, "quantity": 1, "confidence": 0.85},
            ],
            "office": [
                {"name": "Schreibtisch groß", "volume_m3": 1.8, "quantity": 1, "confidence": 0.85},
                {"name": "Bürostuhl", "volume_m3": 0.7, "quantity": 1, "confidence": 0.85},
                {"name": "Aktenschrank", "volume_m3": 1.2, "quantity": 1, "confidence": 0.70},
                {"name": "Bücherregal", "volume_m3": 1.8, "quantity": 2, "confidence": 0.75},
            ],
            "guest_hobby": [
                {"name": "Gästebett", "volume_m3": 2.5, "quantity": 1, "confidence": 0.80},
                {"name": "Kleiderschrank klein", "volume_m3": 2.0, "quantity": 1, "confidence": 0.65},
            ],
            "kitchen": [
                {"name": "Esstisch 6-Person", "volume_m3": 2.2, "quantity": 1, "confidence": 0.88},
                {"name": "Essstühle", "volume_m3": 0.4, "quantity": 6, "confidence": 0.88},
                {"name": "Küche 4-5m", "volume_m3": 6.5, "quantity": 1, "confidence": 0.78},
                {"name": "Waschmaschine", "volume_m3": 0.8, "quantity": 1, "confidence": 0.92},
            ]
        }
    },
    
    # ===== 4+ BEDROOM APARTMENTS =====
    {
        "profile_key": "4br_family_kids_normal",
        "apartment_size": "4br",
        "household_type": "family_kids",
        "furnishing_level": "normal",
        "persona_description": "Große Familie, 4+ Zimmer",
        "typical_volume_min": 75,
        "typical_volume_max": 95,
        "typical_boxes": 50,
        "confidence_score": 0.85,
        "typical_items": {
            "living_room": [
                {"name": "Sofa groß", "volume_m3": 4.5, "quantity": 1, "confidence": 0.95},
                {"name": "Sessel", "volume_m3": 1.5, "quantity": 2, "confidence": 0.70},
                {"name": "TV-Möbel", "volume_m3": 1.5, "quantity": 1, "confidence": 0.92},
                {"name": "Couchtisch", "volume_m3": 0.8, "quantity": 1, "confidence": 0.90},
                {"name": "Bücherregal", "volume_m3": 1.8, "quantity": 3, "confidence": 0.80},
            ],
            "bedroom_parents": [
                {"name": "Doppelbett groß", "volume_m3": 5.0, "quantity": 1, "confidence": 0.98},
                {"name": "Kleiderschrank XXL", "volume_m3": 8.0, "quantity": 1, "confidence": 0.90},
                {"name": "Nachttisch", "volume_m3": 0.4, "quantity": 2, "confidence": 0.92},
                {"name": "Kommode", "volume_m3": 2.0, "quantity": 1, "confidence": 0.88},
            ],
            "bedrooms_children": [
                {"name": "Kinderbett", "volume_m3": 2.5, "quantity": 3, "confidence": 0.92},
                {"name": "Kinderschrank", "volume_m3": 2.5, "quantity": 3, "confidence": 0.88},
                {"name": "Schreibtisch", "volume_m3": 1.2, "quantity": 2, "confidence": 0.75},
                {"name": "Spielzeugkiste", "volume_m3": 0.6, "quantity": 4, "confidence": 0.85},
            ],
            "kitchen": [
                {"name": "Esstisch 8-Person", "volume_m3": 3.0, "quantity": 1, "confidence": 0.88},
                {"name": "Essstühle", "volume_m3": 0.4, "quantity": 8, "confidence": 0.88},
                {"name": "Küche groß 6-8m", "volume_m3": 9.0, "quantity": 1, "confidence": 0.80},
                {"name": "Waschmaschine", "volume_m3": 0.8, "quantity": 1, "confidence": 0.95},
                {"name": "Trockner", "volume_m3": 0.8, "quantity": 1, "confidence": 0.75},
            ]
        }
    },
    
    # ===== MINIMALIST VARIANTS =====
    {
        "profile_key": "2br_couple_minimal",
        "apartment_size": "2br",
        "household_type": "couple",
        "furnishing_level": "minimal",
        "persona_description": "Minimalistisches Paar, wenig Besitz",
        "typical_volume_min": 25,
        "typical_volume_max": 35,
        "typical_boxes": 12,
        "confidence_score": 0.88,
        "typical_items": {
            "living_room": [
                {"name": "Sofa 2-Sitzer", "volume_m3": 2.0, "quantity": 1, "confidence": 0.92},
                {"name": "TV-Möbel klein", "volume_m3": 0.6, "quantity": 1, "confidence": 0.85},
                {"name": "Couchtisch", "volume_m3": 0.4, "quantity": 1, "confidence": 0.80},
            ],
            "bedroom": [
                {"name": "Doppelbett", "volume_m3": 3.5, "quantity": 1, "confidence": 0.98},
                {"name": "Kleiderschrank", "volume_m3": 2.5, "quantity": 1, "confidence": 0.88},
                {"name": "Nachttisch", "volume_m3": 0.2, "quantity": 2, "confidence": 0.75},
            ],
            "kitchen": [
                {"name": "Esstisch klein", "volume_m3": 0.8, "quantity": 1, "confidence": 0.85},
                {"name": "Stühle", "volume_m3": 0.3, "quantity": 4, "confidence": 0.85},
                {"name": "Küche 2-3m", "volume_m3": 3.5, "quantity": 1, "confidence": 0.65},
            ]
        }
    },
    
    # ===== FULL/COLLECTOR VARIANTS =====
    {
        "profile_key": "2br_couple_full",
        "apartment_size": "2br",
        "household_type": "couple",
        "furnishing_level": "full",
        "persona_description": "Paar mit viel Besitz, Sammler, lange gewohnt",
        "typical_volume_min": 55,
        "typical_volume_max": 70,
        "typical_boxes": 40,
        "confidence_score": 0.85,
        "typical_items": {
            "living_room": [
                {"name": "Sofa groß", "volume_m3": 3.8, "quantity": 1, "confidence": 0.95},
                {"name": "Sessel", "volume_m3": 1.5, "quantity": 2, "confidence": 0.80},
                {"name": "TV-Möbel", "volume_m3": 1.2, "quantity": 1, "confidence": 0.92},
                {"name": "Vitrine", "volume_m3": 2.0, "quantity": 1, "confidence": 0.75},
                {"name": "Bücherregal", "volume_m3": 1.8, "quantity": 3, "confidence": 0.85},
                {"name": "Sideboard", "volume_m3": 1.5, "quantity": 2, "confidence": 0.70},
            ],
            "bedroom": [
                {"name": "Doppelbett", "volume_m3": 4.5, "quantity": 1, "confidence": 0.98},
                {"name": "Kleiderschrank XXL", "volume_m3": 7.0, "quantity": 1, "confidence": 0.90},
                {"name": "Nachttisch", "volume_m3": 0.4, "quantity": 2, "confidence": 0.92},
                {"name": "Kommode", "volume_m3": 2.0, "quantity": 2, "confidence": 0.85},
            ],
            "office": [
                {"name": "Schreibtisch", "volume_m3": 1.8, "quantity": 1, "confidence": 0.80},
                {"name": "Bürostuhl", "volume_m3": 0.7, "quantity": 1, "confidence": 0.80},
                {"name": "Aktenschrank", "volume_m3": 1.5, "quantity": 2, "confidence": 0.75},
                {"name": "Bücherregal voll", "volume_m3": 2.0, "quantity": 3, "confidence": 0.85},
            ],
            "kitchen": [
                {"name": "Esstisch groß", "volume_m3": 2.5, "quantity": 1, "confidence": 0.88},
                {"name": "Essstühle", "volume_m3": 0.4, "quantity": 6, "confidence": 0.88},
                {"name": "Küche 5-6m", "volume_m3": 7.0, "quantity": 1, "confidence": 0.80},
                {"name": "Waschmaschine", "volume_m3": 0.8, "quantity": 1, "confidence": 0.95},
            ]
        },
        "common_additions": [
            {"question": "Große Büchersammlung (500+ Bücher)?", "item": "large_library", "volume_m3": 6.0},
            {"question": "Weinsammlung?", "item": "wine_collection", "volume_m3": 1.5},
            {"question": "Kunstsammlung?", "item": "art_collection", "volume_m3": 2.0},
        ]
    },
]


def seed_smart_profiles(db):
    """Seed smart apartment profiles"""
    # Check if already seeded
    if db.query(ApartmentProfile).count() > 0:
        print("[*] Smart profiles already exist, skipping...")
        return
    
    print(f"[*] Seeding {len(SMART_PROFILES)} smart apartment profiles...")
    
    for profile_data in SMART_PROFILES:
        profile = ApartmentProfile(**profile_data)
        db.add(profile)
    
    db.commit()
    print(f"[+] Seeded {len(SMART_PROFILES)} smart profiles successfully")


def main():
    """Run profile seeding"""
    db = SessionLocal()
    
    try:
        print("Seeding smart apartment profiles...")
        seed_smart_profiles(db)
        print("\n[+] Smart profiles seeded successfully!")
    except Exception as e:
        print(f"\n[!] Error seeding profiles: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
