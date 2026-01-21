/**
 * Step 1: Smart Profile Questions
 * Profile-based estimation instead of manual item selection
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, Users, Sparkles, ArrowRight, Briefcase, Baby, HelpCircle,
  Building, Building2, Castle, Minimize2, Package, Boxes,
  Music, BookOpen, Dumbbell, Wrench, Fish, Leaf
} from 'lucide-react'
import { useCalculatorStore } from '@/store/calculatorStore'
import clsx from 'clsx'

export default function StepSmartProfile() {
  const {
    apartmentSize,
    setApartmentSize,
    setStep,
    setSmartProfile,
  } = useCalculatorStore()
  
  const [householdType, setHouseholdType] = useState<string>('')
  const [furnishingLevel, setFurnishingLevel] = useState<string>('normal')
  const [hasHomeOffice, setHasHomeOffice] = useState<boolean | null>(null)
  const [hasKids, setHasKids] = useState<boolean | null>(null)
  const [specialItems, setSpecialItems] = useState<string[]>([])
  const [yearsLived, setYearsLived] = useState<number>(0)
  
  const apartmentSizes = [
    { value: 'studio', label: 'Studio', description: '1 Raum', icon: Home },
    { value: '1br', label: '1 Zimmer', description: '~15-20m³', icon: Home },
    { value: '2br', label: '2 Zimmer', description: '~30-40m³', icon: Building },
    { value: '3br', label: '3 Zimmer', description: '~50-65m³', icon: Building2 },
    { value: '4br', label: '4+ Zimmer', description: '~70m³+', icon: Castle },
  ]
  
  const householdTypes = [
    { value: 'single', label: 'Single', icon: <Users className="w-6 h-6" />, description: 'Alleine wohnend' },
    { value: 'couple', label: 'Paar', icon: <Users className="w-6 h-6" />, description: 'Zu zweit ohne Kinder' },
    { value: 'young_professional', label: 'Young Professional', icon: <Briefcase className="w-6 h-6" />, description: '25-35 Jahre, urban' },
    { value: 'family_kids', label: 'Familie', icon: <Baby className="w-6 h-6" />, description: 'Mit Kindern' },
    { value: 'wg', label: 'WG', icon: <Users className="w-6 h-6" />, description: 'Wohngemeinschaft' },
  ]
  
  const furnishingLevels = [
    { value: 'minimal', label: 'Minimalistisch', description: 'Wenig Möbel & Besitz', icon: Minimize2 },
    { value: 'normal', label: 'Normal', description: 'Standard-Ausstattung', icon: Package },
    { value: 'full', label: 'Voll ausgestattet', description: 'Viele Möbel & Sachen', icon: Boxes },
  ]
  
  const specialItemsList = [
    { value: 'piano', label: 'Klavier/Flügel', icon: Music },
    { value: 'large_library', label: 'Große Büchersammlung', icon: BookOpen },
    { value: 'gym_equipment', label: 'Fitnessgeräte', icon: Dumbbell },
    { value: 'workshop', label: 'Werkstatt', icon: Wrench },
    { value: 'large_aquarium', label: 'Großes Aquarium', icon: Fish },
    { value: 'many_plants', label: 'Viele große Pflanzen', icon: Leaf },
  ]
  
  const toggleSpecialItem = (item: string) => {
    if (specialItems.includes(item)) {
      setSpecialItems(specialItems.filter(i => i !== item))
    } else {
      setSpecialItems([...specialItems, item])
    }
  }
  
  const handleNext = () => {
    // Save smart profile data
    if (!apartmentSize || !householdType || !furnishingLevel) {
      return
    }
    
    setSmartProfile({
      apartment_size: apartmentSize,
      household_type: householdType,
      furnishing_level: furnishingLevel,
      has_home_office: hasHomeOffice,
      has_kids: hasKids,
      years_lived: yearsLived,
      special_items: specialItems,
    })
    
    // Go to prediction preview (step 3)
    setStep(3)
  }
  
  const canProceed = apartmentSize && householdType
  const currentStep = !apartmentSize ? 1 : !householdType ? 2 : 3
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      <div className="card">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Intelligente Umzugsschätzung
          </h2>
          <p className="text-gray-600">
            Beantworten Sie 5 kurze Fragen – wir erstellen automatisch eine personalisierte Schätzung
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span>90 Sekunden statt 10 Minuten</span>
            <span className="mx-2">•</span>
            <span>Basierend auf typischen deutschen Haushalten</span>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={clsx(
                  'h-2 rounded-full transition-all duration-300',
                  {
                    'w-16 bg-primary-600': currentStep >= step,
                    'w-8 bg-gray-200': currentStep < step,
                  }
                )}
              />
            ))}
          </div>
        </div>
        
        <div className="space-y-8">
          {/* Question 1: Apartment Size */}
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                <Home className="w-5 h-5 inline mr-2" />
                1. Wie groß ist Ihre Wohnung?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {apartmentSizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setApartmentSize(size.value)}
                    className={clsx(
                      'p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg',
                      {
                        'border-primary-600 bg-primary-50 shadow-md': apartmentSize === size.value,
                        'border-gray-200 hover:border-gray-300': apartmentSize !== size.value,
                      }
                    )}
                  >
                    <div className="mb-2">
                      <size.icon className="w-8 h-8 mx-auto text-primary-600" />
                    </div>
                    <div className="font-semibold text-gray-900">{size.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{size.description}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Question 2: Household Type */}
          {apartmentSize && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                <Users className="w-5 h-5 inline mr-2" />
                2. Wer zieht um?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {householdTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setHouseholdType(type.value)
                      if (type.value === 'family_kids') {
                        setHasKids(true)
                      }
                    }}
                    className={clsx(
                      'p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg text-left',
                      {
                        'border-primary-600 bg-primary-50 shadow-md': householdType === type.value,
                        'border-gray-200 hover:border-gray-300': householdType !== type.value,
                      }
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Question 3: Furnishing Level */}
          {householdType && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                3. Wie viel Besitz haben Sie?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {furnishingLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setFurnishingLevel(level.value)}
                    className={clsx(
                      'p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg',
                      {
                        'border-primary-600 bg-primary-50 shadow-md': furnishingLevel === level.value,
                        'border-gray-200 hover:border-gray-300': furnishingLevel !== level.value,
                      }
                    )}
                  >
                    <div className="mb-2">
                      <level.icon className="w-8 h-8 mx-auto text-primary-600" />
                    </div>
                    <div className="font-semibold text-gray-900">{level.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{level.description}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Question 4: Optional Details */}
          {furnishingLevel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <label className="block text-lg font-semibold text-gray-900">
                4. Zusätzliche Details (optional)
              </label>
              
              {/* Home Office */}
              <div>
                <p className="text-sm text-gray-700 mb-3">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Haben Sie ein Home Office?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setHasHomeOffice(true)}
                    className={clsx(
                      'flex-1 px-4 py-3 rounded-lg border-2 transition-all',
                      {
                        'border-primary-600 bg-primary-50': hasHomeOffice === true,
                        'border-gray-200 hover:border-gray-300': hasHomeOffice !== true,
                      }
                    )}
                  >
                    Ja, voll ausgestattet
                  </button>
                  <button
                    onClick={() => setHasHomeOffice(false)}
                    className={clsx(
                      'flex-1 px-4 py-3 rounded-lg border-2 transition-all',
                      {
                        'border-primary-600 bg-primary-50': hasHomeOffice === false,
                        'border-gray-200 hover:border-gray-300': hasHomeOffice !== false,
                      }
                    )}
                  >
                    Nein
                  </button>
                </div>
              </div>
              
              {/* Years Lived */}
              <div>
                <p className="text-sm text-gray-700 mb-3">
                  Wie lange wohnen Sie bereits dort?
                </p>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={yearsLived}
                  onChange={(e) => setYearsLived(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Neu</span>
                  <span className="font-semibold text-primary-600">
                    {yearsLived === 0 ? 'Neu' : yearsLived === 15 ? '15+ Jahre' : `${yearsLived} Jahre`}
                  </span>
                  <span>15+ Jahre</span>
                </div>
              </div>
              
              {/* Special Items */}
              <div>
                <p className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Haben Sie Besonderheiten?
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {specialItemsList.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => toggleSpecialItem(item.value)}
                      className={clsx(
                        'px-3 py-2 rounded-lg border-2 transition-all text-sm',
                        {
                          'border-primary-600 bg-primary-50': specialItems.includes(item.value),
                          'border-gray-200 hover:border-gray-300': !specialItems.includes(item.value),
                        }
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Help Text */}
        {canProceed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex gap-3">
              <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Wie funktioniert das?</p>
                <p>
                  Unsere smarte Technologie nutzt typische Wohnungsprofile für deutsche Haushalte
                  und erstellt automatisch eine detaillierte Schätzung. Sie können danach alles 
                  überprüfen und anpassen.
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Next Button */}
        <div className="mt-8">
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={clsx(
              'btn-primary w-full text-lg py-4 flex items-center justify-center gap-2',
              {
                'opacity-50 cursor-not-allowed': !canProceed,
              }
            )}
          >
            <Sparkles className="w-5 h-5" />
            Smarte Schätzung erstellen
            <ArrowRight className="w-5 h-5" />
          </button>
          {!canProceed && (
            <p className="text-center text-sm text-gray-500 mt-3">
              Bitte beantworten Sie mindestens die ersten 2 Fragen
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
