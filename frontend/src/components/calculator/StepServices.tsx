/**
 * Step 3: Services & Extras
 * German-specific services (HVZ, Kitchen Assembly, External Lift)
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, Package, Wrench, Ban, Ruler, Truck, Lightbulb, Calendar, Trash2, MapPin, Shield } from 'lucide-react'
import clsx from 'clsx'
import { useCalculatorStore } from '@/store/calculatorStore'

export default function StepServices() {
  const {
    services,
    quote,
    originFloor,
    destinationFloor,
    originHasElevator,
    destinationHasElevator,
    cameFromInventory,
    movingDate,
    setOriginFloor,
    setDestinationFloor,
    setOriginHasElevator,
    setDestinationHasElevator,
    setMovingDate,
    toggleService,
    setStep,
    calculateQuote,
  } = useCalculatorStore()

  const [kitchenMeters, setKitchenMeters] = useState(0)
  const [disposalM3, setDisposalM3] = useState(0)
  const [carryDistance, setCarryDistance] = useState(0)
  const [insuranceType, setInsuranceType] = useState<'none' | 'basic' | 'premium'>('none')

  const getServiceEnabled = (type: string) => {
    return services.find((s) => s.service_type === type)?.enabled || false
  }

  const handleServiceToggle = (type: string, enabled: boolean, metadata?: any) => {
    toggleService(type, enabled, metadata)
  }

  useEffect(() => {
    // Update kitchen service metadata when meters change
    if (kitchenMeters > 0) {
      handleServiceToggle('kitchen_assembly', true, { kitchen_meters: kitchenMeters })
    }
  }, [kitchenMeters])

  useEffect(() => {
    if (disposalM3 > 0) {
      handleServiceToggle('disposal', true, { disposal_m3: disposalM3 })
    } else {
      handleServiceToggle('disposal', false)
    }
  }, [disposalM3])

  useEffect(() => {
    if (carryDistance > 10) {
      handleServiceToggle('long_carry', true, { carry_distance_m: carryDistance })
    } else {
      handleServiceToggle('long_carry', false)
    }
  }, [carryDistance])

  // Auto-suggest external lift
  const shouldSuggestLift =
    (originFloor > 4 && !originHasElevator) ||
    (destinationFloor > 4 && !destinationHasElevator) ||
    (quote && Number(quote.volume_m3) > 50 && (originFloor > 2 || destinationFloor > 2))

  const handleNext = async () => {
    await calculateQuote()
    const { error } = useCalculatorStore.getState()
    if (!error) {
      setStep(6)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-3xl mx-auto"
    >
      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Zusätzliche Services
          </h2>
          <p className="text-gray-600">
            Wählen Sie optionale Dienstleistungen für Ihren Umzug
          </p>
        </div>

        {/* Floor Information */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-4">Stockwerk-Informationen</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Origin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aktuelle Wohnung - Stockwerk
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={originFloor}
                onChange={(e) => setOriginFloor(parseInt(e.target.value) || 0)}
                className="input-field"
              />
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={originHasElevator}
                  onChange={(e) => setOriginHasElevator(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Aufzug vorhanden</span>
              </label>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neue Wohnung - Stockwerk
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={destinationFloor}
                onChange={(e) => setDestinationFloor(parseInt(e.target.value) || 0)}
                className="input-field"
              />
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={destinationHasElevator}
                  onChange={(e) => setDestinationHasElevator(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Aufzug vorhanden</span>
              </label>
            </div>
          </div>
        </div>

        {/* Moving Date */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Wunschtermin
          </h3>
          <input
            type="date"
            value={movingDate}
            onChange={(e) => setMovingDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="input-field max-w-xs"
          />
          <p className="text-xs text-gray-500 mt-2">
            Optional - hilft uns bei der Planung und Verfügbarkeit
          </p>
        </div>

        {/* Services List */}
        <div className="space-y-4 mb-6">
          {/* Packing Service */}
          <ServiceCard
            icon={<Package className="w-6 h-6" />}
            title="Packservice"
            description="Wir packen Ihre Gegenstände professionell und sicher"
            cost="+€200-400"
            enabled={getServiceEnabled('packing')}
            onToggle={(enabled) => handleServiceToggle('packing', enabled)}
          />

          {/* Disassembly */}
          <ServiceCard
            icon={<Wrench className="w-6 h-6" />}
            title="Möbelmontage"
            description="Demontage und Montage Ihrer Möbel"
            cost="+€150-300"
            enabled={getServiceEnabled('disassembly')}
            onToggle={(enabled) => handleServiceToggle('disassembly', enabled)}
          />

          {/* HVZ Permit */}
          <ServiceCard
            icon={<Ban className="w-6 h-6" />}
            title="Halteverbotszone (HVZ)"
            description="Beantragung einer Halteverbotszone vor Ihren Adressen"
            cost="+€120"
            enabled={getServiceEnabled('hvz_permit')}
            onToggle={(enabled) => handleServiceToggle('hvz_permit', enabled)}
            info="Empfohlen in Großstädten für einfacheres Be- und Entladen"
          />

          {/* Kitchen Assembly */}
          <div
            className={clsx(
              'border-2 rounded-lg p-4 transition-all',
              {
                'border-primary-600 bg-primary-50': getServiceEnabled('kitchen_assembly'),
                'border-gray-200': !getServiceEnabled('kitchen_assembly'),
              }
            )}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                <Ruler className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">Küchenmontage</h3>
                    <p className="text-sm text-gray-600">
                      Demontage und Aufbau Ihrer Küche
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary-600 whitespace-nowrap ml-4">
                    +€{(kitchenMeters * 45).toFixed(0)}
                  </span>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Laufmeter der Küche (0-10m)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={kitchenMeters}
                    onChange={(e) => setKitchenMeters(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>0m</span>
                    <span className="font-semibold text-primary-600">
                      {kitchenMeters.toFixed(1)}m
                    </span>
                    <span>10m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* External Lift */}
          {shouldSuggestLift && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ServiceCard
                icon={<Truck className="w-6 h-6" />}
                title="Außenaufzug"
                description="Empfohlen für hohe Stockwerke ohne Aufzug"
                cost="+€350-500"
                enabled={getServiceEnabled('external_lift')}
                onToggle={(enabled) => handleServiceToggle('external_lift', enabled)}
                recommended
                info="Spart Zeit und schont Ihre Möbel"
              />
            </motion.div>
          )}

          {/* Disposal / Entrümpelung */}
          <div
            className={clsx(
              'border-2 rounded-lg p-4 transition-all',
              {
                'border-primary-600 bg-primary-50': disposalM3 > 0,
                'border-gray-200': disposalM3 === 0,
              }
            )}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">Entrümpelung</h3>
                    <p className="text-sm text-gray-600">
                      Entsorgung von Möbeln und Gegenständen, die Sie nicht mitnehmen
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary-600 whitespace-nowrap ml-4">
                    {disposalM3 > 0 ? `+€${(80 + disposalM3 * 45).toFixed(0)}` : 'ab €80'}
                  </span>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volumen zur Entsorgung (0-20m³)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={disposalM3}
                    onChange={(e) => setDisposalM3(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>0m³</span>
                    <span className="font-semibold text-primary-600">{disposalM3}m³</span>
                    <span>20m³</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Long Carry / Parkdistanz */}
          <div
            className={clsx(
              'border-2 rounded-lg p-4 transition-all',
              {
                'border-primary-600 bg-primary-50': carryDistance > 10,
                'border-gray-200': carryDistance <= 10,
              }
            )}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">Langer Trageweg</h3>
                    <p className="text-sm text-gray-600">
                      Zusätzlicher Trageweg wenn der LKW nicht direkt am Eingang parken kann
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary-600 whitespace-nowrap ml-4">
                    {carryDistance > 10 ? `+€${(Math.ceil((carryDistance - 10) / 10) * 35).toFixed(0)}` : 'ab €35'}
                  </span>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entfernung LKW zum Eingang (Meter)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={carryDistance}
                    onChange={(e) => setCarryDistance(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>0m</span>
                    <span className="font-semibold text-primary-600">{carryDistance}m</span>
                    <span>100m</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Erste 10m sind kostenfrei</p>
                </div>
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Transportversicherung</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Schützen Sie Ihr Hab und Gut während des Transports
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name="insurance"
                      checked={insuranceType === 'none'}
                      onChange={() => {
                        setInsuranceType('none')
                        handleServiceToggle('insurance_basic', false)
                        handleServiceToggle('insurance_premium', false)
                      }}
                      className="w-4 h-4 text-primary-600"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Kein zusätzlicher Schutz</span>
                      <p className="text-xs text-gray-500">Gesetzliche Haftung (€620/m³)</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name="insurance"
                      checked={insuranceType === 'basic'}
                      onChange={() => {
                        setInsuranceType('basic')
                        handleServiceToggle('insurance_basic', true)
                        handleServiceToggle('insurance_premium', false)
                      }}
                      className="w-4 h-4 text-primary-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Basis-Schutz</span>
                        <span className="text-sm font-medium text-primary-600">+€49</span>
                      </div>
                      <p className="text-xs text-gray-500">Bis €50.000 Deckungssumme</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name="insurance"
                      checked={insuranceType === 'premium'}
                      onChange={() => {
                        setInsuranceType('premium')
                        handleServiceToggle('insurance_basic', false)
                        handleServiceToggle('insurance_premium', true, { declared_value: 100000 })
                      }}
                      className="w-4 h-4 text-primary-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Premium-Schutz</span>
                        <span className="text-sm font-medium text-primary-600">ab €89</span>
                      </div>
                      <p className="text-xs text-gray-500">Voller Neuwert-Ersatz, Deckungssumme wählbar</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => setStep(cameFromInventory ? 4 : 3)}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück
          </button>
          <button
            onClick={handleNext}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            Weiter zu Kontakt
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Service Card Component
interface ServiceCardProps {
  icon: React.ReactNode
  title: string
  description: string
  cost: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
  info?: string
  recommended?: boolean
}

function ServiceCard({
  icon,
  title,
  description,
  cost,
  enabled,
  onToggle,
  info,
  recommended,
}: ServiceCardProps) {
  return (
    <div
      className={clsx(
        'border-2 rounded-lg p-4 transition-all cursor-pointer',
        {
          'border-primary-600 bg-primary-50': enabled,
          'border-gray-200 hover:border-gray-300': !enabled,
          'ring-2 ring-yellow-400': recommended && !enabled,
        }
      )}
      onClick={() => onToggle(!enabled)}
    >
      <div className="flex items-start gap-4">
        <div
          className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            {
              'bg-primary-600 text-white': enabled,
              'bg-primary-100 text-primary-600': !enabled,
            }
          )}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {title}
                {recommended && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                    Empfohlen
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
            <span className="text-sm font-medium text-primary-600 whitespace-nowrap ml-4">
              {cost}
            </span>
          </div>
          {info && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              {info}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
