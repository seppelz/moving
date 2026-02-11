"""
Comprehensive unit tests for the PricingEngine.
Covers: volume, distance, man-hours, crew sizing, floor surcharges,
        services, heavy items, multipliers, and full quote generation.
"""
import pytest
from datetime import date
from decimal import Decimal
from app.services.pricing_engine import (
    PricingEngine, _is_german_holiday, _is_weekend
)
from app.schemas.quote import Service, InventoryItem


# ── Fixtures ─────────────────────────────────────────────────────

@pytest.fixture
def engine():
    """Default pricing engine with global settings"""
    return PricingEngine()


@pytest.fixture
def custom_engine():
    """Engine with explicit config for deterministic tests"""
    return PricingEngine(company_config={
        "base_rate_m3_min": 25.0,
        "base_rate_m3_max": 35.0,
        "rate_km_near": 2.0,
        "rate_km_far": 1.0,
        "km_threshold": 50.0,
        "hourly_labor_min": 60.0,
        "hourly_labor_max": 80.0,
        "min_movers": 2,
        "floor_surcharge_percent": 0.15,
        "hvz_permit_cost": 120.0,
        "kitchen_assembly_per_meter": 45.0,
        "external_lift_cost_min": 350.0,
        "external_lift_cost_max": 500.0,
        "weekend_surcharge_percent": 0.25,
        "holiday_surcharge_percent": 0.50,
        "packing_materials_per_m3": 8.0,
        "heavy_item_surcharges": {
            "piano": 150.0,
            "safe": 120.0,
            "aquarium": 80.0,
            "gym_equipment": 60.0,
            "marble_table": 80.0,
            "antique": 100.0,
        },
        "long_carry_per_10m": 35.0,
        "disposal_base_cost": 80.0,
        "disposal_per_m3": 45.0,
        "insurance_basic_flat": 49.0,
        "insurance_premium_percent": 0.01,
        "insurance_premium_min": 89.0,
        "enable_regional_pricing": False,
        "enable_seasonal_pricing": False,
        "seasonal_peak_multiplier": 1.15,
        "seasonal_offpeak_multiplier": 1.0,
    })


def make_item(name="Sofa", volume=0.5, quantity=1, category=None):
    return InventoryItem(
        item_id="test", name=name, quantity=quantity,
        volume_m3=Decimal(str(volume)), category=category,
    )


def make_service(service_type, enabled=True, metadata=None):
    return Service(
        service_type=service_type, enabled=enabled,
        metadata=metadata or {},
    )


# ── Helper functions ─────────────────────────────────────────────

class TestHelpers:
    def test_is_weekend_saturday(self):
        assert _is_weekend(date(2025, 1, 4))  # Saturday

    def test_is_weekend_sunday(self):
        assert _is_weekend(date(2025, 1, 5))  # Sunday

    def test_is_not_weekend(self):
        assert not _is_weekend(date(2025, 1, 6))  # Monday

    def test_is_german_holiday_neujahr(self):
        assert _is_german_holiday(date(2025, 1, 1))

    def test_is_german_holiday_tag_der_arbeit(self):
        assert _is_german_holiday(date(2025, 5, 1))

    def test_is_german_holiday_einheit(self):
        assert _is_german_holiday(date(2025, 10, 3))

    def test_is_german_holiday_weihnachten(self):
        assert _is_german_holiday(date(2025, 12, 25))
        assert _is_german_holiday(date(2025, 12, 26))

    def test_is_not_holiday(self):
        assert not _is_german_holiday(date(2025, 3, 15))


# ── Volume calculation ───────────────────────────────────────────

class TestVolumeCalculation:
    def test_single_item(self, engine):
        items = [make_item(volume=0.5, quantity=1)]
        assert engine.calculate_volume(items) == Decimal("0.5")

    def test_multiple_items(self, engine):
        items = [
            make_item(volume=0.5, quantity=2),
            make_item(volume=1.0, quantity=3),
        ]
        assert engine.calculate_volume(items) == Decimal("4.0")

    def test_empty_inventory(self, engine):
        assert engine.calculate_volume([]) == Decimal("0")


# ── Distance cost ────────────────────────────────────────────────

class TestDistanceCost:
    def test_near_distance_base_cost(self, custom_engine):
        """30km at €2/km = €60 base, then ±10% spread"""
        min_cost, max_cost = custom_engine.calculate_distance_cost(Decimal("30"))
        assert min_cost == Decimal("54.0")   # 60 * 0.9
        assert max_cost == Decimal("66.0")   # 60 * 1.1

    def test_at_threshold(self, custom_engine):
        """Exactly 50km at €2/km = €100 base"""
        min_cost, max_cost = custom_engine.calculate_distance_cost(Decimal("50"))
        assert min_cost == Decimal("90.0")   # 100 * 0.9
        assert max_cost == Decimal("110.0")  # 100 * 1.1

    def test_far_distance_tiered(self, custom_engine):
        """100km: first 50km at €2/km + next 50km at €1/km = €150 base"""
        min_cost, max_cost = custom_engine.calculate_distance_cost(Decimal("100"))
        assert min_cost == Decimal("135.0")  # 150 * 0.9
        assert max_cost == Decimal("165.0")  # 150 * 1.1

    def test_zero_distance(self, custom_engine):
        min_cost, max_cost = custom_engine.calculate_distance_cost(Decimal("0"))
        assert min_cost == Decimal("0")
        assert max_cost == Decimal("0")

    def test_min_always_less_than_max(self, custom_engine):
        for km in [10, 50, 100, 200, 500]:
            min_c, max_c = custom_engine.calculate_distance_cost(Decimal(str(km)))
            assert min_c < max_c


# ── Man-hours calculation ────────────────────────────────────────

class TestManHours:
    def test_base_calculation(self, engine):
        """40m³ × 0.12 h/m³ = 4.8 man-hours"""
        hours = engine.calculate_man_hours(Decimal("40"))
        assert hours == Decimal("4.80")

    def test_minimum_4_hours(self, engine):
        """Small volume still gets minimum 4 hours"""
        hours = engine.calculate_man_hours(Decimal("10"))
        # 10 * 0.12 = 1.2, clamped to 4
        assert hours == Decimal("4")

    def test_stairs_add_time_origin(self, engine):
        """Stairs penalty: 0.02 h/m³ per floor without elevator"""
        base = engine.calculate_man_hours(Decimal("40"))
        with_stairs = engine.calculate_man_hours(
            Decimal("40"), origin_floor=4, origin_has_elevator=False
        )
        # Extra: 4 floors × 40m³ × 0.02 = 3.2 man-hours
        assert with_stairs == base + Decimal("3.2")

    def test_stairs_add_time_both(self, engine):
        """Both origin and destination stairs add independently"""
        with_both = engine.calculate_man_hours(
            Decimal("40"),
            origin_floor=3, destination_floor=2,
            origin_has_elevator=False, destination_has_elevator=False,
        )
        base = Decimal("40") * Decimal("0.12")  # 4.8
        origin_stairs = Decimal("3") * Decimal("40") * Decimal("0.02")  # 2.4
        dest_stairs = Decimal("2") * Decimal("40") * Decimal("0.02")    # 1.6
        expected = base + origin_stairs + dest_stairs  # 8.8
        assert with_both == expected

    def test_elevator_skips_stairs_penalty(self, engine):
        """With elevator, no stairs penalty even on high floor"""
        base = engine.calculate_man_hours(Decimal("40"))
        with_elevator = engine.calculate_man_hours(
            Decimal("40"), origin_floor=5, origin_has_elevator=True
        )
        assert with_elevator == base

    def test_disassembly_adds_time(self, engine):
        """Disassembly: +0.15 h/m³"""
        base = engine.calculate_man_hours(Decimal("40"))
        with_disassembly = engine.calculate_man_hours(
            Decimal("40"), has_disassembly=True
        )
        assert with_disassembly == base + Decimal("40") * Decimal("0.15")

    def test_packing_adds_time(self, engine):
        """Packing: +0.25 h/m³"""
        base = engine.calculate_man_hours(Decimal("40"))
        with_packing = engine.calculate_man_hours(
            Decimal("40"), has_packing=True
        )
        assert with_packing == base + Decimal("40") * Decimal("0.25")

    def test_all_extras_combined(self, engine):
        """Stairs + disassembly + packing all stack"""
        hours = engine.calculate_man_hours(
            Decimal("40"),
            origin_floor=3, origin_has_elevator=False,
            has_disassembly=True, has_packing=True,
        )
        expected = (
            Decimal("40") * Decimal("0.12")        # base: 4.8
            + Decimal("3") * Decimal("40") * Decimal("0.02")  # stairs: 2.4
            + Decimal("40") * Decimal("0.15")       # disassembly: 6.0
            + Decimal("40") * Decimal("0.25")       # packing: 10.0
        )
        assert hours == expected  # 23.2


# ── Crew sizing ──────────────────────────────────────────────────

class TestCrewSizing:
    def test_small_volume(self, custom_engine):
        assert custom_engine.determine_crew_size(Decimal("15")) == 2

    def test_medium_volume(self, custom_engine):
        assert custom_engine.determine_crew_size(Decimal("30")) == 3

    def test_large_volume(self, custom_engine):
        assert custom_engine.determine_crew_size(Decimal("50")) == 4

    def test_threshold_20(self, custom_engine):
        assert custom_engine.determine_crew_size(Decimal("19")) == 2
        assert custom_engine.determine_crew_size(Decimal("20")) == 3

    def test_threshold_45(self, custom_engine):
        assert custom_engine.determine_crew_size(Decimal("44")) == 3
        assert custom_engine.determine_crew_size(Decimal("45")) == 4

    def test_respects_min_movers(self):
        engine = PricingEngine(company_config={"min_movers": 3})
        # Even small volume gets 3 (min_movers override)
        assert engine.determine_crew_size(Decimal("10")) == 3


# ── Floor surcharge ──────────────────────────────────────────────

class TestFloorSurcharge:
    def test_no_surcharge_floor_2(self, custom_engine):
        """Floor 2 or below: no surcharge"""
        min_s, max_s = custom_engine.calculate_floor_surcharge(
            Decimal("1000"), Decimal("1400"),
            origin_floor=2, destination_floor=0,
            origin_has_elevator=False, destination_has_elevator=True,
        )
        assert min_s == Decimal("0")
        assert max_s == Decimal("0")

    def test_surcharge_floor_5_origin(self, custom_engine):
        """Floor 5 without elevator: 3 floors above 2nd × 15%"""
        min_s, max_s = custom_engine.calculate_floor_surcharge(
            Decimal("1000"), Decimal("1400"),
            origin_floor=5, destination_floor=0,
            origin_has_elevator=False, destination_has_elevator=True,
        )
        # 3 floors × 15% = 45%
        assert min_s == Decimal("1000") * Decimal("0.15") * Decimal("3")  # 450
        assert max_s == Decimal("1400") * Decimal("0.15") * Decimal("3")  # 630

    def test_surcharge_both_floors(self, custom_engine):
        """Both origin (4th) and dest (5th) without elevator"""
        min_s, max_s = custom_engine.calculate_floor_surcharge(
            Decimal("1000"), Decimal("1400"),
            origin_floor=4, destination_floor=5,
            origin_has_elevator=False, destination_has_elevator=False,
        )
        # Origin: 2 floors × 15%, Dest: 3 floors × 15% → total 5 floors
        total_floors = Decimal("5")
        assert min_s == Decimal("1000") * Decimal("0.15") * total_floors  # 750
        assert max_s == Decimal("1400") * Decimal("0.15") * total_floors  # 1050

    def test_elevator_skips_surcharge(self, custom_engine):
        """With elevator, no floor surcharge even on high floor"""
        min_s, max_s = custom_engine.calculate_floor_surcharge(
            Decimal("1000"), Decimal("1400"),
            origin_floor=10, destination_floor=8,
            origin_has_elevator=True, destination_has_elevator=True,
        )
        assert min_s == Decimal("0")
        assert max_s == Decimal("0")


# ── Service costs ────────────────────────────────────────────────

class TestServiceCosts:
    def test_hvz_permit(self, custom_engine):
        services = [make_service("hvz_permit")]
        min_c, max_c = custom_engine.calculate_services_cost(services)
        assert min_c == Decimal("120")
        assert max_c == Decimal("120")

    def test_kitchen_assembly(self, custom_engine):
        """6 meters × €45/m = €270"""
        services = [make_service("kitchen_assembly", metadata={"kitchen_meters": 6})]
        min_c, max_c = custom_engine.calculate_services_cost(services)
        assert min_c == Decimal("270")
        assert max_c == Decimal("270")

    def test_external_lift_min_max(self, custom_engine):
        """External lift has a min/max spread"""
        services = [make_service("external_lift")]
        min_c, max_c = custom_engine.calculate_services_cost(services)
        assert min_c == Decimal("350")
        assert max_c == Decimal("500")

    def test_packing_materials(self, custom_engine):
        """40m³ × €8/m³ = €320"""
        services = [make_service("packing")]
        min_c, max_c = custom_engine.calculate_services_cost(services, volume=Decimal("40"))
        assert min_c == Decimal("320")
        assert max_c == Decimal("320")

    def test_disposal(self, custom_engine):
        """€80 base + 3m³ × €45 = €215"""
        services = [make_service("disposal", metadata={"disposal_m3": 3})]
        min_c, max_c = custom_engine.calculate_services_cost(services)
        assert min_c == Decimal("215")
        assert max_c == Decimal("215")

    def test_long_carry_first_10m_free(self, custom_engine):
        """First 10m free, no charge"""
        services = [make_service("long_carry", metadata={"carry_distance_m": 10})]
        min_c, max_c = custom_engine.calculate_services_cost(services)
        assert min_c == Decimal("0")
        assert max_c == Decimal("0")

    def test_long_carry_25m(self, custom_engine):
        """25m: chargeable = 15m → 2 units (ceiling) × €35 = €70"""
        services = [make_service("long_carry", metadata={"carry_distance_m": 25})]
        min_c, max_c = custom_engine.calculate_services_cost(services)
        assert min_c == Decimal("70")

    def test_long_carry_30m(self, custom_engine):
        """30m: chargeable = 20m → 2 units × €35 = €70"""
        services = [make_service("long_carry", metadata={"carry_distance_m": 30})]
        min_c, max_c = custom_engine.calculate_services_cost(services)
        assert min_c == Decimal("70")

    def test_insurance_basic(self, custom_engine):
        services = [make_service("insurance_basic")]
        min_c, max_c = custom_engine.calculate_services_cost(services)
        assert min_c == Decimal("49")

    def test_insurance_premium_above_minimum(self, custom_engine):
        """Declared €20,000 × 1% = €200 > min €89"""
        services = [make_service("insurance_premium", metadata={"declared_value": 20000})]
        min_c, max_c = custom_engine.calculate_services_cost(services)
        assert min_c == Decimal("200")

    def test_insurance_premium_below_minimum(self, custom_engine):
        """Declared €5,000 × 1% = €50 < min €89, so €89"""
        services = [make_service("insurance_premium", metadata={"declared_value": 5000})]
        min_c, max_c = custom_engine.calculate_services_cost(services)
        assert min_c == Decimal("89")

    def test_disabled_service_ignored(self, custom_engine):
        services = [make_service("hvz_permit", enabled=False)]
        min_c, max_c = custom_engine.calculate_services_cost(services)
        assert min_c == Decimal("0")
        assert max_c == Decimal("0")

    def test_multiple_services_stacked(self, custom_engine):
        """HVZ (€120) + kitchen 4m (€180) + basic insurance (€49) = €349"""
        services = [
            make_service("hvz_permit"),
            make_service("kitchen_assembly", metadata={"kitchen_meters": 4}),
            make_service("insurance_basic"),
        ]
        min_c, max_c = custom_engine.calculate_services_cost(services)
        assert min_c == Decimal("349")
        assert max_c == Decimal("349")


# ── Heavy item surcharges ────────────────────────────────────────

class TestHeavyItemSurcharges:
    def test_piano_by_name(self, custom_engine):
        items = [make_item(name="Klavier Piano", volume=1.5)]
        assert custom_engine.calculate_heavy_item_surcharges(items) == Decimal("150")

    def test_piano_by_category(self, custom_engine):
        items = [make_item(name="Instrument", category="piano", volume=1.5)]
        assert custom_engine.calculate_heavy_item_surcharges(items) == Decimal("150")

    def test_safe_surcharge(self, custom_engine):
        items = [make_item(name="Tresor Safe", volume=0.3)]
        assert custom_engine.calculate_heavy_item_surcharges(items) == Decimal("120")

    def test_quantity_multiplied(self, custom_engine):
        """2 pianos = 2 × €150 = €300"""
        items = [make_item(name="piano", volume=1.5, quantity=2)]
        assert custom_engine.calculate_heavy_item_surcharges(items) == Decimal("300")

    def test_no_match_no_surcharge(self, custom_engine):
        items = [make_item(name="Bücherregal", volume=0.5)]
        assert custom_engine.calculate_heavy_item_surcharges(items) == Decimal("0")

    def test_multiple_heavy_items(self, custom_engine):
        """Piano (€150) + Safe (€120) + Aquarium (€80) = €350"""
        items = [
            make_item(name="piano", volume=1.5),
            make_item(name="safe", volume=0.3),
            make_item(name="aquarium", volume=0.5),
        ]
        assert custom_engine.calculate_heavy_item_surcharges(items) == Decimal("350")

    def test_case_insensitive(self, custom_engine):
        items = [make_item(name="PIANO Grand", volume=2.0)]
        assert custom_engine.calculate_heavy_item_surcharges(items) == Decimal("150")


# ── External lift suggestion ─────────────────────────────────────

class TestExternalLiftSuggestion:
    def test_high_floor_no_elevator(self, engine):
        assert engine.should_suggest_external_lift(5, False, Decimal("30"))

    def test_high_volume_medium_floor(self, engine):
        assert engine.should_suggest_external_lift(3, False, Decimal("60"))

    def test_low_floor_no_suggestion(self, engine):
        assert not engine.should_suggest_external_lift(2, False, Decimal("30"))

    def test_has_elevator_no_suggestion(self, engine):
        assert not engine.should_suggest_external_lift(5, True, Decimal("30"))

    def test_threshold_floor_4(self, engine):
        """Floor 4 without elevator, normal volume → no suggestion"""
        assert not engine.should_suggest_external_lift(4, False, Decimal("30"))

    def test_threshold_volume_50(self, engine):
        """Volume exactly 50 at floor 3 → no suggestion (needs >50)"""
        assert not engine.should_suggest_external_lift(3, False, Decimal("50"))
        assert engine.should_suggest_external_lift(3, False, Decimal("51"))


# ── Multipliers ──────────────────────────────────────────────────

class TestMultipliers:
    def test_regional_disabled_returns_1(self, custom_engine):
        assert custom_engine.get_regional_multiplier("80331") == Decimal("1")

    def test_regional_enabled_munich(self):
        engine = PricingEngine(company_config={
            "enable_regional_pricing": True,
            "regional_multipliers": {"munich": 1.15, "default": 1.0},
        })
        assert engine.get_regional_multiplier("80331") == Decimal("1.15")

    def test_regional_enabled_berlin(self):
        engine = PricingEngine(company_config={
            "enable_regional_pricing": True,
            "regional_multipliers": {"berlin": 1.08, "default": 1.0},
        })
        assert engine.get_regional_multiplier("10115") == Decimal("1.08")

    def test_regional_unknown_postal_code(self):
        engine = PricingEngine(company_config={
            "enable_regional_pricing": True,
            "regional_multipliers": {"munich": 1.15, "default": 1.0},
        })
        assert engine.get_regional_multiplier("99999") == Decimal("1.0")

    def test_regional_no_postal_code(self):
        engine = PricingEngine(company_config={"enable_regional_pricing": True})
        assert engine.get_regional_multiplier(None) == Decimal("1")

    def test_seasonal_disabled_returns_1(self, custom_engine):
        assert custom_engine.get_seasonal_multiplier(date(2025, 7, 1)) == Decimal("1")

    def test_seasonal_peak(self):
        engine = PricingEngine(company_config={
            "enable_seasonal_pricing": True,
            "seasonal_peak_months": [5, 6, 7, 8, 9],
            "seasonal_peak_multiplier": 1.15,
        })
        assert engine.get_seasonal_multiplier(date(2025, 7, 1)) == Decimal("1.15")

    def test_seasonal_offpeak(self):
        engine = PricingEngine(company_config={
            "enable_seasonal_pricing": True,
            "seasonal_offpeak_months": [12, 1, 2],
            "seasonal_offpeak_multiplier": 0.9,
        })
        assert engine.get_seasonal_multiplier(date(2025, 1, 15)) == Decimal("0.9")

    def test_seasonal_normal_month(self):
        engine = PricingEngine(company_config={
            "enable_seasonal_pricing": True,
            "seasonal_peak_months": [5, 6, 7, 8, 9],
            "seasonal_offpeak_months": [12, 1, 2],
        })
        assert engine.get_seasonal_multiplier(date(2025, 4, 1)) == Decimal("1")

    def test_weekend_surcharge_saturday(self, custom_engine):
        assert custom_engine.get_weekend_holiday_surcharge(date(2025, 1, 4)) == Decimal("0.25")

    def test_weekend_surcharge_sunday(self, custom_engine):
        assert custom_engine.get_weekend_holiday_surcharge(date(2025, 1, 5)) == Decimal("0.25")

    def test_holiday_surcharge_takes_precedence(self, custom_engine):
        """Holiday surcharge (50%) takes precedence over weekend (25%)"""
        # 2025-12-25 is Thursday, but it's a holiday
        assert custom_engine.get_weekend_holiday_surcharge(date(2025, 12, 25)) == Decimal("0.50")

    def test_no_surcharge_weekday(self, custom_engine):
        assert custom_engine.get_weekend_holiday_surcharge(date(2025, 1, 6)) == Decimal("0")

    def test_no_surcharge_no_date(self, custom_engine):
        assert custom_engine.get_weekend_holiday_surcharge(None) == Decimal("0")


# ── Full quote generation ────────────────────────────────────────

class TestGenerateQuote:
    def test_basic_quote_structure(self, custom_engine):
        """All required fields present in quote output"""
        quote = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
        )
        assert "min_price" in quote
        assert "max_price" in quote
        assert "min_price_netto" in quote
        assert "max_price_netto" in quote
        assert "vat_amount" in quote
        assert "vat_rate" in quote
        assert "estimated_hours" in quote
        assert "volume_m3" in quote
        assert "distance_km" in quote
        assert "breakdown" in quote
        assert "multipliers" in quote
        assert "suggestions" in quote

    def test_min_less_than_max(self, custom_engine):
        quote = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
        )
        assert quote["min_price"] < quote["max_price"]
        assert quote["min_price_netto"] < quote["max_price_netto"]

    def test_vat_is_19_percent(self, custom_engine):
        quote = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
        )
        assert quote["vat_rate"] == 0.19
        netto_min = quote["min_price_netto"]
        vat_min = quote["vat_amount"]["min"]
        assert vat_min == round(netto_min * Decimal("0.19"), 2)

    def test_brutto_equals_netto_plus_vat(self, custom_engine):
        quote = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
        )
        assert quote["min_price"] == quote["min_price_netto"] + quote["vat_amount"]["min"]
        assert quote["max_price"] == quote["max_price_netto"] + quote["vat_amount"]["max"]

    def test_breakdown_volume_cost(self, custom_engine):
        """40m³ × €25 = €1000 min, 40m³ × €35 = €1400 max"""
        quote = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
        )
        assert quote["breakdown"]["volume_cost"]["min"] == Decimal("1000")
        assert quote["breakdown"]["volume_cost"]["max"] == Decimal("1400")

    def test_breakdown_distance_cost(self, custom_engine):
        """50km at €2/km = €100 base → min €90, max €110 (±10%)"""
        quote = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
        )
        assert quote["breakdown"]["distance_cost"]["min"] == Decimal("90")
        assert quote["breakdown"]["distance_cost"]["max"] == Decimal("110")

    def test_breakdown_labor_cost(self, custom_engine):
        """40m³ → 4.8 man-hours → min 4.8×€60=€288, max 4.8×€80=€384"""
        quote = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
        )
        assert quote["breakdown"]["labor_cost"]["min"] == Decimal("288")
        assert quote["breakdown"]["labor_cost"]["max"] == Decimal("384")

    def test_floor_surcharge_in_quote(self, custom_engine):
        """5th floor origin, no elevator → 3 floors × 15% of (volume+labor)
        Note: man-hours include stairs penalty, so labor is higher than base."""
        quote = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
            origin_floor=5, origin_has_elevator=False,
        )
        # man_hours: 40*0.12 + 5*40*0.02 = 4.8 + 4.0 = 8.8
        # labor_min: 8.8 * 60 = 528, labor_max: 8.8 * 80 = 704
        # surcharge base min: 1000 + 528 = 1528, max: 1400 + 704 = 2104
        # 3 floors × 15%: min = 1528 * 0.45 = 687.60, max = 2104 * 0.45 = 946.80
        assert quote["breakdown"]["floor_surcharge"]["min"] == Decimal("687.60")
        assert quote["breakdown"]["floor_surcharge"]["max"] == Decimal("946.80")

    def test_no_floor_surcharge_with_elevator(self, custom_engine):
        quote = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
            origin_floor=5, origin_has_elevator=True,
        )
        assert quote["breakdown"]["floor_surcharge"]["min"] == Decimal("0")
        assert quote["breakdown"]["floor_surcharge"]["max"] == Decimal("0")

    def test_services_in_quote(self, custom_engine):
        services = [make_service("hvz_permit"), make_service("insurance_basic")]
        quote = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
            services=services,
        )
        # HVZ €120 + insurance €49 = €169
        assert quote["breakdown"]["services_cost"]["min"] == Decimal("169")

    def test_heavy_items_in_quote(self, custom_engine):
        items = [
            make_item(name="piano", volume=1.5),
            make_item(name="safe", volume=0.3),
        ]
        quote = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
            inventory=items,
        )
        assert quote["breakdown"]["heavy_item_surcharge"] == Decimal("270")

    def test_weekend_increases_price(self, custom_engine):
        weekday = date(2025, 1, 6)  # Monday
        saturday = date(2025, 1, 4)

        quote_weekday = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
            moving_date=weekday,
        )
        quote_weekend = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
            moving_date=saturday,
        )

        assert quote_weekend["min_price"] > quote_weekday["min_price"]
        assert quote_weekend["multipliers"]["weekend_holiday"] == 0.25
        assert quote_weekday["multipliers"]["weekend_holiday"] == 0.0

    def test_holiday_increases_price_more_than_weekend(self, custom_engine):
        saturday = date(2025, 1, 4)   # Weekend
        holiday = date(2025, 1, 1)    # Neujahr (also a Wednesday)

        quote_weekend = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
            moving_date=saturday,
        )
        quote_holiday = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
            moving_date=holiday,
        )

        assert quote_holiday["min_price"] > quote_weekend["min_price"]

    def test_crew_size_in_breakdown(self, custom_engine):
        quote_small = custom_engine.generate_quote(
            volume=Decimal("15"), distance_km=Decimal("20"),
        )
        quote_large = custom_engine.generate_quote(
            volume=Decimal("50"), distance_km=Decimal("20"),
        )
        assert quote_small["breakdown"]["crew_size"] == 2
        assert quote_large["breakdown"]["crew_size"] == 4

    def test_external_lift_suggestions(self, custom_engine):
        quote = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
            origin_floor=6, origin_has_elevator=False,
            destination_floor=1, destination_has_elevator=True,
        )
        assert quote["suggestions"]["external_lift_origin"] is True
        assert quote["suggestions"]["external_lift_destination"] is False

    def test_truck_travel_time_factor(self, custom_engine):
        """Truck is 1.15× slower than car"""
        quote = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
            travel_time_hours=Decimal("2"),
        )
        # Truck time: 2 × 1.15 = 2.3h
        assert quote["breakdown"]["travel_time"] == Decimal("2.3")

    def test_long_travel_mandatory_break(self, custom_engine):
        """Travel >4.5h gets +0.75h mandatory break"""
        quote = custom_engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("300"),
            travel_time_hours=Decimal("5"),
        )
        # 5 × 1.15 = 5.75 > 4.5 → +0.75 = 6.5
        assert quote["breakdown"]["travel_time"] == Decimal("6.5")


# ── Full scenario: realistic quote ───────────────────────────────

class TestRealisticScenarios:
    def test_2br_apartment_local_move(self, custom_engine):
        """2-bedroom, 40m³, 30km, 2nd floor no elevator → realistic price range"""
        services = [
            make_service("hvz_permit"),
            make_service("packing"),
        ]
        quote = custom_engine.generate_quote(
            volume=Decimal("40"),
            distance_km=Decimal("30"),
            travel_time_hours=Decimal("0.5"),
            origin_floor=2,
            destination_floor=1,
            origin_has_elevator=False,
            destination_has_elevator=True,
            services=services,
        )

        # Verify price is in a reasonable range for German market
        assert quote["min_price"] > Decimal("1000")
        assert quote["max_price"] < Decimal("5000")
        assert quote["breakdown"]["crew_size"] == 3  # 40m³ → 3 crew

    def test_studio_short_move(self, custom_engine):
        """Studio, 15m³, 5km → budget-friendly"""
        quote = custom_engine.generate_quote(
            volume=Decimal("15"),
            distance_km=Decimal("5"),
            travel_time_hours=Decimal("0.2"),
        )

        assert quote["min_price"] > Decimal("500")
        assert quote["max_price"] < Decimal("2000")
        assert quote["breakdown"]["crew_size"] == 2

    def test_large_apartment_long_distance(self, custom_engine):
        """4-bedroom, 80m³, 400km → expensive"""
        services = [
            make_service("hvz_permit"),
            make_service("packing"),
            make_service("insurance_premium", metadata={"declared_value": 30000}),
        ]
        inventory = [make_item(name="piano", volume=2.0)]

        quote = custom_engine.generate_quote(
            volume=Decimal("80"),
            distance_km=Decimal("400"),
            travel_time_hours=Decimal("4.5"),
            origin_floor=3,
            destination_floor=4,
            origin_has_elevator=True,
            destination_has_elevator=False,
            services=services,
            inventory=inventory,
        )

        assert quote["min_price"] > Decimal("3000")
        assert quote["breakdown"]["crew_size"] == 4
        assert quote["breakdown"]["heavy_item_surcharge"] == Decimal("150")
        # Insurance: 30000 × 1% = 300 > min 89
        assert quote["breakdown"]["services_cost"]["min"] >= Decimal("300")

    def test_full_multiplier_stacking(self):
        """Regional + Seasonal + Weekend all stack correctly"""
        engine = PricingEngine(company_config={
            "enable_regional_pricing": True,
            "enable_seasonal_pricing": True,
            "regional_multipliers": {"munich": 1.15, "default": 1.0},
            "seasonal_peak_months": [5, 6, 7, 8, 9],
            "seasonal_peak_multiplier": 1.15,
            "weekend_surcharge_percent": 0.25,
        })

        # Saturday in July, Munich postal code
        quote = engine.generate_quote(
            volume=Decimal("40"),
            distance_km=Decimal("50"),
            origin_postal_code="80331",
            moving_date=date(2025, 7, 5),  # Saturday in July
        )

        # Combined: regional 1.15 × seasonal 1.15 = 1.3225, then × (1+0.25) weekend
        assert quote["multipliers"]["regional"] == 1.15
        assert quote["multipliers"]["seasonal"] == 1.15
        assert quote["multipliers"]["weekend_holiday"] == 0.25

        # Price should be significantly higher than base
        base_quote = engine.generate_quote(
            volume=Decimal("40"), distance_km=Decimal("50"),
        )
        assert quote["min_price"] > base_quote["min_price"] * Decimal("1.5")


# ── Company config overrides ─────────────────────────────────────

class TestCompanyConfigOverrides:
    def test_custom_rates_affect_price(self):
        """Higher per-m³ rate → higher volume cost"""
        cheap = PricingEngine(company_config={"base_rate_m3_min": 20, "base_rate_m3_max": 30})
        expensive = PricingEngine(company_config={"base_rate_m3_min": 40, "base_rate_m3_max": 50})

        q_cheap = cheap.generate_quote(volume=Decimal("40"), distance_km=Decimal("50"))
        q_expensive = expensive.generate_quote(volume=Decimal("40"), distance_km=Decimal("50"))

        assert q_expensive["min_price"] > q_cheap["min_price"]
        assert q_expensive["breakdown"]["volume_cost"]["min"] == Decimal("1600")  # 40×40
        assert q_cheap["breakdown"]["volume_cost"]["min"] == Decimal("800")       # 40×20

    def test_custom_min_movers(self):
        engine = PricingEngine(company_config={"min_movers": 4})
        assert engine.determine_crew_size(Decimal("10")) == 4

    def test_custom_hvz_cost(self):
        engine = PricingEngine(company_config={"hvz_permit_cost": 200})
        services = [make_service("hvz_permit")]
        min_c, _ = engine.calculate_services_cost(services)
        assert min_c == Decimal("200")


# ── Edge cases ───────────────────────────────────────────────────

class TestEdgeCases:
    def test_zero_volume(self, custom_engine):
        """Zero volume should still produce a valid quote with minimum hours"""
        quote = custom_engine.generate_quote(
            volume=Decimal("0"), distance_km=Decimal("10"),
        )
        assert quote["breakdown"]["man_hours"] == Decimal("4")  # minimum
        assert quote["min_price"] > Decimal("0")

    def test_zero_distance(self, custom_engine):
        """Same-building move with 0km distance"""
        quote = custom_engine.generate_quote(
            volume=Decimal("20"), distance_km=Decimal("0"),
        )
        assert quote["breakdown"]["distance_cost"]["min"] == Decimal("0")
        assert quote["breakdown"]["distance_cost"]["max"] == Decimal("0")
        assert quote["min_price"] > Decimal("0")  # Still has volume + labor

    def test_very_large_volume(self, custom_engine):
        """200m³ commercial move"""
        quote = custom_engine.generate_quote(
            volume=Decimal("200"), distance_km=Decimal("100"),
        )
        assert quote["breakdown"]["crew_size"] == 4
        assert quote["min_price"] > Decimal("5000")

    def test_empty_services_list(self, custom_engine):
        min_c, max_c = custom_engine.calculate_services_cost([])
        assert min_c == Decimal("0")
        assert max_c == Decimal("0")

    def test_empty_inventory_no_heavy_surcharge(self, custom_engine):
        assert custom_engine.calculate_heavy_item_surcharges([]) == Decimal("0")
