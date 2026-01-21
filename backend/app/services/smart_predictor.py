"""
Smart Volume Predictor - AI-powered moving volume estimation
"""
from decimal import Decimal
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.models.apartment_profile import ApartmentProfile


class SmartVolumePredictor:
    """ML-based volume prediction using apartment profiles and adjustments"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def predict_volume(
        self,
        apartment_size: str,
        household_type: str,
        furnishing_level: str,
        has_home_office: bool = False,
        has_kids: bool = False,
        years_lived: int = 0,
        special_items: List[str] = None
    ) -> Dict[str, Any]:
        """
        Predict moving volume based on user inputs
        
        Returns:
            {
                "predicted_volume_m3": 42.5,
                "volume_range": (38, 48),
                "confidence_score": 0.92,
                "typical_items": {...},
                "profile_key": "2br_young_professional",
                "breakdown": {...}
            }
        """
        special_items = special_items or []
        
        # Find matching profile
        profile = self._find_best_profile(
            apartment_size, household_type, furnishing_level
        )
        
        if not profile:
            # Fallback to basic calculation
            return self._fallback_prediction(apartment_size)
        
        # Base volume from profile
        base_min = float(profile.typical_volume_min)
        base_max = float(profile.typical_volume_max)
        base_volume = (base_min + base_max) / 2
        
        # Apply adjustments
        adjusted_volume = self._apply_adjustments(
            base_volume,
            has_home_office=has_home_office,
            has_kids=has_kids,
            years_lived=years_lived,
            special_items=special_items,
            furnishing_level=furnishing_level
        )
        
        # Calculate confidence
        confidence = self._calculate_confidence(
            profile=profile,
            has_complete_info=(has_home_office is not None and has_kids is not None)
        )
        
        # Volume range (±12%)
        volume_range = (
            round(adjusted_volume * 0.88, 1),
            round(adjusted_volume * 1.12, 1)
        )
        
        return {
            "predicted_volume_m3": round(adjusted_volume, 1),
            "volume_range": volume_range,
            "confidence_score": round(confidence, 2),
            "typical_items": profile.typical_items,
            "typical_boxes": profile.typical_boxes,
            "profile_key": profile.profile_key,
            "persona_description": profile.persona_description,
            "breakdown": self._generate_breakdown(profile.typical_items),
            "suggestions": self._generate_suggestions(
                profile, has_home_office, has_kids, special_items
            )
        }
    
    def _find_best_profile(
        self, 
        apartment_size: str, 
        household_type: str, 
        furnishing_level: str
    ) -> Optional[ApartmentProfile]:
        """Find the best matching profile"""
        # Try exact match first
        profile_key = f"{apartment_size}_{household_type}_{furnishing_level}"
        profile = self.db.query(ApartmentProfile).filter(
            ApartmentProfile.profile_key == profile_key
        ).first()
        
        if profile:
            # Increment usage counter
            profile.usage_count += 1
            self.db.commit()
            return profile
        
        # Try without furnishing level
        profile_key_alt = f"{apartment_size}_{household_type}_normal"
        profile = self.db.query(ApartmentProfile).filter(
            ApartmentProfile.profile_key == profile_key_alt
        ).first()
        
        if profile:
            return profile
        
        # Fallback to just apartment size + household
        profiles = self.db.query(ApartmentProfile).filter(
            ApartmentProfile.apartment_size == apartment_size,
            ApartmentProfile.household_type == household_type
        ).all()
        
        if profiles:
            # Return most used profile
            return max(profiles, key=lambda p: p.usage_count)
        
        return None
    
    def _apply_adjustments(
        self,
        base_volume: float,
        has_home_office: bool,
        has_kids: bool,
        years_lived: int,
        special_items: List[str],
        furnishing_level: str
    ) -> float:
        """Apply adjustment factors to base volume"""
        adjusted = base_volume
        
        # Home office adjustment
        if has_home_office:
            adjusted += 4.0  # desk, chair, shelves, equipment
        
        # Kids adjustment (already in profile, but double-check)
        if has_kids and "family" not in furnishing_level:
            adjusted += 8.0  # toys, kids furniture
        
        # Years lived (accumulation factor)
        # 1% more per year, max 10 years
        years_factor = 1 + (min(years_lived, 10) * 0.01)
        adjusted *= years_factor
        
        # Special items
        special_volumes = {
            "piano": 4.0,
            "grand_piano": 6.0,
            "large_library": 6.0,
            "gym_equipment": 5.0,
            "workshop": 8.0,
            "large_aquarium": 2.0,
            "motorcycle": 3.0,
            "many_plants": 3.0,
        }
        
        for item in special_items:
            adjusted += special_volumes.get(item, 0)
        
        return adjusted
    
    def _calculate_confidence(
        self, 
        profile: ApartmentProfile,
        has_complete_info: bool
    ) -> float:
        """Calculate confidence score"""
        base_confidence = profile.confidence_score
        
        # Boost if complete info
        if has_complete_info:
            base_confidence += 0.05
        
        # Factor in profile accuracy
        accuracy_weight = profile.accuracy_rating * 0.1
        
        return min(base_confidence + accuracy_weight, 0.98)
    
    def _generate_breakdown(self, typical_items: Dict) -> Dict[str, float]:
        """Generate volume breakdown by room"""
        breakdown = {}
        
        for room, items in typical_items.items():
            room_volume = sum(
                float(item.get("volume_m3", 0)) * item.get("quantity", 1)
                for item in items
            )
            breakdown[room] = round(room_volume, 1)
        
        return breakdown
    
    def _generate_suggestions(
        self,
        profile: ApartmentProfile,
        has_home_office: bool,
        has_kids: bool,
        special_items: List[str]
    ) -> List[Dict[str, Any]]:
        """Generate smart suggestions for missing items"""
        suggestions = []
        
        # Check common additions from profile
        if profile.common_additions:
            for addition in profile.common_additions:
                suggestions.append({
                    "question": addition.get("question"),
                    "item": addition.get("item"),
                    "volume_impact": addition.get("volume_m3", 0)
                })
        
        return suggestions
    
    def _fallback_prediction(self, apartment_size: str) -> Dict[str, Any]:
        """Fallback prediction if no profile found"""
        base_volumes = {
            "studio": 15,
            "1br": 25,
            "2br": 40,
            "3br": 60,
            "4br": 80,
            "5br": 100,
        }
        
        base = base_volumes.get(apartment_size, 40)
        
        return {
            "predicted_volume_m3": base,
            "volume_range": (base * 0.85, base * 1.15),
            "confidence_score": 0.70,
            "typical_items": {},
            "typical_boxes": int(base * 0.5),
            "profile_key": f"{apartment_size}_fallback",
            "persona_description": "Durchschnittliche Schätzung",
            "breakdown": {},
            "suggestions": []
        }


# Singleton instance (created per request with DB session)
def get_smart_predictor(db: Session) -> SmartVolumePredictor:
    return SmartVolumePredictor(db)
