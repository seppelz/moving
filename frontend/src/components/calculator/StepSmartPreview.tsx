/**
 * Step 2: Smart Prediction Preview
 * Shows profile-based estimate with quick adjustment options
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, ArrowRight, ArrowLeft, Package, CheckCircle,
  Edit3, TrendingUp, TrendingDown, Users, Lightbulb, Square, CheckSquare
} from 'lucide-react'
import { useCalculatorStore } from '@/store/calculatorStore'
import { quoteAPI } from '@/services/api'
import clsx from 'clsx'

interface SmartPrediction {
  predicted_volume_m3: number
  volume_range: [number, number]
  confidence_score: number
  typical_items: Record<string, any[]>
  typical_boxes: number
  profile_key: string
  persona_description: string
  breakdown: Record<string, number>
  suggestions: any[]
}

export default function StepSmartPreview() {
  const {
    smartProfile,
    setStep,
    setInventoryFromPrediction,
  } = useCalculatorStore()

  const [prediction, setPrediction] = useState<SmartPrediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdjustments, setShowAdjustments] = useState(false)

  // Adjustment states
  const [furnitureLevel, setFurnitureLevel] = useState(0) // -2 to +2
  const [boxCount, setBoxCount] = useState(0)
  const [hasWashingMachine, setHasWashingMachine] = useState(false)
  const [hasMountedKitchen, setHasMountedKitchen] = useState(false)
  const [kitchenMeters, setKitchenMeters] = useState(0)
  const [hasLargePlants, setHasLargePlants] = useState(false)
  const [bicycleCount, setBicycleCount] = useState(0)

  const [adjustedVolume, setAdjustedVolume] = useState<number | null>(null)

  useEffect(() => {
    loadPrediction()
  }, [])

  useEffect(() => {
    if (prediction) {
      setBoxCount(prediction.typical_boxes)
    }
  }, [prediction])

  const loadPrediction = async () => {
    if (!smartProfile) {
      setStep(2)
      return
    }

    setLoading(true)
    try {
      const result = await quoteAPI.getSmartPrediction(smartProfile)
      setPrediction(result)
    } catch (error) {
      console.error('Failed to get prediction:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyAdjustments = async () => {
    if (!prediction) return

    try {
      const result = await quoteAPI.applyQuickAdjustment({
        profile_key: prediction.profile_key,
        furniture_level: furnitureLevel,
        box_count: boxCount,
        has_washing_machine: hasWashingMachine,
        has_mounted_kitchen: hasMountedKitchen,
        kitchen_meters: kitchenMeters,
        has_large_plants: hasLargePlants,
        bicycle_count: bicycleCount,
      })

      setAdjustedVolume(result.adjusted_volume_m3)
    } catch (error) {
      console.error('Failed to apply adjustments:', error)
    }
  }

  useEffect(() => {
    if (showAdjustments) {
      applyAdjustments()
    }
  }, [
    furnitureLevel, boxCount, hasWashingMachine, hasMountedKitchen,
    kitchenMeters, hasLargePlants, bicycleCount, showAdjustments
  ])

  const handleConfirm = () => {
    if (!prediction) return

    // Convert prediction to inventory format and go directly to services
    setInventoryFromPrediction(prediction.typical_items)

    // Skip inventory step, go to services
    setStep(5)
  }

  const handleDetailedMode = () => {
    if (!prediction) return

    // Convert prediction to inventory format
    setInventoryFromPrediction(prediction.typical_items)

    // Go to inventory step for manual review/editing
    setStep(4)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Berechne Ihre Schätzung...
          </h3>
          <p className="text-gray-600">
            Erstelle personalisierte Volumenberechnung basierend auf Ihrem Profil
          </p>
        </div>
      </div>
    )
  }

  if (!prediction) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <p className="text-red-600">Fehler beim Laden der Schätzung</p>
          <button onClick={() => setStep(2)} className="btn-secondary mt-4">
            Zurück
          </button>
        </div>
      </div>
    )
  }

  const displayVolume = adjustedVolume || prediction.predicted_volume_m3
  const [minVolume, maxVolume] = prediction.volume_range

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-5xl mx-auto"
    >
      <div className="card">
        {/* Success Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Ihre Volumen-Schätzung
          </h2>
          <p className="text-gray-600">
            {prediction.persona_description}
          </p>
          <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-1">
            <Lightbulb className="w-3 h-3 text-primary-600" />
            Basierend auf typischen {smartProfile?.apartment_size === '2br' ? '2-Zimmer' : smartProfile?.apartment_size === '3br' ? '3-Zimmer' : smartProfile?.apartment_size === '1br' ? '1-Zimmer' : ''} Haushalten
          </p>
        </div>

        {/* Volume Estimate Card */}
        <div className="bg-gradient-to-br from-primary-600 to-purple-600 text-white p-8 rounded-2xl mb-8">
          <div className="text-center">
            <div className="text-sm font-medium opacity-90 mb-2">
              Geschätztes Umzugsvolumen
            </div>
            <div className="text-6xl font-bold mb-3">
              {displayVolume.toFixed(1)} m³
            </div>
            <div className="text-sm opacity-80 mb-1">
              Typischer Bereich: {minVolume}-{maxVolume} m³
            </div>
            <div className="text-xs opacity-70 mb-4">
              Circa {prediction.typical_boxes} Umzugskartons
            </div>

            {/* Confidence Score */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">
                {Math.round(prediction.confidence_score * 100)}% Übereinstimmung
              </span>
            </div>
          </div>
        </div>

        {/* Room Breakdown */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Raumaufteilung
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(prediction.breakdown).map(([room, volume]) => (
              <div
                key={room}
                className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200"
              >
                <div className="text-sm text-gray-600 capitalize mb-1">
                  {room.replace('_', ' ')}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {volume} m³
                </div>
              </div>
            ))}
            <div className="bg-primary-50 rounded-lg p-4 border-2 border-primary-200">
              <div className="text-sm text-primary-700 mb-1">
                Umzugskartons
              </div>
              <div className="text-2xl font-bold text-primary-900">
                {boxCount} Stück
              </div>
            </div>
          </div>
        </div>

        {/* Quick Adjustments Toggle */}
        {!showAdjustments ? (
          <button
            onClick={() => setShowAdjustments(true)}
            className="w-full bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 rounded-lg p-4 mb-6 transition-all"
          >
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <Edit3 className="w-5 h-5" />
              <span className="font-medium">Schnellanpassungen (optional)</span>
            </div>
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Anpassungen
            </h3>

            <div className="space-y-6">
              {/* Furniture Level Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Möbelmenge im Vergleich zum Durchschnitt
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  value={furnitureLevel}
                  onChange={(e) => setFurnitureLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    Viel weniger
                  </span>
                  <span className={clsx('font-semibold', {
                    'text-primary-600': furnitureLevel === 0,
                    'text-orange-600': furnitureLevel !== 0,
                  })}>
                    {furnitureLevel === 0 ? 'Normal' : furnitureLevel > 0 ? `+${furnitureLevel * 10}%` : `${furnitureLevel * 10}%`}
                  </span>
                  <span className="flex items-center gap-1">
                    Viel mehr
                    <TrendingUp className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Box Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Anzahl Umzugskartons
                </label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={boxCount}
                  onChange={(e) => setBoxCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>0</span>
                  <span className="font-semibold text-primary-600">{boxCount} Kartons</span>
                  <span>80+</span>
                </div>
              </div>

              {/* Quick Toggles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Haben Sie folgende Gegenstände?
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setHasWashingMachine(!hasWashingMachine)}
                    className={clsx(
                      'w-full px-4 py-3 rounded-lg border-2 transition-all text-left',
                      {
                        'border-primary-600 bg-primary-50': hasWashingMachine,
                        'border-gray-200 hover:border-gray-300': !hasWashingMachine,
                      }
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {hasWashingMachine ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                      Waschmaschine {hasWashingMachine && '(+0.8 m³)'}
                    </div>
                  </button>

                  <button
                    onClick={() => setHasMountedKitchen(!hasMountedKitchen)}
                    className={clsx(
                      'w-full px-4 py-3 rounded-lg border-2 transition-all text-left',
                      {
                        'border-primary-600 bg-primary-50': hasMountedKitchen,
                        'border-gray-200 hover:border-gray-300': !hasMountedKitchen,
                      }
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {hasMountedKitchen ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                      Montierte Küche
                    </div>
                  </button>

                  {hasMountedKitchen && (
                    <div className="ml-4 mt-2">
                      <label className="block text-sm text-gray-600 mb-2">
                        Küchenlänge in Metern
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={kitchenMeters}
                        onChange={(e) => setKitchenMeters(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-center text-sm font-semibold text-primary-600 mt-1">
                        {kitchenMeters} m (+{(kitchenMeters * 1.5).toFixed(1)} m³)
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setHasLargePlants(!hasLargePlants)}
                    className={clsx(
                      'w-full px-4 py-3 rounded-lg border-2 transition-all text-left',
                      {
                        'border-primary-600 bg-primary-50': hasLargePlants,
                        'border-gray-200 hover:border-gray-300': !hasLargePlants,
                      }
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {hasLargePlants ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                      Große Pflanzen (3+) {hasLargePlants && '(+2.0 m³)'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Bicycle Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Anzahl Fahrräder
                </label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() => setBicycleCount(count)}
                      className={clsx(
                        'flex-1 px-4 py-3 rounded-lg border-2 transition-all font-semibold',
                        {
                          'border-primary-600 bg-primary-50': bicycleCount === count,
                          'border-gray-200 hover:border-gray-300': bicycleCount !== count,
                        }
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {adjustedVolume && (
              <div className="mt-6 bg-white rounded-lg p-4 border-2 border-primary-200">
                <div className="text-sm text-gray-600 mb-1">Angepasste Schätzung:</div>
                <div className="text-3xl font-bold text-primary-600">
                  {adjustedVolume.toFixed(1)} m³
                </div>
              </div>
            )}

            <button
              onClick={() => setShowAdjustments(false)}
              className="w-full mt-4 text-center text-sm text-gray-600 hover:text-gray-900"
            >
              Anpassungen ausblenden
            </button>
          </motion.div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="flex gap-1.5">
                <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Hinweis:</strong> Diese Volumen-Schätzung basiert auf typischen deutschen Haushalten
                  und erreicht erfahrungsgemäß 85-95% Genauigkeit. Sie können die Schätzung bei Bedarf anpassen
                  oder später die Möbelliste prüfen und bearbeiten.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            Weiter zu Services
          </button>

          <button
            onClick={handleDetailedMode}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Edit3 className="w-5 h-5" />
            Möbelliste anpassen
          </button>

          <button
            onClick={() => setStep(2)}
            className="w-full text-center text-sm text-gray-600 hover:text-gray-900 py-2"
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Zurück zu den Fragen
          </button>
        </div>
      </div>
    </motion.div>
  )
}
