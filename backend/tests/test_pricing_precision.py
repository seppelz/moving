from decimal import Decimal
from app.services.pricing_engine import pricing_engine
from app.schemas.quote import Service

def test_long_distance_realistic():
    print("\n--- Test 1: Long Distance (466km, 15m³) ---")
    # Simulation of user input: 15m³, 466km
    volume = Decimal('15')
    distance = Decimal('466')
    travel_time = Decimal('5.5') # Berlin to somewhere far ~5.5h car time
    
    quote = pricing_engine.generate_quote(
        volume=volume,
        distance_km=distance,
        travel_time_hours=travel_time,
        origin_floor=0,
        destination_floor=0
    )
    
    print(f"Volume: {quote['volume_m3']} m³")
    print(f"Distance: {quote['distance_km']} km")
    print(f"Raw Travel Time (Car): {travel_time} h")
    print(f"Calculated Duration (Truck + Loading): {quote['estimated_hours']} h")
    print(f"Crew Size: {quote['breakdown']['crew_size']}")
    print(f"Price: {quote['min_price']} - {quote['max_price']} €")
    
    # Check if duration is realistic (should be > 8h now)
    assert quote['estimated_hours'] > 8
    print("✓ Long distance duration is realistic.")

def test_short_distance_realistic():
    print("\n--- Test 2: Short Distance (5km, 40m³) ---")
    volume = Decimal('40')
    distance = Decimal('5')
    travel_time = Decimal('0.3') # 20 mins
    
    quote = pricing_engine.generate_quote(
        volume=volume,
        distance_km=distance,
        travel_time_hours=travel_time,
        origin_floor=2,
        destination_floor=3,
        origin_has_elevator=False,
        destination_has_elevator=False
    )
    
    print(f"Volume: {quote['volume_m3']} m³")
    print(f"Duration: {quote['estimated_hours']} h")
    print(f"Crew Size: {quote['breakdown']['crew_size']}")
    print(f"Price: {quote['min_price']} - {quote['max_price']} €")
    
    # 40m³ with 3 people should take several hours
    assert quote['estimated_hours'] > 3
    print("✓ Short distance duration is realistic.")

if __name__ == "__main__":
    try:
        from app.core.config import settings
        test_long_distance_realistic()
        test_short_distance_realistic()
        print("\n[SUCCESS] All precision tests passed!")
    except Exception as e:
        print(f"\n[FAILURE] {str(e)}")
        import traceback
        traceback.print_exc()
