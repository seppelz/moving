/**
 * Pricing Configuration Page - Visual editor for all pricing parameters
 * Allows admin to adjust rates without editing config files
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, Save, RotateCcw, TrendingUp,
  Settings, AlertCircle, CheckCircle, Package, Truck,
  Clock, Layers, Wrench, Info, Calendar,
  Shield, Trash2, Weight
} from 'lucide-react'
import { adminAPI } from '@/services/api'
import clsx from 'clsx'

interface PricingConfig {
  // Volume-based pricing
  base_rate_m3_min: number
  base_rate_m3_max: number

  // Distance rates
  rate_km_near: number
  rate_km_far: number
  km_threshold: number

  // Labor costs
  hourly_labor_min: number
  hourly_labor_max: number
  min_movers: number

  // Surcharges
  floor_surcharge_percent: number

  // Services
  hvz_permit_cost: number
  kitchen_assembly_per_meter: number
  external_lift_cost_min: number
  external_lift_cost_max: number

  // Weekend/Holiday
  weekend_surcharge_percent: number
  holiday_surcharge_percent: number

  // Packing materials
  packing_materials_per_m3: number

  // Heavy items
  heavy_item_surcharges: Record<string, number>

  // Long carry
  long_carry_per_10m: number

  // Disposal
  disposal_base_cost: number
  disposal_per_m3: number

  // Insurance
  insurance_basic_flat: number
  insurance_premium_percent: number
  insurance_premium_min: number

  // Optional: Regional & Seasonal
  enable_regional_pricing: boolean
  enable_seasonal_pricing: boolean
  seasonal_peak_multiplier: number
  seasonal_offpeak_multiplier: number
}

const HEAVY_ITEM_LABELS: Record<string, string> = {
  piano: 'Klavier/Flügel',
  safe: 'Tresor',
  aquarium: 'Aquarium',
  gym_equipment: 'Fitnessgeräte',
  marble_table: 'Marmortisch',
  antique: 'Antiquitäten',
}

export default function PricingConfig() {
  const [config, setConfig] = useState<PricingConfig | null>(null)
  const [originalConfig, setOriginalConfig] = useState<PricingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const data = await adminAPI.getPricingConfig('default')
      const cfg = { ...getDefaultConfig(), ...(data.pricing_config || {}) }
      setConfig(cfg)
      setOriginalConfig(cfg)
    } catch (error) {
      console.error('Failed to load pricing config:', error)
      const defaults = getDefaultConfig()
      setConfig(defaults)
      setOriginalConfig(defaults)
    } finally {
      setLoading(false)
    }
  }

  const getDefaultConfig = (): PricingConfig => ({
    base_rate_m3_min: 25.0,
    base_rate_m3_max: 35.0,
    rate_km_near: 2.0,
    rate_km_far: 1.0,
    km_threshold: 50.0,
    hourly_labor_min: 60.0,
    hourly_labor_max: 80.0,
    min_movers: 2,
    floor_surcharge_percent: 0.15,
    hvz_permit_cost: 120.0,
    kitchen_assembly_per_meter: 45.0,
    external_lift_cost_min: 350.0,
    external_lift_cost_max: 500.0,
    weekend_surcharge_percent: 0.25,
    holiday_surcharge_percent: 0.50,
    packing_materials_per_m3: 8.0,
    heavy_item_surcharges: {
      piano: 150.0,
      safe: 120.0,
      aquarium: 80.0,
      gym_equipment: 60.0,
      marble_table: 80.0,
      antique: 100.0,
    },
    long_carry_per_10m: 35.0,
    disposal_base_cost: 80.0,
    disposal_per_m3: 45.0,
    insurance_basic_flat: 49.0,
    insurance_premium_percent: 0.01,
    insurance_premium_min: 89.0,
    enable_regional_pricing: false,
    enable_seasonal_pricing: false,
    seasonal_peak_multiplier: 1.15,
    seasonal_offpeak_multiplier: 1.0,
  })

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    setSaveStatus('idle')
    try {
      await adminAPI.updatePricingConfig('default', config)
      setOriginalConfig(config)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to save config:', error)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (originalConfig) {
      setConfig({ ...originalConfig })
      setSaveStatus('idle')
    }
  }

  const updateConfig = (key: keyof PricingConfig, value: number | boolean | Record<string, number>) => {
    if (!config) return
    setConfig({ ...config, [key]: value })
  }

  const updateHeavyItem = (itemKey: string, value: number) => {
    if (!config) return
    setConfig({
      ...config,
      heavy_item_surcharges: { ...config.heavy_item_surcharges, [itemKey]: value }
    })
  }

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Konfiguration...</p>
        </div>
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                to="/admin"
                className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2 mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Preiskonfiguration</h1>
              <p className="text-gray-600 mt-1">Passen Sie alle Preisparameter an</p>
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <button
                  onClick={handleReset}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Zurücksetzen
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={clsx(
                  'btn-primary inline-flex items-center gap-2',
                  { 'opacity-50 cursor-not-allowed': !hasChanges || saving }
                )}
              >
                <Save className="w-5 h-5" />
                {saving ? 'Speichern...' : 'Änderungen speichern'}
              </button>
            </div>
          </div>

          {saveStatus !== 'idle' && (
            <div className={clsx('mt-4 p-3 rounded-lg flex items-center gap-2', {
              'bg-green-50 text-green-800': saveStatus === 'success',
              'bg-red-50 text-red-800': saveStatus === 'error'
            })}>
              {saveStatus === 'success' ? (
                <><CheckCircle className="w-5 h-5" /><span>Konfiguration erfolgreich gespeichert!</span></>
              ) : (
                <><AlertCircle className="w-5 h-5" /><span>Fehler beim Speichern der Konfiguration</span></>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Pricing Parameters */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Volume-Based Pricing ────────────────── */}
            <Section icon={<Package className="w-5 h-5 text-primary-600" />} title="Volumenbasierte Preise (pro m³)">
              <NumberInput
                label="Mindestpreis pro m³"
                value={config.base_rate_m3_min}
                onChange={(val) => updateConfig('base_rate_m3_min', val)}
                min={15} max={50} step={0.5} unit="€"
                helpText="Basispreis für Budget/Standard-Service"
              />
              <NumberInput
                label="Höchstpreis pro m³"
                value={config.base_rate_m3_max}
                onChange={(val) => updateConfig('base_rate_m3_max', val)}
                min={20} max={60} step={0.5} unit="€"
                helpText="Basispreis für Premium-Service"
              />
              <InfoBox text="Marktvergleich (2026): Budget €20-28, Mittelklasse €25-40, Premium €35-50" />
            </Section>

            {/* ── Distance Rates ──────────────────────── */}
            <Section icon={<Truck className="w-5 h-5 text-primary-600" />} title="Kilometerpreise">
              <NumberInput
                label="Nahbereich (0-50km)"
                value={config.rate_km_near}
                onChange={(val) => updateConfig('rate_km_near', val)}
                min={1.0} max={4.0} step={0.1} unit="€/km"
                helpText="Preis pro Kilometer für lokale Umzüge. Es wird automatisch eine ±10% Spanne berechnet."
              />
              <NumberInput
                label="Fernbereich (>50km)"
                value={config.rate_km_far}
                onChange={(val) => updateConfig('rate_km_far', val)}
                min={0.5} max={2.0} step={0.1} unit="€/km"
                helpText="Reduzierter Preis für Langstrecken"
              />
              <NumberInput
                label="Schwellenwert"
                value={config.km_threshold}
                onChange={(val) => updateConfig('km_threshold', val)}
                min={30} max={100} step={10} unit="km"
                helpText="Ab dieser Distanz gilt der Fernpreis"
              />
              <InfoBox text="Marktvergleich: Nahbereich €1.50-2.50, Fernbereich €0.80-1.20" />
            </Section>

            {/* ── Labor Costs ─────────────────────────── */}
            <Section icon={<Clock className="w-5 h-5 text-primary-600" />} title="Arbeitskosten">
              <NumberInput
                label="Min. Stundenlohn pro Helfer"
                value={config.hourly_labor_min}
                onChange={(val) => updateConfig('hourly_labor_min', val)}
                min={40} max={80} step={5} unit="€/Std"
                helpText="Mindestkosten für Arbeitsstunde"
              />
              <NumberInput
                label="Max. Stundenlohn pro Helfer"
                value={config.hourly_labor_max}
                onChange={(val) => updateConfig('hourly_labor_max', val)}
                min={50} max={100} step={5} unit="€/Std"
                helpText="Höchstkosten für Arbeitsstunde"
              />
              <NumberInput
                label="Mindestanzahl Helfer"
                value={config.min_movers}
                onChange={(val) => updateConfig('min_movers', val)}
                min={2} max={4} step={1} unit="Pers."
                helpText="Minimum Crew-Größe. Wird bei großen Volumen automatisch auf 3-4 erhöht."
              />
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                  <div className="text-xs text-orange-800">
                    <strong>Hinweis:</strong> Aktuelle Werte (€{config.hourly_labor_min}-{config.hourly_labor_max}) sind im oberen Quartil.
                    Marktdurchschnitt: €45-65. Erwägen Sie eine Anpassung für bessere Wettbewerbsfähigkeit.
                  </div>
                </div>
              </div>
            </Section>

            {/* ── Floor Surcharge ─────────────────────── */}
            <Section icon={<Layers className="w-5 h-5 text-primary-600" />} title="Etagenzuschlag">
              <NumberInput
                label="Zuschlag pro Etage (ohne Aufzug)"
                value={config.floor_surcharge_percent * 100}
                onChange={(val) => updateConfig('floor_surcharge_percent', val / 100)}
                min={5} max={25} step={1} unit="%"
                helpText="Zuschlag ab 3. Etage ohne Aufzug, berechnet auf Volumen- + Arbeitskosten. Wird separat für Min/Max berechnet."
              />
            </Section>

            {/* ── Service Pricing ─────────────────────── */}
            <Section icon={<Wrench className="w-5 h-5 text-primary-600" />} title="Zusatzleistungen">
              <NumberInput
                label="HVZ Genehmigung (Halteverbotszone)"
                value={config.hvz_permit_cost}
                onChange={(val) => updateConfig('hvz_permit_cost', val)}
                min={50} max={200} step={10} unit="€"
                helpText="Pauschalpreis inkl. Beantragung und Aufstellung der Schilder"
              />
              <NumberInput
                label="Küchenmontage (pro Laufmeter)"
                value={config.kitchen_assembly_per_meter}
                onChange={(val) => updateConfig('kitchen_assembly_per_meter', val)}
                min={25} max={80} step={5} unit="€/m"
                helpText="Preis pro Meter Küche (Abbau + Transport + Montage)"
              />
              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  label="Außenaufzug Min."
                  value={config.external_lift_cost_min}
                  onChange={(val) => updateConfig('external_lift_cost_min', val)}
                  min={200} max={500} step={50} unit="€"
                  helpText="Mindestpreis"
                />
                <NumberInput
                  label="Außenaufzug Max."
                  value={config.external_lift_cost_max}
                  onChange={(val) => updateConfig('external_lift_cost_max', val)}
                  min={300} max={800} step={50} unit="€"
                  helpText="Höchstpreis"
                />
              </div>
              <NumberInput
                label="Verpackungsmaterial pro m³"
                value={config.packing_materials_per_m3}
                onChange={(val) => updateConfig('packing_materials_per_m3', val)}
                min={4} max={15} step={1} unit="€/m³"
                helpText="Kartons, Klebeband, Luftpolsterfolie etc. Wird nur berechnet wenn Packservice aktiviert."
              />
              <InfoBox text="Marktvergleich: HVZ €80-150, Küche €35-60/m, Außenaufzug €250-600, Verpackung €6-12/m³" />
            </Section>

            {/* ── Disposal / Long Carry ───────────────── */}
            <Section icon={<Trash2 className="w-5 h-5 text-primary-600" />} title="Entrümpelung & Trageweg">
              <NumberInput
                label="Entrümpelung Grundgebühr"
                value={config.disposal_base_cost}
                onChange={(val) => updateConfig('disposal_base_cost', val)}
                min={40} max={150} step={10} unit="€"
                helpText="Einmalige Grundgebühr für Entsorgungsfahrt + Anmeldung"
              />
              <NumberInput
                label="Entrümpelung pro m³"
                value={config.disposal_per_m3}
                onChange={(val) => updateConfig('disposal_per_m3', val)}
                min={25} max={80} step={5} unit="€/m³"
                helpText="Volumenbasierter Preis für zu entsorgende Gegenstände"
              />
              <NumberInput
                label="Langer Trageweg (pro 10m)"
                value={config.long_carry_per_10m}
                onChange={(val) => updateConfig('long_carry_per_10m', val)}
                min={15} max={60} step={5} unit="€"
                helpText="Zuschlag wenn LKW nicht direkt am Eingang parken kann. Erste 10m sind kostenfrei, danach pro angefangene 10m."
              />
            </Section>

            {/* ── Insurance ───────────────────────────── */}
            <Section icon={<Shield className="w-5 h-5 text-primary-600" />} title="Transportversicherung">
              <NumberInput
                label="Basis-Schutz (Pauschale)"
                value={config.insurance_basic_flat}
                onChange={(val) => updateConfig('insurance_basic_flat', val)}
                min={29} max={99} step={5} unit="€"
                helpText="Pauschalpreis für Basis-Transportversicherung (bis €50.000 Deckungssumme)"
              />
              <NumberInput
                label="Premium-Schutz (% vom Wert)"
                value={config.insurance_premium_percent * 100}
                onChange={(val) => updateConfig('insurance_premium_percent', val / 100)}
                min={0.5} max={3} step={0.1} unit="%"
                helpText="Prozentsatz der vom Kunden deklarierten Werthöhe für volle Neuwert-Absicherung"
              />
              <NumberInput
                label="Premium Mindestpreis"
                value={config.insurance_premium_min}
                onChange={(val) => updateConfig('insurance_premium_min', val)}
                min={49} max={199} step={10} unit="€"
                helpText="Mindestbetrag für Premium-Versicherung, auch bei niedrigem Deklarationswert"
              />
            </Section>

            {/* ── Heavy Item Surcharges ────────────────── */}
            <Section icon={<Weight className="w-5 h-5 text-primary-600" />} title="Schwerlast-Zuschläge">
              <p className="text-xs text-gray-600 mb-3">
                Automatische Zuschläge für Spezialgegenstände die besonderes Equipment oder Fachpersonal erfordern.
                Werden anhand des Artikelnamens im Inventar erkannt.
              </p>
              {Object.entries(config.heavy_item_surcharges).map(([key, value]) => (
                <NumberInput
                  key={key}
                  label={HEAVY_ITEM_LABELS[key] || key}
                  value={value}
                  onChange={(val) => updateHeavyItem(key, val)}
                  min={20} max={300} step={10} unit="€"
                  helpText={`Zuschlag pro Stück`}
                />
              ))}
            </Section>

            {/* ── Weekend/Holiday Surcharges ───────────── */}
            <Section icon={<Calendar className="w-5 h-5 text-primary-600" />} title="Wochenend- & Feiertagszuschläge">
              <p className="text-xs text-gray-600 mb-3">
                Automatische Zuschläge basierend auf dem Umzugsdatum. Werden auf den Gesamtpreis (netto) aufgeschlagen.
              </p>
              <NumberInput
                label="Wochenendzuschlag (Sa/So)"
                value={config.weekend_surcharge_percent * 100}
                onChange={(val) => updateConfig('weekend_surcharge_percent', val / 100)}
                min={0} max={50} step={5} unit="%"
                helpText="Aufschlag für Umzüge am Samstag oder Sonntag"
              />
              <NumberInput
                label="Feiertagszuschlag"
                value={config.holiday_surcharge_percent * 100}
                onChange={(val) => updateConfig('holiday_surcharge_percent', val / 100)}
                min={0} max={100} step={5} unit="%"
                helpText="Aufschlag für gesetzliche Feiertage (Neujahr, 1. Mai, Tag der Dt. Einheit, Weihnachten)"
              />
            </Section>

            {/* ── Regional & Seasonal ─────────────────── */}
            <Section icon={<Settings className="w-5 h-5 text-primary-600" />} title="Regionale & Saisonale Anpassung">
              <ToggleSwitch
                label="Regionale Preisanpassung"
                description="Automatischer Aufschlag basierend auf PLZ: München +15%, Frankfurt +12%, Stuttgart/Hamburg +10%, Berlin +8%, Köln +5%"
                enabled={config.enable_regional_pricing}
                onChange={(val) => updateConfig('enable_regional_pricing', val)}
              />
              <ToggleSwitch
                label="Saisonale Preisanpassung"
                description="Automatischer Aufschlag in der Hochsaison (Mai-September). Nebensaison (Dez-Feb) kann reduziert werden."
                enabled={config.enable_seasonal_pricing}
                onChange={(val) => updateConfig('enable_seasonal_pricing', val)}
              />
              {config.enable_seasonal_pricing && (
                <div className="ml-4 pl-4 border-l-2 border-primary-200 space-y-4">
                  <NumberInput
                    label="Hochsaison-Multiplikator (Mai-Sep)"
                    value={config.seasonal_peak_multiplier}
                    onChange={(val) => updateConfig('seasonal_peak_multiplier', val)}
                    min={1.0} max={1.4} step={0.05} unit="x"
                    helpText="1.15 = +15% Aufschlag"
                  />
                  <NumberInput
                    label="Nebensaison-Multiplikator (Dez-Feb)"
                    value={config.seasonal_offpeak_multiplier}
                    onChange={(val) => updateConfig('seasonal_offpeak_multiplier', val)}
                    min={0.8} max={1.0} step={0.05} unit="x"
                    helpText="1.0 = kein Rabatt, 0.9 = 10% Rabatt"
                  />
                </div>
              )}
            </Section>
          </div>

          {/* Right Column - Preview & Info */}
          <div className="space-y-6">
            {/* Calculation Logic Overview */}
            <div className="card border-primary-100 bg-primary-50/30">
              <h3 className="text-sm font-semibold text-primary-900 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary-600" />
                Berechnungslogik
              </h3>

              <div className="space-y-4 text-xs text-gray-700">
                <div>
                  <p className="font-bold text-gray-900 mb-1">1. Basiskosten</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>Volumen x €/m³ (Min/Max)</li>
                    <li>Distanz x €/km (±10% Spanne)</li>
                    <li>Mannstunden x €/Std (Min/Max)</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-gray-900 mb-1">2. Zuschläge</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>Etagenzuschlag (Min/Max)</li>
                    <li>Services (HVZ, Küche, Lift...)</li>
                    <li>Schwerlast-Gegenstände</li>
                    <li>Verpackungsmaterial</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-gray-900 mb-1">3. Multiplikatoren</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>Regional (PLZ-basiert)</li>
                    <li>Saisonal (Monat)</li>
                    <li>Wochenende/Feiertag</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-gray-900 mb-1">4. MwSt</p>
                  <p className="ml-1">+ 19% auf Netto-Gesamtpreis</p>
                </div>

                <div className="pt-2 border-t border-primary-100 text-[10px] italic">
                  Brutto = Netto x Multiplikatoren x 1,19
                </div>
              </div>
            </div>

            {/* Example Quote Preview */}
            <div className="card bg-gradient-to-br from-gray-50 to-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Beispielrechnung
              </h3>

              <div className="text-xs text-gray-600 mb-3">
                2-Zimmer, 40 m³, 50 km, 2. OG, Werktag
              </div>

              <div className="space-y-2 text-xs">
                <PreviewRow label="Volumenkosten" value={`€${(40 * config.base_rate_m3_min).toFixed(0)} - €${(40 * config.base_rate_m3_max).toFixed(0)}`} />
                <PreviewRow label="Kilometerkosten" value={`€${(50 * config.rate_km_near * 0.9).toFixed(0)} - €${(50 * config.rate_km_near * 1.1).toFixed(0)}`} />
                <PreviewRow label="Arbeitskosten (4h)" value={`€${(4 * config.hourly_labor_min).toFixed(0)} - €${(4 * config.hourly_labor_max).toFixed(0)}`} />
              </div>

              <div className="mt-3 pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Gesamt (ca.)</span>
                  <span className="text-lg font-bold text-primary-600">
                    €{calculateExampleTotal(config, 'min')} - €{calculateExampleTotal(config, 'max')}
                  </span>
                </div>
                <div className="text-xs text-gray-500 text-right mt-1">inkl. 19% MwSt.</div>
              </div>

              {/* Weekend preview */}
              {config.weekend_surcharge_percent > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Am Samstag (+{(config.weekend_surcharge_percent * 100).toFixed(0)}%):</span>
                    <span className="font-semibold">
                      €{(parseFloat(calculateExampleTotal(config, 'min')) * (1 + config.weekend_surcharge_percent)).toFixed(0)} - €{(parseFloat(calculateExampleTotal(config, 'max')) * (1 + config.weekend_surcharge_percent)).toFixed(0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Reference */}
            <div className="card bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Schnellreferenz: Nur Volumen</h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Studio (15 m³)', vol: 15 },
                  { label: '2-Zimmer (40 m³)', vol: 40 },
                  { label: '4-Zimmer (80 m³)', vol: 80 },
                ].map(({ label, vol }) => (
                  <div key={vol} className="flex justify-between">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold">€{(vol * config.base_rate_m3_min).toFixed(0)} - €{(vol * config.base_rate_m3_max).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-300 text-xs text-gray-500">
                Nur Volumenkosten (netto), ohne Distanz, Arbeit & Services
              </div>
            </div>

            {/* Active Features Summary */}
            <div className="card bg-green-50 border-green-200">
              <h3 className="text-sm font-semibold text-green-900 mb-3">Aktive Preisfaktoren</h3>
              <div className="space-y-1 text-xs">
                <FeatureStatus label="Regionale Preise" active={config.enable_regional_pricing} />
                <FeatureStatus label="Saisonale Preise" active={config.enable_seasonal_pricing} />
                <FeatureStatus label={`Wochenendzuschlag (${(config.weekend_surcharge_percent * 100).toFixed(0)}%)`} active={config.weekend_surcharge_percent > 0} />
                <FeatureStatus label={`Feiertagszuschlag (${(config.holiday_surcharge_percent * 100).toFixed(0)}%)`} active={config.holiday_surcharge_percent > 0} />
                <FeatureStatus label="Schwerlast-Zuschläge" active={Object.values(config.heavy_item_surcharges).some(v => v > 0)} />
                <FeatureStatus label="Transportversicherung" active={config.insurance_basic_flat > 0} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Helper Components ────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {icon} {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function NumberInput({
  label, value, onChange, min, max, step, unit, helpText
}: {
  label: string; value: number; onChange: (value: number) => void
  min: number; max: number; step: number; unit: string; helpText?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="relative w-28">
          <input
            type="number" min={min} max={max} step={step} value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-right pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">{unit}</span>
        </div>
      </div>
      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
  )
}

function ToggleSwitch({
  label, description, enabled, onChange
}: {
  label: string; description: string; enabled: boolean; onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={clsx(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
          { 'bg-primary-600': enabled, 'bg-gray-200': !enabled }
        )}
      >
        <span className={clsx(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          { 'translate-x-6': enabled, 'translate-x-1': !enabled }
        )} />
      </button>
    </div>
  )
}

function InfoBox({ text }: { text: string }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-800"><strong>Marktvergleich:</strong> {text.replace('Marktvergleich (2026): ', '').replace('Marktvergleich: ', '')}</div>
      </div>
    </div>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  )
}

function FeatureStatus({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={clsx('w-2 h-2 rounded-full', { 'bg-green-500': active, 'bg-gray-300': !active })} />
      <span className={active ? 'text-green-800' : 'text-gray-500'}>{label}</span>
    </div>
  )
}

function calculateExampleTotal(config: PricingConfig, type: 'min' | 'max'): string {
  const volumeCost = 40 * (type === 'min' ? config.base_rate_m3_min : config.base_rate_m3_max)
  const distanceCost = 50 * config.rate_km_near * (type === 'min' ? 0.9 : 1.1)
  const laborCost = 4 * (type === 'min' ? config.hourly_labor_min : config.hourly_labor_max)
  const netto = volumeCost + distanceCost + laborCost
  const brutto = netto * 1.19
  return brutto.toFixed(0)
}
