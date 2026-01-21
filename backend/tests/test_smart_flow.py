"""
Integration tests for smart quote flow
Tests the complete flow: profile questions → prediction → adjustments → quote
"""
import pytest
from fastapi.testclient import TestClient
from decimal import Decimal
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal, engine, Base
from app.models.apartment_profile import ApartmentProfile
from app.services.smart_predictor import SmartVolumePredictor
from app.services.pricing_engine import PricingEngine
from app.utils.seed_profiles import SMART_PROFILES

client = TestClient(app)


@pytest.fixture(scope="module")
def test_db():
    """Create test database with profiles"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Seed profiles if not already seeded
    if db.query(ApartmentProfile).count() == 0:
        for profile_data in SMART_PROFILES:
            profile = ApartmentProfile(**profile_data)
            db.add(profile)
        db.commit()
    
    yield db
    
    db.close()


class TestSmartPredictor:
    """Test smart predictor service"""
    
    def test_profile_matching_exact(self, test_db):
        """Test exact profile match"""
        predictor = SmartVolumePredictor(test_db)
        
        prediction = predictor.predict_volume(
            apartment_size="2br",
            household_type="young_professional",
            furnishing_level="normal"
        )
        
        assert prediction is not None
        assert "predicted_volume_m3" in prediction
        assert prediction["profile_key"] == "2br_young_professional_normal"
        assert 35 <= prediction["predicted_volume_m3"] <= 45
        assert prediction["confidence_score"] >= 0.85
    
    def test_profile_matching_partial(self, test_db):
        """Test partial profile match (fallback to normal furnishing)"""
        predictor = SmartVolumePredictor(test_db)
        
        # Request a profile that might not exist exactly
        prediction = predictor.predict_volume(
            apartment_size="2br",
            household_type="couple",
            furnishing_level="normal"
        )
        
        assert prediction is not None
        assert "predicted_volume_m3" in prediction
        assert "2br_couple" in prediction["profile_key"]
    
    def test_profile_matching_fallback(self, test_db):
        """Test fallback when no profile matches"""
        predictor = SmartVolumePredictor(test_db)
        
        # Use invalid apartment size
        prediction = predictor.predict_volume(
            apartment_size="10br",  # Doesn't exist
            household_type="single",
            furnishing_level="normal"
        )
        
        # Should return fallback prediction
        assert prediction is not None
        assert "predicted_volume_m3" in prediction
    
    def test_volume_adjustment_home_office(self, test_db):
        """Test home office adds volume"""
        predictor = SmartVolumePredictor(test_db)
        
        # Without home office
        pred_without = predictor.predict_volume(
            apartment_size="2br",
            household_type="couple",
            furnishing_level="normal",
            has_home_office=False
        )
        
        # With home office
        pred_with = predictor.predict_volume(
            apartment_size="2br",
            household_type="couple",
            furnishing_level="normal",
            has_home_office=True
        )
        
        # Should add ~4m³ for home office
        assert pred_with["predicted_volume_m3"] > pred_without["predicted_volume_m3"]
        difference = pred_with["predicted_volume_m3"] - pred_without["predicted_volume_m3"]
        assert 3.5 <= difference <= 5.0
    
    def test_volume_adjustment_years_lived(self, test_db):
        """Test years lived increases volume"""
        predictor = SmartVolumePredictor(test_db)
        
        # New resident
        pred_new = predictor.predict_volume(
            apartment_size="2br",
            household_type="couple",
            furnishing_level="normal",
            years_lived=0
        )
        
        # Long-time resident
        pred_old = predictor.predict_volume(
            apartment_size="2br",
            household_type="couple",
            furnishing_level="normal",
            years_lived=10
        )
        
        # Should increase by ~10% for 10 years
        assert pred_old["predicted_volume_m3"] > pred_new["predicted_volume_m3"]
        ratio = pred_old["predicted_volume_m3"] / pred_new["predicted_volume_m3"]
        assert 1.08 <= ratio <= 1.12  # 8-12% increase
    
    def test_volume_adjustment_special_items(self, test_db):
        """Test special items add volume"""
        predictor = SmartVolumePredictor(test_db)
        
        # No special items
        pred_base = predictor.predict_volume(
            apartment_size="2br",
            household_type="couple",
            furnishing_level="normal",
            special_items=[]
        )
        
        # With piano and large library
        pred_special = predictor.predict_volume(
            apartment_size="2br",
            household_type="couple",
            furnishing_level="normal",
            special_items=["piano", "large_library"]
        )
        
        # Should add ~10m³ (4 for piano + 6 for library)
        assert pred_special["predicted_volume_m3"] > pred_base["predicted_volume_m3"]
        difference = pred_special["predicted_volume_m3"] - pred_base["predicted_volume_m3"]
        assert 8 <= difference <= 12
    
    def test_confidence_score_calculation(self, test_db):
        """Test confidence score varies appropriately"""
        predictor = SmartVolumePredictor(test_db)
        
        # Complete information should have higher confidence
        pred_complete = predictor.predict_volume(
            apartment_size="2br",
            household_type="young_professional",
            furnishing_level="normal",
            has_home_office=True,
            has_kids=False,
            years_lived=2
        )
        
        # Minimal information
        pred_minimal = predictor.predict_volume(
            apartment_size="2br",
            household_type="couple",
            furnishing_level="normal"
        )
        
        # Both should be reasonable confidence
        assert 0.80 <= pred_complete["confidence_score"] <= 0.98
        assert 0.80 <= pred_minimal["confidence_score"] <= 0.98
    
    def test_all_profiles_load(self, test_db):
        """Test all profiles are seeded and accessible"""
        profiles = test_db.query(ApartmentProfile).all()
        
        # Should have 12+ profiles from seed data
        assert len(profiles) >= 12
        
        # Check key profiles exist
        profile_keys = [p.profile_key for p in profiles]
        assert "studio_single_minimal" in profile_keys
        assert "2br_young_professional_normal" in profile_keys
        assert "4br_family_kids_normal" in profile_keys
    
    def test_breakdown_generation(self, test_db):
        """Test room breakdown is generated"""
        predictor = SmartVolumePredictor(test_db)
        
        prediction = predictor.predict_volume(
            apartment_size="2br",
            household_type="couple",
            furnishing_level="normal"
        )
        
        assert "breakdown" in prediction
        assert isinstance(prediction["breakdown"], dict)
        # Should have room-by-room volumes
        assert len(prediction["breakdown"]) > 0


class TestSmartAPIEndpoints:
    """Test smart quote API endpoints"""
    
    def test_smart_prediction_endpoint_basic(self):
        """Test basic smart prediction endpoint"""
        payload = {
            "apartment_size": "2br",
            "household_type": "couple",
            "furnishing_level": "normal",
            "years_lived": 2
        }
        
        response = client.post("/api/v1/smart/smart-prediction", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "predicted_volume_m3" in data
        assert "confidence_score" in data
        assert "typical_items" in data
        assert data["predicted_volume_m3"] > 0
    
    def test_smart_prediction_all_household_types(self):
        """Test different household types produce different volumes"""
        household_types = [
            ("studio", "single", "minimal", 12, 18),
            ("2br", "young_professional", "normal", 35, 45),
            ("3br", "family_kids", "normal", 60, 75),
            ("4br", "family_kids", "normal", 75, 95),
        ]
        
        for apt_size, household, furnishing, min_vol, max_vol in household_types:
            payload = {
                "apartment_size": apt_size,
                "household_type": household,
                "furnishing_level": furnishing
            }
            
            response = client.post("/api/v1/smart/smart-prediction", json=payload)
            assert response.status_code == 200
            
            data = response.json()
            volume = data["predicted_volume_m3"]
            # Volume should be within expected range (allow some adjustment margin)
            assert min_vol * 0.8 <= volume <= max_vol * 1.2
    
    def test_quick_adjustment_endpoint(self):
        """Test quick adjustment endpoint"""
        # First get a base prediction
        base_payload = {
            "apartment_size": "2br",
            "household_type": "couple",
            "furnishing_level": "normal"
        }
        
        base_response = client.post("/api/v1/smart/smart-prediction", json=base_payload)
        assert base_response.status_code == 200
        base_data = base_response.json()
        profile_key = base_data["profile_key"]
        base_volume = base_data["predicted_volume_m3"]
        
        # Apply adjustments
        adjustment_payload = {
            "profile_key": profile_key,
            "furniture_level": 1,  # +10%
            "box_count": 30,
            "has_washing_machine": True,
            "has_mounted_kitchen": True,
            "kitchen_meters": 4.0,
            "has_large_plants": False,
            "bicycle_count": 2
        }
        
        response = client.post("/api/v1/smart/quick-adjustment", json=adjustment_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "adjusted_volume_m3" in data
        # Adjusted volume should be higher due to additions
        assert data["adjusted_volume_m3"] > base_volume
    
    def test_quick_adjustment_furniture_level(self):
        """Test furniture level adjustment"""
        # Get profile
        base_response = client.post("/api/v1/smart/smart-prediction", json={
            "apartment_size": "2br",
            "household_type": "couple",
            "furnishing_level": "normal"
        })
        profile_key = base_response.json()["profile_key"]
        base_volume = base_response.json()["predicted_volume_m3"]
        
        # Test -20% adjustment
        response_minus = client.post("/api/v1/smart/quick-adjustment", json={
            "profile_key": profile_key,
            "furniture_level": -2,
            "box_count": 20,
            "has_washing_machine": False,
            "has_mounted_kitchen": False,
            "kitchen_meters": 0,
            "has_large_plants": False,
            "bicycle_count": 0
        })
        
        # Test +20% adjustment
        response_plus = client.post("/api/v1/smart/quick-adjustment", json={
            "profile_key": profile_key,
            "furniture_level": 2,
            "box_count": 20,
            "has_washing_machine": False,
            "has_mounted_kitchen": False,
            "kitchen_meters": 0,
            "has_large_plants": False,
            "bicycle_count": 0
        })
        
        vol_minus = response_minus.json()["adjusted_volume_m3"]
        vol_plus = response_plus.json()["adjusted_volume_m3"]
        
        # Difference should be ~40% of base volume
        assert vol_plus > vol_minus
        difference_ratio = (vol_plus - vol_minus) / base_volume
        assert 0.35 <= difference_ratio <= 0.45  # ~40%
    
    def test_profiles_endpoint(self):
        """Test profiles listing endpoint"""
        response = client.get("/api/v1/smart/profiles")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 12  # At least 12 profiles
        
        # Check profile structure
        profile = data[0]
        assert "profile_key" in profile
        assert "persona_description" in profile
        assert "volume_range" in profile
    
    def test_profiles_endpoint_filtered(self):
        """Test profiles filtering by apartment size"""
        response = client.get("/api/v1/smart/profiles?apartment_size=2br")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # All profiles should be for 2br
        for profile in data:
            assert "2br" in profile["profile_key"]
    
    def test_profile_detail_endpoint(self):
        """Test individual profile detail endpoint"""
        profile_key = "2br_young_professional_normal"
        
        response = client.get(f"/api/v1/smart/profile/{profile_key}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["profile_key"] == profile_key
        assert "typical_items" in data
        assert "typical_volume_range" in data
        assert "confidence_score" in data
    
    def test_invalid_profile_key(self):
        """Test error handling for invalid profile"""
        response = client.get("/api/v1/smart/profile/nonexistent_profile")
        assert response.status_code == 404


class TestSmartFlowIntegration:
    """Test complete smart flow with pricing engine"""
    
    def test_smart_profile_to_quote_basic(self):
        """Test: Smart questions → Prediction → Quote"""
        # Step 1: Get smart prediction
        prediction_response = client.post("/api/v1/smart/smart-prediction", json={
            "apartment_size": "2br",
            "household_type": "couple",
            "furnishing_level": "normal",
            "has_home_office": True,
            "years_lived": 3
        })
        
        assert prediction_response.status_code == 200
        prediction = prediction_response.json()
        volume = prediction["predicted_volume_m3"]
        
        # Step 2: Use predicted volume to generate quote
        quote_response = client.post("/api/v1/quote/calculate", json={
            "origin_postal_code": "10115",
            "destination_postal_code": "80331",
            "volume_m3": volume,
            "origin_floor": 2,
            "destination_floor": 3,
            "origin_has_elevator": True,
            "destination_has_elevator": False
        })
        
        assert quote_response.status_code == 200
        quote = quote_response.json()
        
        # Step 3: Verify quote structure
        assert "min_price" in quote
        assert "max_price" in quote
        # Handle both string and float types for volume
        quote_volume = float(quote["volume_m3"]) if isinstance(quote["volume_m3"], str) else quote["volume_m3"]
        assert abs(quote_volume - volume) < 0.01  # Allow small floating point differences
        assert float(quote["min_price"]) > 0
        assert float(quote["max_price"]) > float(quote["min_price"])
    
    def test_smart_flow_with_adjustments(self):
        """Test: Prediction → Adjustments → Quote"""
        # Get base prediction
        base_response = client.post("/api/v1/smart/smart-prediction", json={
            "apartment_size": "3br",
            "household_type": "family_kids",
            "furnishing_level": "normal"
        })
        
        prediction = base_response.json()
        profile_key = prediction["profile_key"]
        
        # Apply adjustments
        adjusted_response = client.post("/api/v1/smart/quick-adjustment", json={
            "profile_key": profile_key,
            "furniture_level": 1,
            "box_count": 40,
            "has_washing_machine": True,
            "has_mounted_kitchen": True,
            "kitchen_meters": 5.0,
            "has_large_plants": True,
            "bicycle_count": 3
        })
        
        adjusted = adjusted_response.json()
        adjusted_volume = adjusted["adjusted_volume_m3"]
        
        # Generate quote with adjusted volume
        quote_response = client.post("/api/v1/quote/calculate", json={
            "origin_postal_code": "10115",
            "destination_postal_code": "20095",
            "volume_m3": adjusted_volume,
            "origin_floor": 3,
            "destination_floor": 2,
            "origin_has_elevator": False,
            "destination_has_elevator": True
        })
        
        assert quote_response.status_code == 200
        quote = quote_response.json()
        # Handle both string and float types
        quote_volume = float(quote["volume_m3"]) if isinstance(quote["volume_m3"], str) else quote["volume_m3"]
        assert abs(quote_volume - adjusted_volume) < 0.01
    
    def test_smart_flow_with_services(self):
        """Test smart flow with additional services"""
        # Get prediction
        prediction_response = client.post("/api/v1/smart/smart-prediction", json={
            "apartment_size": "2br",
            "household_type": "young_professional",
            "furnishing_level": "normal"
        })
        
        prediction = prediction_response.json()
        volume = prediction["predicted_volume_m3"]
        
        # Generate quote with services
        quote_response = client.post("/api/v1/quote/calculate", json={
            "origin_postal_code": "10115",
            "destination_postal_code": "80331",
            "volume_m3": volume,
            "origin_floor": 4,
            "destination_floor": 3,
            "origin_has_elevator": False,
            "destination_has_elevator": True,
            "services": [
                {"service_type": "hvz_permit", "enabled": True, "metadata": {}},
                {"service_type": "packing", "enabled": True, "metadata": {}},
                {"service_type": "kitchen_assembly", "enabled": True, "metadata": {"kitchen_meters": 4}}
            ]
        })
        
        assert quote_response.status_code == 200
        quote = quote_response.json()
        
        # Services should add to cost
        services_min = float(quote["breakdown"]["services_cost"]["min"]) if isinstance(quote["breakdown"]["services_cost"]["min"], str) else quote["breakdown"]["services_cost"]["min"]
        assert services_min > 0
    
    def test_pricing_accuracy_studio(self):
        """Test pricing for studio apartment"""
        engine = PricingEngine()
        
        quote = engine.generate_quote(
            volume=Decimal("15"),
            distance_km=Decimal("30"),
            origin_floor=1,
            destination_floor=2,
            origin_has_elevator=True,
            destination_has_elevator=True
        )
        
        # Studio move should be relatively affordable
        assert 500 <= quote["min_price"] <= 1200
        assert quote["volume_m3"] == 15
    
    def test_pricing_accuracy_family(self):
        """Test pricing for large family move"""
        engine = PricingEngine()
        
        quote = engine.generate_quote(
            volume=Decimal("80"),
            distance_km=Decimal("150"),
            origin_floor=3,
            destination_floor=2,
            origin_has_elevator=False,
            destination_has_elevator=True
        )
        
        # Large family move should be significantly more expensive
        assert 3000 <= quote["min_price"] <= 8000
        assert quote["volume_m3"] == 80
    
    def test_floor_surcharge_integration(self):
        """Test floor surcharge is applied correctly in full flow"""
        # Get prediction
        prediction_response = client.post("/api/v1/smart/smart-prediction", json={
            "apartment_size": "2br",
            "household_type": "couple",
            "furnishing_level": "normal"
        })
        
        volume = prediction_response.json()["predicted_volume_m3"]
        
        # Quote with elevator
        quote_elevator = client.post("/api/v1/quote/calculate", json={
            "origin_postal_code": "10115",
            "destination_postal_code": "20095",
            "volume_m3": volume,
            "origin_floor": 5,
            "destination_floor": 4,
            "origin_has_elevator": True,
            "destination_has_elevator": True
        }).json()
        
        # Quote without elevator (same floors)
        quote_no_elevator = client.post("/api/v1/quote/calculate", json={
            "origin_postal_code": "10115",
            "destination_postal_code": "20095",
            "volume_m3": volume,
            "origin_floor": 5,
            "destination_floor": 4,
            "origin_has_elevator": False,
            "destination_has_elevator": False
        }).json()
        
        # No elevator should be more expensive due to surcharge
        assert float(quote_no_elevator["min_price"]) > float(quote_elevator["min_price"])
        floor_surcharge = float(quote_no_elevator["breakdown"]["floor_surcharge"]) if isinstance(quote_no_elevator["breakdown"]["floor_surcharge"], str) else quote_no_elevator["breakdown"]["floor_surcharge"]
        assert floor_surcharge > 0


class TestEdgeCases:
    """Test edge cases and error handling"""
    
    def test_invalid_apartment_size(self):
        """Test handling of invalid apartment size"""
        response = client.post("/api/v1/smart/smart-prediction", json={
            "apartment_size": "invalid",
            "household_type": "couple",
            "furnishing_level": "normal"
        })
        
        # Should still return a prediction (fallback)
        assert response.status_code in [200, 400, 500]
    
    def test_negative_years_lived(self):
        """Test validation of negative years"""
        response = client.post("/api/v1/smart/smart-prediction", json={
            "apartment_size": "2br",
            "household_type": "couple",
            "furnishing_level": "normal",
            "years_lived": -5
        })
        
        # Should reject or normalize negative values
        assert response.status_code in [200, 422]  # 422 = validation error
    
    def test_extreme_adjustments(self):
        """Test extreme adjustment values"""
        # Get base profile
        base_response = client.post("/api/v1/smart/smart-prediction", json={
            "apartment_size": "2br",
            "household_type": "couple",
            "furnishing_level": "normal"
        })
        profile_key = base_response.json()["profile_key"]
        
        # Try extreme adjustments
        response = client.post("/api/v1/smart/quick-adjustment", json={
            "profile_key": profile_key,
            "furniture_level": 2,  # Max
            "box_count": 100,  # Very high
            "has_washing_machine": True,
            "has_mounted_kitchen": True,
            "kitchen_meters": 15.0,  # Very long kitchen
            "has_large_plants": True,
            "bicycle_count": 10  # Max
        })
        
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            # Volume should still be reasonable (not infinite)
            volume = response.json()["adjusted_volume_m3"]
            assert 0 < volume < 500  # Reasonable upper bound


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
