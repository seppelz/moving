# MoveMaster - Remaining Fixes

## Pricing Engine Fixes
- [x] Floor surcharge: uses MIN costs only, needs min/max spread like other components
- [x] Distance cost: has no min/max spread, needs a range
- [x] `MIN_MOVERS` config is saved in admin but crew size is hardcoded in engine
- [x] Regional pricing: config toggle exists but no engine implementation
- [x] Seasonal pricing: config toggle exists but no engine implementation

## Bug Fixes
- [x] `Dashboard.tsx`: potential null crash on `analytics?.average_volume_m3.toFixed(1)` (needs null check)

## Missing German Market Factors
- [x] Weekend/holiday surcharges
- [x] Packing materials cost
- [x] Heavy item surcharges (piano, safe, etc.)
- [x] Parking distance surcharge (long carry)
- [x] Disposal/Entrümpelung service
- [x] Insurance options (transport insurance)

## Accuracy & Quality
- [x] No feedback loop for accuracy validation (no mechanism to compare quoted vs actual costs)
