"""
Unit tests for pricing engine
"""
import pytest
from decimal import Decimal
from app.services.pricing_engine import PricingEngine
from app.schemas.quote import Service


class TestPricingEngine:
    """Test pricing calculations"""
    
    @pytest.fixture
    def engine(self):
        return PricingEngine()
    
    def test_calculate_distance_cost_near(self, engine):
        """Test distance cost calculation for distances under 50km"""
        distance = Decimal('30')
        min_cost, max_cost = engine.calculate_distance_cost(distance)
        
        # Should use near rate (€2/km)
        expected = Decimal('60')
        assert min_cost == expected
        assert max_cost == expected
    
    def test_calculate_distance_cost_far(self, engine):
        """Test distance cost calculation for distances over 50km"""
        distance = Decimal('100')
        min_cost, max_cost = engine.calculate_distance_cost(distance)
        
        # First 50km at €2/km, next 50km at €1/km
        expected = Decimal('150')  # (50 * 2) + (50 * 1)
        assert min_cost == expected
        assert max_cost == expected
    
    def test_calculate_labor_hours_basic(self, engine):
        """Test basic labor hours calculation"""
        volume = Decimal('30')  # 30m³
        hours = engine.calculate_labor_hours(volume)
        
        # Should be ~3 hours (1 hour per 10m³)
        assert hours >= Decimal('2')  # Minimum 2 hours
        assert hours <= Decimal('5')
    
    def test_calculate_labor_hours_with_stairs(self, engine):
        """Test labor hours with stairs (no elevator)"""
        volume = Decimal('30')
        hours_no_stairs = engine.calculate_labor_hours(volume)
        hours_with_stairs = engine.calculate_labor_hours(
            volume,
            origin_floor=4,
            origin_has_elevator=False
        )
        
        # Stairs should add time
        assert hours_with_stairs > hours_no_stairs
    
    def test_floor_surcharge(self, engine):
        """Test floor surcharge calculation"""
        base_cost = Decimal('1000')
        
        # No surcharge for floor 2 or below
        surcharge_low = engine.calculate_floor_surcharge(
            base_cost, 2, 0, False, True
        )
        assert surcharge_low == Decimal('0')
        
        # Surcharge for floor 5 without elevator
        surcharge_high = engine.calculate_floor_surcharge(
            base_cost, 5, 0, False, True
        )
        assert surcharge_high > Decimal('0')
        
        # 15% per floor above 2nd
        # Floor 5 = 3 floors above 2nd = 45% surcharge
        expected = base_cost * Decimal('0.45')
        assert surcharge_high == expected
    
    def test_should_suggest_external_lift(self, engine):
        """Test external lift suggestion logic"""
        # High floor without elevator
        assert engine.should_suggest_external_lift(5, False, Decimal('30'))
        
        # High volume, medium floor, no elevator
        assert engine.should_suggest_external_lift(3, False, Decimal('60'))
        
        # Low floor with elevator (should not suggest)
        assert not engine.should_suggest_external_lift(2, True, Decimal('30'))
    
    def test_generate_quote_basic(self, engine):
        """Test complete quote generation"""
        volume = Decimal('40')
        distance = Decimal('50')
        
        quote = engine.generate_quote(
            volume=volume,
            distance_km=distance,
            origin_floor=2,
            destination_floor=3,
            origin_has_elevator=True,
            destination_has_elevator=True
        )
        
        # Check all required fields are present
        assert 'min_price' in quote
        assert 'max_price' in quote
        assert 'estimated_hours' in quote
        assert 'volume_m3' in quote
        assert 'breakdown' in quote
        
        # Min price should be less than max price
        assert quote['min_price'] < quote['max_price']
        
        # Volume should match input
        assert quote['volume_m3'] == volume
    
    def test_generate_quote_with_services(self, engine):
        """Test quote generation with additional services"""
        services = [
            Service(service_type='hvz_permit', enabled=True),
            Service(service_type='packing', enabled=True),
        ]
        
        quote = engine.generate_quote(
            volume=Decimal('30'),
            distance_km=Decimal('40'),
            services=services
        )
        
        # Services should increase price
        assert quote['breakdown']['services_cost']['min'] > 0
    
    def test_kitchen_assembly_service(self, engine):
        """Test kitchen assembly cost calculation"""
        services = [
            Service(
                service_type='kitchen_assembly',
                enabled=True,
                metadata={'kitchen_meters': 6}
            )
        ]
        
        min_cost, max_cost = engine.calculate_services_cost(services)
        
        # 6 meters at €45/meter = €270
        expected = Decimal('270')
        assert min_cost == expected
        assert max_cost == expected


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
