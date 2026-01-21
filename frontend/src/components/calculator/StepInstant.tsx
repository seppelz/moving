/**
 * Step 1: Instant Estimate
 * Quick quote with minimal inputs
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Home, ArrowRight } from 'lucide-react'
import { useCalculatorStore } from '@/store/calculatorStore'
import { ApartmentSize } from '@/types'

export default function StepInstant() {
  const {
    originPostalCode,
    destinationPostalCode,
    apartmentSize,
    quote,
    isCalculating,
    error,
    setOriginPostalCode,
    setDestinationPostalCode,
    setApartmentSize,
    setStep,
    calculateQuote,
  } = useCalculatorStore()
  
  const [localOrigin, setLocalOrigin] = useState(originPostalCode)
  const [localDestination, setLocalDestination] = useState(destinationPostalCode)
  
  // Auto-calculate when all fields are filled
  useEffect(() => {
    if (
      localOrigin.length === 5 &&
      localDestination.length === 5 &&
      apartmentSize
    ) {
      const timer = setTimeout(() => {
        calculateQuote()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [localOrigin, localDestination, apartmentSize])
  
  const handleOriginChange = (value: string) => {
    // Only allow digits, max 5
    const cleaned = value.replace(/\D/g, '').slice(0, 5)
    setLocalOrigin(cleaned)
    if (cleaned.length === 5) {
      setOriginPostalCode(cleaned)
    }
  }
  
  const handleDestinationChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 5)
    setLocalDestination(cleaned)
    if (cleaned.length === 5) {
      setDestinationPostalCode(cleaned)
    }
  }
  
  const apartmentSizes = [
    { value: ApartmentSize.STUDIO, label: 'Studio', m3: '~15m³' },
    { value: ApartmentSize.ONE_BR, label: '1 Zimmer', m3: '~25m³' },
    { value: ApartmentSize.TWO_BR, label: '2 Zimmer', m3: '~40m³' },
    { value: ApartmentSize.THREE_BR, label: '3 Zimmer', m3: '~60m³' },
    { value: ApartmentSize.FOUR_BR_PLUS, label: '4+ Zimmer', m3: '~80m³' },
  ]
  
  const canProceed = quote && !isCalculating && !error
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card max-w-3xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Ihr Umzug, vereinfacht
        </h2>
        <p className="text-gray-600">
          Erhalten Sie in 30 Sekunden eine erste Kostenschätzung
        </p>
      </div>
      
      <div className="space-y-6">
        {/* From/To Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Von (PLZ)
            </label>
            <input
              type="text"
              value={localOrigin}
              onChange={(e) => handleOriginChange(e.target.value)}
              placeholder="z.B. 10115"
              className="input-field text-lg"
              maxLength={5}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Nach (PLZ)
            </label>
            <input
              type="text"
              value={localDestination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              placeholder="z.B. 80331"
              className="input-field text-lg"
              maxLength={5}
            />
          </div>
        </div>
        
        {/* Apartment Size Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Home className="w-4 h-4 inline mr-2" />
            Wohnungsgröße
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {apartmentSizes.map((size) => (
              <button
                key={size.value}
                onClick={() => setApartmentSize(size.value)}
                className={clsx(
                  'p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md',
                  {
                    'border-primary-600 bg-primary-50 shadow-md':
                      apartmentSize === size.value,
                    'border-gray-200 hover:border-gray-300':
                      apartmentSize !== size.value,
                  }
                )}
              >
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {size.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{size.m3}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          >
            {error}
          </motion.div>
        )}
        
        {/* Estimated Price Display */}
        {quote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-8 rounded-2xl shadow-xl"
          >
            <div className="text-center">
              <div className="text-sm font-medium opacity-90 mb-2">
                Geschätzte Kosten
              </div>
              <div className="text-5xl font-bold mb-2">
                €{Math.round(Number(quote.min_price))} - €{Math.round(Number(quote.max_price))}
              </div>
              <div className="text-sm opacity-80">
                Entfernung: {Number(quote.distance_km).toFixed(0)} km •
                Volumen: {Number(quote.volume_m3).toFixed(1)} m³ •
                Dauer: ~{Number(quote.estimated_hours).toFixed(1)} Std.
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Loading State */}
        {isCalculating && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-gray-600 mt-4">Berechnung läuft...</p>
          </div>
        )}
        
        {/* Next Button */}
        {canProceed && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setStep(2)}
            className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2"
          >
            Exakte Kalkulation
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// Helper function for clsx
import clsx from 'clsx'
