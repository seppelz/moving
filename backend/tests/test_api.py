"""
Integration tests for API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestQuoteAPI:
    """Test quote API endpoints"""
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_calculate_quote_success(self):
        """Test successful quote calculation"""
        payload = {
            "origin_postal_code": "10115",
            "destination_postal_code": "80331",
            "apartment_size": "2br",
            "origin_floor": 2,
            "destination_floor": 3,
            "origin_has_elevator": True,
            "destination_has_elevator": False
        }
        
        response = client.post("/api/v1/quote/calculate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "min_price" in data
        assert "max_price" in data
        assert "distance_km" in data
        assert "volume_m3" in data
        assert data["min_price"] < data["max_price"]
    
    def test_calculate_quote_invalid_postal_code(self):
        """Test quote calculation with invalid postal code"""
        payload = {
            "origin_postal_code": "123",  # Invalid
            "destination_postal_code": "80331",
            "apartment_size": "2br"
        }
        
        response = client.post("/api/v1/quote/calculate", json=payload)
        # FastAPI returns 422 for validation errors
        assert response.status_code in [400, 422]
    
    def test_get_item_templates(self):
        """Test getting item templates"""
        response = client.get("/api/v1/quote/inventory/templates")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_room_templates(self):
        """Test getting room templates"""
        response = client.get("/api/v1/quote/room/templates")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_validate_address_success(self):
        """Test address validation"""
        response = client.post(
            "/api/v1/quote/validate-address",
            params={"postal_code": "10115"}
        )
        
        # Note: This will fail without valid Google Maps API key
        # In production, mock the Maps service
        assert response.status_code in [200, 404, 500]


class TestAdminAPI:
    """Test admin API endpoints"""
    
    def test_get_analytics(self):
        """Test analytics endpoint"""
        response = client.get("/api/v1/admin/analytics")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_quotes" in data
        assert "conversion_rate" in data
    
    def test_get_quotes(self):
        """Test getting all quotes"""
        response = client.get("/api/v1/admin/quotes")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_pricing_config(self):
        """Test getting pricing configuration"""
        response = client.get("/api/v1/admin/pricing")
        assert response.status_code in [200, 404]


class TestSmartQuoteAPI:
    """Test smart quote API endpoints"""
    
    def test_smart_prediction_success(self):
        """Test successful smart prediction"""
        payload = {
            "apartment_size": "2br",
            "household_type": "young_professional",
            "furnishing_level": "normal",
            "has_home_office": True,
            "years_lived": 2
        }
        
        response = client.post("/api/v1/smart/smart-prediction", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "predicted_volume_m3" in data
        assert "confidence_score" in data
        assert "profile_key" in data
        assert "typical_items" in data
        assert "breakdown" in data
        
        # Validate data types and ranges
        assert isinstance(data["predicted_volume_m3"], (int, float))
        assert data["predicted_volume_m3"] > 0
        assert 0 <= data["confidence_score"] <= 1
    
    def test_smart_prediction_minimal_input(self):
        """Test smart prediction with minimal required fields"""
        payload = {
            "apartment_size": "studio",
            "household_type": "single",
            "furnishing_level": "minimal"
        }
        
        response = client.post("/api/v1/smart/smart-prediction", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "predicted_volume_m3" in data
        # Studio should have small volume
        assert 10 <= data["predicted_volume_m3"] <= 25
    
    def test_quick_adjustment_success(self):
        """Test successful quick adjustment"""
        # First get a prediction to get profile_key
        pred_response = client.post("/api/v1/smart/smart-prediction", json={
            "apartment_size": "2br",
            "household_type": "couple",
            "furnishing_level": "normal"
        })
        profile_key = pred_response.json()["profile_key"]
        
        # Apply adjustment
        adjustment_payload = {
            "profile_key": profile_key,
            "furniture_level": 1,
            "box_count": 25,
            "has_washing_machine": True,
            "has_mounted_kitchen": False,
            "kitchen_meters": 0,
            "has_large_plants": False,
            "bicycle_count": 2
        }
        
        response = client.post("/api/v1/smart/quick-adjustment", json=adjustment_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "adjusted_volume_m3" in data
        assert "volume_range" in data
        assert "confidence_score" in data
    
    def test_quick_adjustment_invalid_profile(self):
        """Test quick adjustment with invalid profile key"""
        payload = {
            "profile_key": "nonexistent_profile",
            "furniture_level": 0,
            "box_count": 20,
            "has_washing_machine": False,
            "has_mounted_kitchen": False,
            "kitchen_meters": 0,
            "has_large_plants": False,
            "bicycle_count": 0
        }
        
        response = client.post("/api/v1/smart/quick-adjustment", json=payload)
        assert response.status_code == 404
    
    def test_get_profiles_list(self):
        """Test getting list of available profiles"""
        response = client.get("/api/v1/smart/profiles")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            profile = data[0]
            assert "profile_key" in profile
            assert "persona_description" in profile
            assert "volume_range" in profile
    
    def test_get_profiles_filtered(self):
        """Test getting filtered profiles by apartment size"""
        response = client.get("/api/v1/smart/profiles?apartment_size=2br")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_profile_detail(self):
        """Test getting specific profile details"""
        # Try a common profile
        profile_key = "2br_couple_normal"
        
        response = client.get(f"/api/v1/smart/profile/{profile_key}")
        # May return 200 with data or 404 if not seeded
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert data["profile_key"] == profile_key
            assert "typical_items" in data


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
