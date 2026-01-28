/**
 * Pricing Configuration Page - Visual editor for all pricing parameters
 * Allows admin to adjust rates without editing config files
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, Save, RotateCcw, TrendingUp,
  Settings, AlertCircle, CheckCircle, Package, Truck,
  Clock, Layers, Wrench, Info
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
  
  // Optional: Regional & Seasonal
  enable_regional_pricing?: boolean
  enable_seasonal_pricing?: boolean
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
      const cfg = data.pricing_config || getDefaultConfig()
      setConfig(cfg)
      setOriginalConfig(cfg)
    } catch (error) {
      console.error('Failed to load pricing config:', error)
      // Use defaults if loading fails
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
    enable_regional_pricing: false,
    enable_seasonal_pricing: false,
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
  
  const updateConfig = (key: keyof PricingConfig, value: number | boolean) => {
    if (!config) return
    setConfig({ ...config, [key]: value })
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
                  {
                    'opacity-50 cursor-not-allowed': !hasChanges || saving
                  }
                )}
              >
                <Save className="w-5 h-5" />
                {saving ? 'Speichern...' : 'Änderungen speichern'}
              </button>
            </div>
          </div>
          
          {/* Save Status */}
          {saveStatus !== 'idle' && (
            <div className={clsx('mt-4 p-3 rounded-lg flex items-center gap-2', {
              'bg-green-50 text-green-800': saveStatus === 'success',
              'bg-red-50 text-red-800': saveStatus === 'error'
            })}>
              {saveStatus === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Konfiguration erfolgreich gespeichert!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span>Fehler beim Speichern der Konfiguration</span>
                </>
              )}
            </div>
          )}
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Pricing Parameters */}
          <div className="lg:col-span-2 space-y-6">
            {/* Volume-Based Pricing */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-600" />
                Volumenbasierte Preise (pro m³)
              </h2>
              
              <div className="space-y-4">
                <NumberInput
                  label="Mindestpreis pro m³"
                  value={config.base_rate_m3_min}
                  onChange={(val) => updateConfig('base_rate_m3_min', val)}
                  min={15}
                  max={50}
                  step={0.5}
                  unit="€"
                  helpText="Basispreis für Budget/Standard-Service"
                />
                
                <NumberInput
                  label="Höchstpreis pro m³"
                  value={config.base_rate_m3_max}
                  onChange={(val) => updateConfig('base_rate_m3_max', val)}
                  min={20}
                  max={60}
                  step={0.5}
                  unit="€"
                  helpText="Basispreis für Premium-Service"
                />
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <strong>Marktvergleich (2026):</strong> Budget €20-28, Mittelklasse €25-40, Premium €35-50
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Distance Rates */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary-600" />
                Kilometerpreise
              </h2>
              
              <div className="space-y-4">
                <NumberInput
                  label="Nahbereich (0-50km)"
                  value={config.rate_km_near}
                  onChange={(val) => updateConfig('rate_km_near', val)}
                  min={1.0}
                  max={4.0}
                  step={0.1}
                  unit="€/km"
                  helpText="Preis pro Kilometer für lokale Umzüge"
                />
                
                <NumberInput
                  label="Fernbereich (>50km)"
                  value={config.rate_km_far}
                  onChange={(val) => updateConfig('rate_km_far', val)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  unit="€/km"
                  helpText="Reduzierter Preis für Langstrecken"
                />
                
                <NumberInput
                  label="Schwellenwert"
                  value={config.km_threshold}
                  onChange={(val) => updateConfig('km_threshold', val)}
                  min={30}
                  max={100}
                  step={10}
                  unit="km"
                  helpText="Ab dieser Distanz gilt der Fernpreis"
                />
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <strong>Marktvergleich:</strong> Nahbereich €1.50-2.50, Fernbereich €0.80-1.20
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Labor Costs */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                Arbeitskosten
              </h2>
              
              <div className="space-y-4">
                <NumberInput
                  label="Min. Stundenlohn pro Helfer"
                  value={config.hourly_labor_min}
                  onChange={(val) => updateConfig('hourly_labor_min', val)}
                  min={40}
                  max={80}
                  step={5}
                  unit="€/Std"
                  helpText="Mindestkosten für Arbeitsstunde"
                />
                
                <NumberInput
                  label="Max. Stundenlohn pro Helfer"
                  value={config.hourly_labor_max}
                  onChange={(val) => updateConfig('hourly_labor_max', val)}
                  min={50}
                  max={100}
                  step={5}
                  unit="€/Std"
                  helpText="Höchstkosten für Arbeitsstunde"
                />
                
                <NumberInput
                  label="Mindestanzahl Helfer"
                  value={config.min_movers}
                  onChange={(val) => updateConfig('min_movers', val)}
                  min={2}
                  max={4}
                  step={1}
                  unit="Personen"
                  helpText="Minimum Crew-Größe"
                />
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                    <div className="text-xs text-orange-800">
                      <strong>Hinweis:</strong> Aktuelle Werte (€60-80) sind im oberen Quartil. 
                      Marktdurchschnitt: €45-65. Erwägen Sie eine Anpassung für bessere Wettbewerbsfähigkeit.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floor Surcharge */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary-600" />
                Etagenzuschlag
              </h2>
              
              <NumberInput
                label="Zuschlag pro Etage (ohne Aufzug)"
                value={config.floor_surcharge_percent * 100}
                onChange={(val) => updateConfig('floor_surcharge_percent', val / 100)}
                min={5}
                max={25}
                step={1}
                unit="%"
                helpText="Zuschlag ab 3. Etage ohne Aufzug (Standard: 15%)"
              />
            </div>
            
            {/* Service Pricing */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary-600" />
                Zusatzleistungen
              </h2>
              
              <div className="space-y-4">
                <NumberInput
                  label="HVZ Genehmigung (Halteverbotszone)"
                  value={config.hvz_permit_cost}
                  onChange={(val) => updateConfig('hvz_permit_cost', val)}
                  min={50}
                  max={200}
                  step={10}
                  unit="€"
                  helpText="Pauschalpreis inkl. Beantragung und Aufstellung"
                />
                
                <NumberInput
                  label="Küchenmontage (pro Meter)"
                  value={config.kitchen_assembly_per_meter}
                  onChange={(val) => updateConfig('kitchen_assembly_per_meter', val)}
                  min={25}
                  max={80}
                  step={5}
                  unit="€/m"
                  helpText="Preis pro Meter Küche (Abbau, Transport, Montage)"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput
                    label="Außenaufzug Min."
                    value={config.external_lift_cost_min}
                    onChange={(val) => updateConfig('external_lift_cost_min', val)}
                    min={200}
                    max={500}
                    step={50}
                    unit="€"
                    helpText="Mindestpreis"
                  />
                  
                  <NumberInput
                    label="Außenaufzug Max."
                    value={config.external_lift_cost_max}
                    onChange={(val) => updateConfig('external_lift_cost_max', val)}
                    min={300}
                    max={800}
                    step={50}
                    unit="€"
                    helpText="Höchstpreis"
                  />
                </div>
              </div>
            </div>
            
            {/* Advanced Settings */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary-600" />
                Erweiterte Einstellungen
              </h2>
              
              <div className="space-y-4">
                <ToggleSwitch
                  label="Regionale Preisanpassung"
                  description="Automatische Anpassung basierend auf Postleitzahl (München +15%, Berlin +8%, etc.)"
                  enabled={config.enable_regional_pricing || false}
                  onChange={(val) => updateConfig('enable_regional_pricing', val)}
                  comingSoon
                />
                
                <ToggleSwitch
                  label="Saisonale Preisanpassung"
                  description="Automatische Preiserhöhung in Hochsaison (Mai-September +15%)"
                  enabled={config.enable_seasonal_pricing || false}
                  onChange={(val) => updateConfig('enable_seasonal_pricing', val)}
                  comingSoon
                />
              </div>
            </div>
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
                  <p className="font-bold text-gray-900 mb-1">1. Arbeitsaufwand (Mannstunden)</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>Basis: 0,12 Std. pro m³</li>
                    <li>Etagen: +0,02 Std. pro m³/Etage</li>
                    <li>Service: +0,15m³ (Abbau), +0,25m³ (Packen)</li>
                    <li>Minimum: 4 Mannstunden</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-gray-900 mb-1">2. Teamgröße</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>&lt; 20m³: 2 Personen</li>
                    <li>20 - 45m³: 3 Personen</li>
                    <li>&gt; 45m³: 4 Personen</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-gray-900 mb-1">3. Fahrzeit & Pausen</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>LKW-Faktor: Google Zeit × 1,15</li>
                    <li>Pause: +45 Min ab 4,5 Std. Fahrt</li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-primary-100 text-[10px] italic">
                  Gesamtzeit = (Mannstunden / Personen) + Fahrtzeit
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
                2-Zimmer Wohnung, 40 m³, 50 km, 2. Etage
              </div>
              
              <div className="space-y-2 text-xs">
                <PreviewRow
                  label="Volumenkosten"
                  value={`€${(40 * config.base_rate_m3_min).toFixed(0)} - €${(40 * config.base_rate_m3_max).toFixed(0)}`}
                />
                <PreviewRow
                  label="Kilometerkosten"
                  value={`€${(50 * config.rate_km_near).toFixed(0)}`}
                />
                <PreviewRow
                  label="Arbeitskosten (4h)"
                  value={`€${(4 * config.hourly_labor_min * config.min_movers).toFixed(0)} - €${(4 * config.hourly_labor_max * config.min_movers).toFixed(0)}`}
                />
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Gesamt (ca.)</span>
                  <span className="text-lg font-bold text-primary-600">
                    €{calculateExampleTotal(config, 'min')} - €{calculateExampleTotal(config, 'max')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Market Position */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Marktpositionierung
              </h3>
              
              <div className="space-y-3">
                <PositionIndicator
                  category="Volumenpreis"
                  current={config.base_rate_m3_min}
                  budget={20}
                  mid={32.5}
                  premium={42.5}
                  unit="€/m³"
                />
                
                <PositionIndicator
                  category="Arbeitskosten"
                  current={config.hourly_labor_min}
                  budget={45}
                  mid={55}
                  premium={65}
                  unit="€/Std"
                />
              </div>
            </div>
            
            {/* Quick Reference */}
            <div className="card bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Schnellreferenz
              </h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Studio (15 m³)</span>
                  <span className="font-semibold">€{(15 * config.base_rate_m3_min).toFixed(0)} - €{(15 * config.base_rate_m3_max).toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">2-Zimmer (40 m³)</span>
                  <span className="font-semibold">€{(40 * config.base_rate_m3_min).toFixed(0)} - €{(40 * config.base_rate_m3_max).toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">4-Zimmer (80 m³)</span>
                  <span className="font-semibold">€{(80 * config.base_rate_m3_min).toFixed(0)} - €{(80 * config.base_rate_m3_max).toFixed(0)}</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-300 text-xs text-gray-600">
                Nur Volumenkosten, ohne Distanz & Arbeitszeit
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Helper Components
function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  helpText
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  unit: string
  helpText?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="relative w-28">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-right pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {unit}
          </span>
        </div>
      </div>
      {helpText && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  )
}

function ToggleSwitch({
  label,
  description,
  enabled,
  onChange,
  comingSoon = false
}: {
  label: string
  description: string
  enabled: boolean
  onChange: (value: boolean) => void
  comingSoon?: boolean
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{label}</span>
          {comingSoon && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
              Demnächst
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>
      <button
        onClick={() => !comingSoon && onChange(!enabled)}
        disabled={comingSoon}
        className={clsx(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          {
            'bg-primary-600': enabled && !comingSoon,
            'bg-gray-200': !enabled || comingSoon,
            'opacity-50 cursor-not-allowed': comingSoon,
            'cursor-pointer': !comingSoon
          }
        )}
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            {
              'translate-x-6': enabled,
              'translate-x-1': !enabled
            }
          )}
        />
      </button>
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

function PositionIndicator({
  category,
  current,
  budget,
  mid,
  premium,
  unit
}: {
  category: string
  current: number
  budget: number
  mid: number
  premium: number
  unit: string
}) {
  const position = current <= budget ? 'budget' : current <= mid ? 'mid' : 'premium'
  
  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-gray-600">{category}</span>
        <span className="font-semibold text-gray-900">{current}{unit}</span>
      </div>
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-green-300" title={`Budget: bis ${budget}${unit}`}></div>
          <div className="flex-1 bg-blue-300" title={`Mittelklasse: ${budget}-${mid}${unit}`}></div>
          <div className="flex-1 bg-purple-300" title={`Premium: ab ${mid}${unit}`}></div>
        </div>
        <div
          className="absolute top-0 bottom-0 w-1 bg-red-600"
          style={{
            left: `${Math.min(((current - budget) / (premium - budget)) * 100, 100)}%`
          }}
        ></div>
      </div>
      <div className="flex justify-between text-xs mt-1 text-gray-500">
        <span>Budget</span>
        <span>Mittel</span>
        <span>Premium</span>
      </div>
      <div className="text-xs text-center mt-1">
        <span className={clsx('font-medium', {
          'text-green-600': position === 'budget',
          'text-blue-600': position === 'mid',
          'text-purple-600': position === 'premium'
        })}>
          {position === 'budget' ? 'Budget-Segment' : position === 'mid' ? 'Mittelklasse' : 'Premium-Segment'}
        </span>
      </div>
    </div>
  )
}

function calculateExampleTotal(config: PricingConfig, type: 'min' | 'max'): string {
  // Example: 40m³, 50km, 4 hours, 2 movers
  const volumeCost = 40 * (type === 'min' ? config.base_rate_m3_min : config.base_rate_m3_max)
  const distanceCost = 50 * config.rate_km_near
  const laborCost = 4 * (type === 'min' ? config.hourly_labor_min : config.hourly_labor_max) * config.min_movers
  
  const total = volumeCost + distanceCost + laborCost
  return total.toFixed(0)
}
