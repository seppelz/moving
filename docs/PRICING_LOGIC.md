# MoveMaster: Pricing & Duration Calculation Guide

This document explains the internal logic used to calculate moving durations and costs. This ensures transparency for administrators and consistency for customers.

## 1. Duration Calculation (Clock Time)

MoveMaster distinguishes between **Man-Hours** (total effort) and **Clock Time** (actual duration of the move).

### Total Man-Hours
This represents the combined effort required by the entire crew.
- **Base Effort**: `0.12 hours per m³` (loading/unloading).
- **Stairs Penalty**: `+0.02 hours per m³ per floor` (only if no elevator).
- **Service Add-ons**:
  - Disassembly: `+0.15 hours per m³`.
  - Professional Packing: `+0.25 hours per m³`.
- **Minimum**: 4 man-hours.

### Crew Sizing
The system automatically suggests an optimal crew size:
- **< 20 m³**: 2 Movers
- **20 - 45 m³**: 3 Movers
- **> 45 m³**: 4 Movers

### Travel Time & Breaks
- **Truck Factor**: Travel duration from Google Maps is multiplied by `1.15` (trucks move slower than cars).
- **Mandatory Breaks**: If travel time exceeds **4.5 hours**, the system automatically adds a **45-minute** mandatory break for the driver.

### Final Clock Duration
`Clock Time = (Total Man-Hours / Crew Size) + (Truck Travel Time + Breaks)`

---

## 2. Cost Calculation

### Volume Costs
Covers vehicle wear, material overhead, and administration.
- Range: `€[MIN_RATE] - €[MAX_RATE]` per m³.

### Labor Costs
Calculated based on total **Man-Hours**.
- `Labor Cost = Total Man-Hours × Hourly Rate`.

### Distance Costs
Tiered pricing based on distance:
- **Near (< 50km)**: `€[NEAR_RATE]` per km.
- **Far (> 50km)**: `Near Base Cost + €[FAR_RATE]` per km for the remainder.

### Surcharges & Services
- **Floor Surcharge**: Applied to moves above the 2nd floor without an elevator.
- **HVZ (Halteverbotszone)**: Flat fee for parking permits.
- **Kitchen Assembly**: Calculated per meter of kitchen.
- **External Lift**: Daily or hourly rental rate.

---

## Example Scenario
**466km / 15m³ (No elevator, 1st floor)**
1. **Man-Hours**: `(15 * 0.12) + (1 * 15 * 0.02) = 1.8 + 0.3 = 2.1`. Raised to **4.0** (minimum).
2. **Crew Size**: 2 Movers.
3. **Loading/Unloading Time**: `4.0 / 2 = 2.0 hours`.
4. **Travel Time**: `(5.5h * 1.15) + 0.75h (Break) = 7.1 hours`.
5. **Total Clock Duration**: `2.0 + 7.1 = 9.1 hours`.
