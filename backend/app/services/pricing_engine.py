"""
Pricing calculation engine for MoveMaster
Implements German market pricing logic with smart defaults
"""
import logging
from datetime import date
from decimal import Decimal
from typing import List, Dict, Any, Tuple, Optional
from app.core.config import settings
from app.schemas.quote import InventoryItem, Service, Address

logger = logging.getLogger(__name__)

# German public holidays (fixed-date only; Easter-based holidays need year-specific calc)
GERMAN_FIXED_HOLIDAYS = [
    (1, 1),   # Neujahr
    (5, 1),   # Tag der Arbeit
    (10, 3),  # Tag der Deutschen Einheit
    (12, 25), # 1. Weihnachtstag
    (12, 26), # 2. Weihnachtstag
]


def _d(value) -> Decimal:
    """Convert any numeric value to Decimal safely"""
    return Decimal(str(value))


def _is_german_holiday(d: date) -> bool:
    """Check if a date is a German public holiday (fixed-date holidays)"""
    return (d.month, d.day) in GERMAN_FIXED_HOLIDAYS


def _is_weekend(d: date) -> bool:
    """Check if a date is Saturday (5) or Sunday (6)"""
    return d.weekday() >= 5


class PricingEngine:
    """Core pricing calculation engine"""

    def __init__(self, company_config: Optional[Dict[str, Any]] = None):
        """
        Initialize pricing engine.

        Args:
            company_config: Optional company-specific pricing overrides from DB.
                           Falls back to global settings for any missing keys.
        """
        cfg = company_config or {}

        self.base_rate_m3_min = _d(cfg.get("base_rate_m3_min", settings.BASE_RATE_PER_M3_MIN))
        self.base_rate_m3_max = _d(cfg.get("base_rate_m3_max", settings.BASE_RATE_PER_M3_MAX))
        self.rate_km_near = _d(cfg.get("rate_km_near", settings.RATE_PER_KM_NEAR))
        self.rate_km_far = _d(cfg.get("rate_km_far", settings.RATE_PER_KM_FAR))
        self.km_threshold = _d(cfg.get("km_threshold", settings.KM_THRESHOLD))
        self.hourly_labor_min = _d(cfg.get("hourly_labor_min", settings.HOURLY_LABOR_MIN))
        self.hourly_labor_max = _d(cfg.get("hourly_labor_max", settings.HOURLY_LABOR_MAX))
        self.min_movers = int(cfg.get("min_movers", settings.MIN_MOVERS))
        self.floor_surcharge_percent = _d(cfg.get("floor_surcharge_percent", settings.FLOOR_SURCHARGE_PERCENT))
        self.hvz_permit_cost = _d(cfg.get("hvz_permit_cost", settings.HVZ_PERMIT_COST))
        self.kitchen_assembly_per_meter = _d(cfg.get("kitchen_assembly_per_meter", settings.KITCHEN_ASSEMBLY_PER_METER))
        self.external_lift_cost_min = _d(cfg.get("external_lift_cost_min", settings.EXTERNAL_LIFT_COST_MIN))
        self.external_lift_cost_max = _d(cfg.get("external_lift_cost_max", settings.EXTERNAL_LIFT_COST_MAX))
        self.vat_rate = _d(cfg.get("vat_rate", getattr(settings, 'VAT_RATE', 0.19)))

        # Regional pricing
        self.enable_regional = cfg.get("enable_regional_pricing", settings.ENABLE_REGIONAL_PRICING)
        self.regional_multipliers = cfg.get("regional_multipliers", settings.REGIONAL_MULTIPLIERS)

        # Seasonal pricing
        self.enable_seasonal = cfg.get("enable_seasonal_pricing", settings.ENABLE_SEASONAL_PRICING)
        self.seasonal_peak_months = cfg.get("seasonal_peak_months", settings.SEASONAL_PEAK_MONTHS)
        self.seasonal_peak_multiplier = _d(cfg.get("seasonal_peak_multiplier", settings.SEASONAL_PEAK_MULTIPLIER))
        self.seasonal_offpeak_months = cfg.get("seasonal_offpeak_months", settings.SEASONAL_OFFPEAK_MONTHS)
        self.seasonal_offpeak_multiplier = _d(cfg.get("seasonal_offpeak_multiplier", settings.SEASONAL_OFFPEAK_MULTIPLIER))

        # Weekend/holiday surcharges
        self.weekend_surcharge_percent = _d(cfg.get("weekend_surcharge_percent", settings.WEEKEND_SURCHARGE_PERCENT))
        self.holiday_surcharge_percent = _d(cfg.get("holiday_surcharge_percent", settings.HOLIDAY_SURCHARGE_PERCENT))

        # Packing materials
        self.packing_materials_per_m3 = _d(cfg.get("packing_materials_per_m3", settings.PACKING_MATERIALS_PER_M3))

        # Heavy item surcharges
        self.heavy_item_surcharges = cfg.get("heavy_item_surcharges", settings.HEAVY_ITEM_SURCHARGES)

        # Long carry
        self.long_carry_per_10m = _d(cfg.get("long_carry_per_10m", settings.LONG_CARRY_PER_10M))

        # Disposal
        self.disposal_base_cost = _d(cfg.get("disposal_base_cost", settings.DISPOSAL_BASE_COST))
        self.disposal_per_m3 = _d(cfg.get("disposal_per_m3", settings.DISPOSAL_PER_M3))

        # Insurance
        self.insurance_basic_flat = _d(cfg.get("insurance_basic_flat", settings.INSURANCE_BASIC_FLAT))
        self.insurance_premium_percent = _d(cfg.get("insurance_premium_percent", settings.INSURANCE_PREMIUM_PERCENT))
        self.insurance_premium_min = _d(cfg.get("insurance_premium_min", settings.INSURANCE_PREMIUM_MIN))

    # ── Multiplier methods ──────────────────────────────────────────────

    def get_regional_multiplier(self, postal_code: Optional[str] = None) -> Decimal:
        """Get regional price multiplier based on postal code prefix"""
        if not self.enable_regional or not postal_code:
            return Decimal('1')
        prefix = postal_code[:2]
        region_map = {
            "80": "munich", "81": "munich", "85": "munich",
            "60": "frankfurt", "61": "frankfurt", "65": "frankfurt",
            "70": "stuttgart", "71": "stuttgart", "73": "stuttgart",
            "20": "hamburg", "21": "hamburg", "22": "hamburg",
            "10": "berlin", "12": "berlin", "13": "berlin", "14": "berlin",
            "50": "cologne", "51": "cologne",
        }
        region = region_map.get(prefix, "default")
        multiplier = self.regional_multipliers.get(region, self.regional_multipliers.get("default", 1.0))
        return _d(multiplier)

    def get_seasonal_multiplier(self, moving_date: Optional[date] = None) -> Decimal:
        """Get seasonal price multiplier based on moving month"""
        if not self.enable_seasonal or not moving_date:
            return Decimal('1')
        month = moving_date.month
        if month in self.seasonal_peak_months:
            return self.seasonal_peak_multiplier
        if month in self.seasonal_offpeak_months:
            return self.seasonal_offpeak_multiplier
        return Decimal('1')

    def get_weekend_holiday_surcharge(self, moving_date: Optional[date] = None) -> Decimal:
        """Get weekend/holiday surcharge multiplier"""
        if not moving_date:
            return Decimal('0')
        if _is_german_holiday(moving_date):
            return self.holiday_surcharge_percent
        if _is_weekend(moving_date):
            return self.weekend_surcharge_percent
        return Decimal('0')

    # ── Cost calculation methods ────────────────────────────────────────

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
        """Determine appropriate crew size based on volume, respecting min_movers config"""
        if volume < 20:
            needed = 2
        elif volume < 45:
            needed = 3
        else:
            needed = 4
        return max(needed, self.min_movers)

    def calculate_distance_cost(self, distance_km: Decimal) -> Tuple[Decimal, Decimal]:
        """Calculate distance cost with tiered pricing and min/max spread"""
        # Apply a ±10% spread to distance costs to reflect route variability
        spread = Decimal('0.10')
        if distance_km <= self.km_threshold:
            base_cost = distance_km * self.rate_km_near
        else:
            near_cost = self.km_threshold * self.rate_km_near
            far_cost = (distance_km - self.km_threshold) * self.rate_km_far
            base_cost = near_cost + far_cost
        return (base_cost * (1 - spread), base_cost * (1 + spread))

    def calculate_floor_surcharge(
        self,
        base_cost_min: Decimal,
        base_cost_max: Decimal,
        origin_floor: int,
        destination_floor: int,
        origin_has_elevator: bool,
        destination_has_elevator: bool
    ) -> Tuple[Decimal, Decimal]:
        """Calculate floor surcharge for moves without elevator (min/max spread)"""
        surcharge_min = Decimal('0')
        surcharge_max = Decimal('0')
        floors = Decimal('0')
        if not origin_has_elevator and origin_floor > 2:
            floors += Decimal(str(origin_floor - 2))
        if not destination_has_elevator and destination_floor > 2:
            floors += Decimal(str(destination_floor - 2))
        if floors > 0:
            surcharge_min = base_cost_min * self.floor_surcharge_percent * floors
            surcharge_max = base_cost_max * self.floor_surcharge_percent * floors
        return (surcharge_min, surcharge_max)

    def calculate_services_cost(self, services: List[Service], volume: Decimal = Decimal('0')) -> Tuple[Decimal, Decimal]:
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
                min_cost += meters * self.kitchen_assembly_per_meter
                max_cost += meters * self.kitchen_assembly_per_meter
            elif service.service_type == "external_lift":
                min_cost += self.external_lift_cost_min
                max_cost += self.external_lift_cost_max
            elif service.service_type == "packing":
                # Packing materials cost (on top of labor already in man_hours)
                materials = volume * self.packing_materials_per_m3
                min_cost += materials
                max_cost += materials
            elif service.service_type == "disposal":
                disposal_m3 = _d(service.metadata.get("disposal_m3", 0))
                cost = self.disposal_base_cost + disposal_m3 * self.disposal_per_m3
                min_cost += cost
                max_cost += cost
            elif service.service_type == "long_carry":
                distance_m = _d(service.metadata.get("carry_distance_m", 0))
                # Charge per 10m beyond the first 10m (free)
                chargeable = max(distance_m - Decimal('10'), Decimal('0'))
                units = (chargeable / Decimal('10')).to_integral_value(rounding='ROUND_CEILING')
                cost = units * self.long_carry_per_10m
                min_cost += cost
                max_cost += cost
            elif service.service_type == "insurance_basic":
                min_cost += self.insurance_basic_flat
                max_cost += self.insurance_basic_flat
            elif service.service_type == "insurance_premium":
                declared_value = _d(service.metadata.get("declared_value", 0))
                premium = max(declared_value * self.insurance_premium_percent, self.insurance_premium_min)
                min_cost += premium
                max_cost += premium
        return (min_cost, max_cost)

    def calculate_heavy_item_surcharges(self, inventory: List[InventoryItem]) -> Decimal:
        """Calculate surcharges for heavy/special items based on item category or name"""
        surcharge = Decimal('0')
        for item in inventory:
            # Match by category or name (case-insensitive)
            item_key = (item.category or "").lower()
            item_name = (item.name or "").lower()
            for heavy_key, cost in self.heavy_item_surcharges.items():
                if heavy_key in item_key or heavy_key in item_name:
                    surcharge += _d(cost) * item.quantity
                    break
        return surcharge

    def should_suggest_external_lift(self, floor: int, has_elevator: bool, volume: Decimal) -> bool:
        return (floor > 4 and not has_elevator) or (volume > Decimal('50') and floor > 2 and not has_elevator)

    # ── Main quote generation ───────────────────────────────────────────

    def generate_quote(
        self,
        volume: Decimal,
        distance_km: Decimal,
        travel_time_hours: Decimal = Decimal('0'),
        origin_floor: int = 0,
        destination_floor: int = 0,
        origin_has_elevator: bool = False,
        destination_has_elevator: bool = False,
        services: List[Service] = None,
        origin_postal_code: Optional[str] = None,
        destination_postal_code: Optional[str] = None,
        moving_date: Optional[date] = None,
        inventory: Optional[List[InventoryItem]] = None
    ) -> Dict[str, Any]:
        """Generate complete quote with min/max pricing and precise duration"""
        services = services or []
        inventory = inventory or []
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
            truck_travel_time += Decimal('0.75')  # Mandatory break

        loading_time = man_hours / Decimal(str(crew_size))
        total_duration = loading_time + truck_travel_time

        logger.info(f"GENERATE_QUOTE: Vol={volume}, Dist={distance_km}, RawTravel={travel_time_hours}, Crew={crew_size}, ManHours={man_hours}, FinalDuration={total_duration}")

        # Base cost components
        volume_cost_min = volume * self.base_rate_m3_min
        volume_cost_max = volume * self.base_rate_m3_max
        dist_min, dist_max = self.calculate_distance_cost(distance_km)
        labor_min = man_hours * self.hourly_labor_min
        labor_max = man_hours * self.hourly_labor_max
        floor_surcharge_min, floor_surcharge_max = self.calculate_floor_surcharge(
            volume_cost_min + labor_min, volume_cost_max + labor_max,
            origin_floor, destination_floor, origin_has_elevator, destination_has_elevator
        )
        serv_min, serv_max = self.calculate_services_cost(services, volume)

        # Heavy item surcharges
        heavy_surcharge = self.calculate_heavy_item_surcharges(inventory)

        netto_min = volume_cost_min + dist_min + labor_min + floor_surcharge_min + serv_min + heavy_surcharge
        netto_max = volume_cost_max + dist_max + labor_max + floor_surcharge_max + serv_max + heavy_surcharge

        # Apply regional multiplier (use higher-cost location)
        regional_origin = self.get_regional_multiplier(origin_postal_code)
        regional_dest = self.get_regional_multiplier(destination_postal_code)
        regional_multiplier = max(regional_origin, regional_dest)

        # Apply seasonal multiplier
        seasonal_multiplier = self.get_seasonal_multiplier(moving_date)

        # Apply weekend/holiday surcharge
        weekend_holiday_pct = self.get_weekend_holiday_surcharge(moving_date)

        combined_multiplier = regional_multiplier * seasonal_multiplier
        netto_min = netto_min * combined_multiplier
        netto_max = netto_max * combined_multiplier

        # Weekend/holiday is additive surcharge on top
        if weekend_holiday_pct > 0:
            netto_min = netto_min * (1 + weekend_holiday_pct)
            netto_max = netto_max * (1 + weekend_holiday_pct)

        netto_min = round(netto_min, 2)
        netto_max = round(netto_max, 2)

        vat_min = round(netto_min * self.vat_rate, 2)
        vat_max = round(netto_max * self.vat_rate, 2)
        brutto_min = round(netto_min + vat_min, 2)
        brutto_max = round(netto_max + vat_max, 2)

        return {
            "min_price": brutto_min,
            "max_price": brutto_max,
            "min_price_netto": netto_min,
            "max_price_netto": netto_max,
            "vat_amount": {"min": vat_min, "max": vat_max},
            "vat_rate": float(self.vat_rate),
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
                "floor_surcharge": {"min": round(floor_surcharge_min, 2), "max": round(floor_surcharge_max, 2)},
                "services_cost": {"min": round(serv_min, 2), "max": round(serv_max, 2)},
                "heavy_item_surcharge": round(heavy_surcharge, 2),
            },
            "multipliers": {
                "regional": float(regional_multiplier),
                "seasonal": float(seasonal_multiplier),
                "weekend_holiday": float(weekend_holiday_pct),
                "combined": float(combined_multiplier * (1 + weekend_holiday_pct)),
            },
            "suggestions": {
                "external_lift_origin": self.should_suggest_external_lift(origin_floor, origin_has_elevator, volume),
                "external_lift_destination": self.should_suggest_external_lift(destination_floor, destination_has_elevator, volume)
            }
        }


# Default engine using global settings (used when no company context)
pricing_engine = PricingEngine()


def get_pricing_engine_for_company(company) -> PricingEngine:
    """
    Create a PricingEngine initialized with company-specific pricing config.
    Falls back to global settings for any keys not set by the company.
    """
    if company and company.pricing_config:
        return PricingEngine(company_config=company.pricing_config)
    return PricingEngine()
