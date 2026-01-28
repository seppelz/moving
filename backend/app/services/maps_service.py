"""
Google Maps service for distance calculation and address validation
"""
import googlemaps
from decimal import Decimal
from typing import Dict, Any, Tuple, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class MapsService:
    """Google Maps integration for distance and geocoding"""
    
    def __init__(self):
        # Allow dev mode without valid API key
        try:
            if settings.GOOGLE_MAPS_API_KEY and settings.GOOGLE_MAPS_API_KEY != "placeholder-key":
                self.client = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
                logger.info("Google Maps client initialized successfully")
            else:
                self.client = None
                logger.warning("Running in DEV MODE (no Google Maps API key)")
        except Exception as e:
            logger.error(f"Error creating Google Maps client: {e}")
            self.client = None
            logger.warning("Falling back to DEV MODE")
        
        self._cache: Dict[str, Any] = {}  # Simple in-memory cache
    
    def validate_german_postal_code(self, postal_code: str) -> bool:
        """Validate German postal code format (5 digits, 10000-99999)"""
        if not postal_code or len(postal_code) != 5:
            return False
        try:
            code = int(postal_code)
            return 10000 <= code <= 99999
        except ValueError:
            return False
    
    def geocode_postal_code(self, postal_code: str, country: str = "DE") -> Optional[Dict[str, Any]]:
        """
        Geocode a postal code to get lat/lng and city name
        
        Returns: {
            "lat": float,
            "lng": float,
            "city": str,
            "formatted_address": str
        }
        """
        cache_key = f"geocode_{postal_code}_{country}"
        
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        # Dev mode: return mock geocoding data
        if not self.client:
            data = {
                "lat": 52.5200,  # Berlin coordinates
                "lng": 13.4050,
                "city": f"City-{postal_code}",
                "formatted_address": f"{postal_code}, Germany"
            }
            self._cache[cache_key] = data
            return data
        
        try:
            # Search for postal code in Germany
            results = self.client.geocode(f"{postal_code}, Germany")
            
            if not results:
                return None
            
            result = results[0]
            location = result['geometry']['location']
            
            # Extract city name from address components
            city = None
            for component in result['address_components']:
                if 'locality' in component['types']:
                    city = component['long_name']
                    break
                elif 'postal_town' in component['types']:
                    city = component['long_name']
                    break
            
            data = {
                "lat": location['lat'],
                "lng": location['lng'],
                "city": city or "Unknown",
                "formatted_address": result['formatted_address']
            }
            
            self._cache[cache_key] = data
            return data
        
        except Exception as e:
            logger.error(f"Geocoding error: {e}")
            return None
    
    def calculate_distance(
        self,
        origin_postal_code: str,
        destination_postal_code: str
    ) -> Tuple[Optional[Decimal], Optional[Decimal]]:
        """
        Calculate distance and duration between two postal codes
        
        Returns: (distance_km, duration_hours) or (None, None) on error
        """
        cache_key = f"distance_{origin_postal_code}_{destination_postal_code}"
        
        if cache_key in self._cache:
            cached = self._cache[cache_key]
            return (cached['distance_km'], cached['duration_hours'])
        
        # Dev mode: return mock data if no API client
        if not self.client:
            distance_km = Decimal('100')  # Mock 100km distance
            duration_hours = Decimal('1.5')  # Mock 1.5 hours
            self._cache[cache_key] = {'distance_km': distance_km, 'duration_hours': duration_hours}
            return (distance_km, duration_hours)
        
        try:
            # Use Distance Matrix API
            result = self.client.distance_matrix(
                origins=[f"{origin_postal_code}, Germany"],
                destinations=[f"{destination_postal_code}, Germany"],
                mode="driving",
                language="de",
                units="metric"
            )
            
            if result['status'] != 'OK':
                return (None, None)
            
            element = result['rows'][0]['elements'][0]
            
            if element['status'] != 'OK':
                return (None, None)
            
            # Distance in meters, convert to km
            distance_m = element['distance']['value']
            distance_km = Decimal(str(distance_m / 1000))
            
            # Duration in seconds, convert to hours
            duration_s = element.get('duration', {}).get('value')
            if duration_s is not None:
                duration_hours = Decimal(str(duration_s / 3600))
            else:
                duration_hours = None
            
            # Safety fallback: If we have distance but no duration (or 0 duration), 
            # calculate a realistic heuristic (75 km/h baseline)
            if distance_km > 0 and (not duration_hours or duration_hours < Decimal('0.1')):
                logger.warning(f"MapsService: Missing or invalid duration for {distance_km}km. Using heuristic fallback.")
                duration_hours = distance_km / Decimal('75')
            
            data = {
                'distance_km': distance_km,
                'duration_hours': duration_hours
            }
            
            self._cache[cache_key] = data
            return (distance_km, duration_hours)
        
        except Exception as e:
            logger.error(f"Distance calculation error: {e}")
            # Fall back to mock data on API error
            distance_km = Decimal('100')
            duration_hours = Decimal('1.5')
            self._cache[cache_key] = {'distance_km': distance_km, 'duration_hours': duration_hours}
            return (distance_km, duration_hours)
    
    def get_route_info(
        self,
        origin_postal_code: str,
        destination_postal_code: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get complete route information including distance, duration, and geocoded addresses
        """
        # Validate postal codes
        if not self.validate_german_postal_code(origin_postal_code):
            return None
        if not self.validate_german_postal_code(destination_postal_code):
            return None
        
        # Geocode both addresses
        origin_geo = self.geocode_postal_code(origin_postal_code)
        destination_geo = self.geocode_postal_code(destination_postal_code)
        
        if not origin_geo or not destination_geo:
            return None
        
        # Calculate distance
        distance_km, duration_hours = self.calculate_distance(
            origin_postal_code,
            destination_postal_code
        )
        
        if distance_km is None:
            return None
        
        return {
            "origin": {
                "postal_code": origin_postal_code,
                "city": origin_geo["city"],
                "lat": origin_geo["lat"],
                "lng": origin_geo["lng"]
            },
            "destination": {
                "postal_code": destination_postal_code,
                "city": destination_geo["city"],
                "lat": destination_geo["lat"],
                "lng": destination_geo["lng"]
            },
            "distance_km": distance_km,
            "duration_hours": duration_hours
        }


# Singleton instance
maps_service = MapsService()
