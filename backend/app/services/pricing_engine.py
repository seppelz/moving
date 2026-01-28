"""
Pricing calculation engine for MoveMaster
Implements German market pricing logic with smart defaults
"""
import logging
from decimal import Decimal
from typing import List, Dict, Any, Tuple
from app.core.config import settings
from app.schemas.quote import InventoryItem, Service, Address

logger = logging.getLogger(__name__)

class PricingEngine:
    """Core pricing calculation engine"""
    
    def __init__(self):
        self.base_rate_m3_min = Decimal(str(settings.BASE_RATE_PER_M3_MIN))
        self.base_rate_m3_max = Decimal(str(settings.BASE_RATE_PER_M3_MAX))
        self.rate_km_near = Decimal(str(settings.RATE_PER_KM_NEAR))
        self.rate_km_far = Decimal(str(settings.RATE_PER_KM_FAR))
        self.km_threshold = Decimal(str(settings.KM_THRESHOLD))
        self.hourly_labor_min = Decimal(str(settings.HOURLY_LABOR_MIN))
        self.hourly_labor_max = Decimal(str(settings.HOURLY_LABOR_MAX))
        self.min_movers = settings.MIN_MOVERS
        self.floor_surcharge_percent = Decimal(str(settings.FLOOR_SURCHARGE_PERCENT))
        self.hvz_permit_cost = Decimal(str(settings.HVZ_PERMIT_COST))
        self.kitchen_assembly_per_meter = Decimal(str(settings.KITCHEN_ASSEMBLY_PER_METER))
        self.external_lift_cost_min = Decimal(str(settings.EXTERNAL_LIFT_COST_MIN))
        self.external_lift_cost_max = Decimal(str(settings.EXTERNAL_LIFT_COST_MAX))
    
    def calculate_volume(self, inventory: List[InventoryItem]) -> Decimal:
        """Calculate total volume from inventory"""
        total_volume = Decimal('0')
        for item in inventory:
            total_volume += Decimal(str(item.volume_m3)) * item.quantity
        return total_volume
    
    def calculate_man_hours(
        self, 
        volume: Decimal, 
        origin_floor: int = 0,
        destination_floor: int = 0,
        origin_has_elevator: bool = False,
        destination_has_elevator: bool = False,
        has_disassembly: bool = False,
        has_packing: bool = False
    ) -> Decimal:
        """
        Calculate total MAN-HOURS based on volume and complexity.
        This represents the total effort required across all workers.
        """
        # Loading/Unloading effort (0.12h per m³)
        base_man_hours = volume * Decimal('0.12')
        
        # Stairs penalty (if no elevator) - 0.02 man-hours per m³ per floor
        stairs_effort = Decimal('0')
        if not origin_has_elevator and origin_floor > 0:
            stairs_effort += Decimal(str(origin_floor)) * volume * Decimal('0.02')
        if not destination_has_elevator and destination_floor > 0:
            stairs_effort += Decimal(str(destination_floor)) * volume * Decimal('0.02')
        
        # Service adjustments (Man-hours)
        service_man_hours = Decimal('0')
        if has_disassembly:
            service_man_hours += volume * Decimal('0.15')  # Extra 0.15h/m³
        if has_packing:
            service_man_hours += volume * Decimal('0.25')  # Extra 0.25h/m³
        
        total_man_hours = base_man_hours + stairs_effort + service_man_hours
        
        # Minimum 4 man-hours (standard industry baseline)
        return max(total_man_hours, Decimal('4'))

    def determine_crew_size(self, volume: Decimal) -> int:
        """Determine appropriate crew size based on volume"""
        if volume < 20:
            return 2
        elif volume < 45:
            return 3
        else:
            return 4
    
    def calculate_distance_cost(self, distance_km: Decimal) -> Tuple[Decimal, Decimal]:
        """Calculate distance cost with tiered pricing"""
        if distance_km <= self.km_threshold:
            cost = distance_km * self.rate_km_near
            return (cost, cost)
        else:
            near_cost = self.km_threshold * self.rate_km_near
            far_cost = (distance_km - self.km_threshold) * self.rate_km_far
            total = near_cost + far_cost
            return (total, total)
    
    def calculate_floor_surcharge(
        self,
        base_cost: Decimal,
        origin_floor: int,
        destination_floor: int,
        origin_has_elevator: bool,
        destination_has_elevator: bool
    ) -> Decimal:
        """Calculate floor surcharge for moves without elevator"""
        surcharge = Decimal('0')
        if not origin_has_elevator and origin_floor > 2:
            surcharge += base_cost * self.floor_surcharge_percent * Decimal(str(origin_floor - 2))
        if not destination_has_elevator and destination_floor > 2:
            surcharge += base_cost * self.floor_surcharge_percent * Decimal(str(destination_floor - 2))
        return surcharge
    
    def calculate_services_cost(self, services: List[Service]) -> Tuple[Decimal, Decimal]:
        """Calculate cost for additional services"""
        min_cost = Decimal('0')
        max_cost = Decimal('0')
        for service in services:
            if not service.enabled: continue
            if service.service_type == "hvz_permit":
                min_cost += self.hvz_permit_cost
                max_cost += self.hvz_permit_cost
            elif service.service_type == "kitchen_assembly":
                meters = Decimal(str(service.metadata.get("kitchen_meters", 0)))
                min_cost += meters * self.kitchen_assembly_per_meter
                max_cost += meters * self.kitchen_assembly_per_meter
            elif service.service_type == "external_lift":
                min_cost += self.external_lift_cost_min
                max_cost += self.external_lift_cost_max
        return (min_cost, max_cost)
    
    def should_suggest_external_lift(self, floor: int, has_elevator: bool, volume: Decimal) -> bool:
        return (floor > 4 and not has_elevator) or (volume > Decimal('50') and floor > 2 and not has_elevator)

    def generate_quote(
        self,
        volume: Decimal,
        distance_km: Decimal,
        travel_time_hours: Decimal = Decimal('0'),
        origin_floor: int = 0,
        destination_floor: int = 0,
        origin_has_elevator: bool = False,
        destination_has_elevator: bool = False,
        services: List[Service] = None
    ) -> Dict[str, Any]:
        """Generate complete quote with min/max pricing and precise duration"""
        services = services or []
        crew_size = self.determine_crew_size(volume)
        man_hours = self.calculate_man_hours(
            volume, origin_floor, destination_floor,
            origin_has_elevator, destination_has_elevator,
            any(s.enabled and s.service_type == "disassembly" for s in services),
            any(s.enabled and s.service_type == "packing" for s in services)
        )
        
        # Truck speed factor (1.15x slower than car)
        truck_travel_time = travel_time_hours * Decimal('1.15')
        if truck_travel_time > Decimal('4.5'):
            truck_travel_time += Decimal('0.75') # Mandatory break
            
        loading_time = man_hours / Decimal(str(crew_size))
        total_duration = loading_time + truck_travel_time
        
        # Detailed internal logging for troubleshooting
        logger.info(f"GENERATE_QUOTE: Vol={volume}, Dist={distance_km}, RawTravel={travel_time_hours}, Crew={crew_size}, ManHours={man_hours}, FinalDuration={total_duration}")
        
        volume_cost_min = volume * self.base_rate_m3_min
        volume_cost_max = volume * self.base_rate_m3_max
        dist_min, dist_max = self.calculate_distance_cost(distance_km)
        labor_min = man_hours * self.hourly_labor_min
        labor_max = man_hours * self.hourly_labor_max
        floor_surcharge = self.calculate_floor_surcharge((volume_cost_min + labor_min)/2, origin_floor, destination_floor, origin_has_elevator, destination_has_elevator)
        serv_min, serv_max = self.calculate_services_cost(services)
        
        return {
            "min_price": round(volume_cost_min + dist_min + labor_min + floor_surcharge + serv_min, 2),
            "max_price": round(volume_cost_max + dist_max + labor_max + floor_surcharge + serv_max, 2),
            "estimated_hours": round(total_duration, 1),
            "volume_m3": round(volume, 2),
            "distance_km": round(distance_km, 2),
            "breakdown": {
                "man_hours": round(man_hours, 1),
                "crew_size": crew_size,
                "travel_time": round(truck_travel_time, 1),
                "volume_cost": {"min": round(volume_cost_min, 2), "max": round(volume_cost_max, 2)},
                "distance_cost": {"min": round(dist_min, 2), "max": round(dist_max, 2)},
                "labor_cost": {"min": round(labor_min, 2), "max": round(labor_max, 2)},
                "floor_surcharge": round(floor_surcharge, 2),
                "services_cost": {"min": round(serv_min, 2), "max": round(serv_max, 2)}
            },
            "suggestions": {
                "external_lift_origin": self.should_suggest_external_lift(origin_floor, origin_has_elevator, volume),
                "external_lift_destination": self.should_suggest_external_lift(destination_floor, destination_has_elevator, volume)
            }
        }

pricing_engine = PricingEngine()
