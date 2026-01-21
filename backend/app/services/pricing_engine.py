"""
Pricing calculation engine for MoveMaster
Implements German market pricing logic with smart defaults
"""
from decimal import Decimal
from typing import List, Dict, Any, Tuple
from app.core.config import settings
from app.schemas.quote import InventoryItem, Service, Address


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
    
    def calculate_labor_hours(
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
        Calculate estimated labor hours based on volume and complexity
        
        Base formula: 
        - ~1 hour per 10m³ for loading/unloading
        - Add time for stairs (no elevator)
        - Add time for disassembly/packing services
        """
        # Base time: 1 hour per 10m³
        base_hours = volume / Decimal('10')
        
        # Stairs penalty (if no elevator)
        stairs_hours = Decimal('0')
        if not origin_has_elevator and origin_floor > 0:
            stairs_hours += Decimal(str(origin_floor)) * Decimal('0.3')  # 18min per floor
        if not destination_has_elevator and destination_floor > 0:
            stairs_hours += Decimal(str(destination_floor)) * Decimal('0.3')
        
        # Service adjustments
        service_hours = Decimal('0')
        if has_disassembly:
            service_hours += volume * Decimal('0.2')  # Extra 20% time for disassembly
        if has_packing:
            service_hours += volume * Decimal('0.3')  # Extra 30% time for packing
        
        total_hours = base_hours + stairs_hours + service_hours
        
        # Minimum 2 hours
        return max(total_hours, Decimal('2'))
    
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
        
        # Origin surcharge (only for floors > 2 without elevator)
        if not origin_has_elevator and origin_floor > 2:
            floors_above_2 = origin_floor - 2
            surcharge += base_cost * self.floor_surcharge_percent * Decimal(str(floors_above_2))
        
        # Destination surcharge
        if not destination_has_elevator and destination_floor > 2:
            floors_above_2 = destination_floor - 2
            surcharge += base_cost * self.floor_surcharge_percent * Decimal(str(floors_above_2))
        
        return surcharge
    
    def calculate_services_cost(self, services: List[Service]) -> Tuple[Decimal, Decimal]:
        """Calculate cost for additional services"""
        min_cost = Decimal('0')
        max_cost = Decimal('0')
        
        for service in services:
            if not service.enabled:
                continue
            
            if service.service_type == "hvz_permit":
                min_cost += self.hvz_permit_cost
                max_cost += self.hvz_permit_cost
            
            elif service.service_type == "kitchen_assembly":
                meters = Decimal(str(service.metadata.get("kitchen_meters", 0)))
                cost = meters * self.kitchen_assembly_per_meter
                min_cost += cost
                max_cost += cost
            
            elif service.service_type == "external_lift":
                min_cost += self.external_lift_cost_min
                max_cost += self.external_lift_cost_max
            
            elif service.service_type == "packing":
                # Packing cost is volume-dependent, will be calculated separately
                pass
            
            elif service.service_type == "disassembly":
                # Disassembly cost is item-dependent, will be calculated separately
                pass
        
        return (min_cost, max_cost)
    
    def should_suggest_external_lift(
        self,
        floor: int,
        has_elevator: bool,
        volume: Decimal
    ) -> bool:
        """Determine if external lift should be suggested"""
        if floor > 4 and not has_elevator:
            return True
        if volume > Decimal('50') and floor > 2 and not has_elevator:
            return True
        return False
    
    def generate_quote(
        self,
        volume: Decimal,
        distance_km: Decimal,
        origin_floor: int = 0,
        destination_floor: int = 0,
        origin_has_elevator: bool = False,
        destination_has_elevator: bool = False,
        services: List[Service] = None
    ) -> Dict[str, Any]:
        """
        Generate complete quote with min/max pricing
        
        Returns: {
            min_price, max_price, estimated_hours, volume_m3,
            breakdown: {volume_cost, distance_cost, labor_cost, floor_surcharge, services_cost}
        }
        """
        if services is None:
            services = []
        
        # Check for service flags
        has_disassembly = any(s.enabled and s.service_type == "disassembly" for s in services)
        has_packing = any(s.enabled and s.service_type == "packing" for s in services)
        
        # Calculate components
        estimated_hours = self.calculate_labor_hours(
            volume, origin_floor, destination_floor,
            origin_has_elevator, destination_has_elevator,
            has_disassembly, has_packing
        )
        
        # Volume cost
        volume_cost_min = volume * self.base_rate_m3_min
        volume_cost_max = volume * self.base_rate_m3_max
        
        # Distance cost
        distance_cost_min, distance_cost_max = self.calculate_distance_cost(distance_km)
        
        # Labor cost (hours × hourly rate × number of movers)
        labor_cost_min = estimated_hours * self.hourly_labor_min * Decimal(str(self.min_movers))
        labor_cost_max = estimated_hours * self.hourly_labor_max * Decimal(str(self.min_movers))
        
        # Base cost for floor surcharge calculation
        base_cost = (volume_cost_min + distance_cost_min + labor_cost_min) / Decimal('2')
        floor_surcharge = self.calculate_floor_surcharge(
            base_cost, origin_floor, destination_floor,
            origin_has_elevator, destination_has_elevator
        )
        
        # Services cost
        services_cost_min, services_cost_max = self.calculate_services_cost(services)
        
        # Packing service cost (based on volume)
        if has_packing:
            packing_cost_min = volume * Decimal('15')  # €15-25 per m³ for packing
            packing_cost_max = volume * Decimal('25')
            services_cost_min += packing_cost_min
            services_cost_max += packing_cost_max
        
        # Disassembly service cost (based on volume/complexity)
        if has_disassembly:
            disassembly_cost_min = volume * Decimal('8')  # €8-15 per m³
            disassembly_cost_max = volume * Decimal('15')
            services_cost_min += disassembly_cost_min
            services_cost_max += disassembly_cost_max
        
        # Total
        min_price = volume_cost_min + distance_cost_min + labor_cost_min + floor_surcharge + services_cost_min
        max_price = volume_cost_max + distance_cost_max + labor_cost_max + floor_surcharge + services_cost_max
        
        # Suggestions
        suggest_external_lift_origin = self.should_suggest_external_lift(
            origin_floor, origin_has_elevator, volume
        )
        suggest_external_lift_dest = self.should_suggest_external_lift(
            destination_floor, destination_has_elevator, volume
        )
        
        return {
            "min_price": round(min_price, 2),
            "max_price": round(max_price, 2),
            "estimated_hours": round(estimated_hours, 1),
            "volume_m3": round(volume, 2),
            "distance_km": round(distance_km, 2),
            "breakdown": {
                "volume_cost": {
                    "min": round(volume_cost_min, 2),
                    "max": round(volume_cost_max, 2)
                },
                "distance_cost": {
                    "min": round(distance_cost_min, 2),
                    "max": round(distance_cost_max, 2)
                },
                "labor_cost": {
                    "min": round(labor_cost_min, 2),
                    "max": round(labor_cost_max, 2)
                },
                "floor_surcharge": round(floor_surcharge, 2),
                "services_cost": {
                    "min": round(services_cost_min, 2),
                    "max": round(services_cost_max, 2)
                }
            },
            "suggestions": {
                "external_lift_origin": suggest_external_lift_origin,
                "external_lift_destination": suggest_external_lift_dest
            }
        }


# Singleton instance
pricing_engine = PricingEngine()
