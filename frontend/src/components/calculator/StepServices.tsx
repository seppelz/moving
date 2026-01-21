/**
 * Step 3: Services & Extras
 * German-specific services (HVZ, Kitchen Assembly, External Lift)
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowLeft, Package, Wrench, Ban, Ruler, Truck, Lightbulb } from 'lucide-react'
import { useCalculatorStore } from '@/store/calculatorStore'

export default function StepServices() {
  const {
    services,
    quote,
    originFloor,
    destinationFloor,
    originHasElevator,
    destinationHasElevator,
    setOriginFloor,
    setDestinationFloor,
    setOriginHasElevator,
    setDestinationHasElevator,
    toggleService,
    setStep,
    calculateQuote,
  } = useCalculatorStore()
  
  const [kitchenMeters, setKitchenMeters] = useState(0)
  
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
  
  // Auto-suggest external lift
  const shouldSuggestLift =
    (originFloor > 4 && !originHasElevator) ||
    (destinationFloor > 4 && !destinationHasElevator) ||
    (quote && Number(quote.volume_m3) > 50 && (originFloor > 2 || destinationFloor > 2))
  
  const handleNext = async () => {
    await calculateQuote()
    setStep(5)
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
        </div>
        
        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => setStep(3)}
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

import clsx from 'clsx'
