/**
 * Step indicator component showing progress through the calculator
 */
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import clsx from 'clsx'

interface StepWizardProps {
  currentStep: number
}

const steps = [
  { number: 1, label: 'Schnellschätzung' },
  { number: 2, label: 'Profil-Fragen' },
  { number: 3, label: 'Volumen-Schätzung' },
  { number: 4, label: 'Services' },
  { number: 5, label: 'Inventar' },
  { number: 6, label: 'Kontakt' },
]

export default function StepWizard({ currentStep }: StepWizardProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step circle */}
            <div className="relative flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: currentStep === step.number ? 1.1 : 1,
                }}
                className={clsx(
                  'w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg transition-colors duration-300',
                  {
                    'bg-primary-600 text-white': currentStep === step.number,
                    'bg-primary-500 text-white': currentStep > step.number,
                    'bg-gray-200 text-gray-500': currentStep < step.number,
                  }
                )}
              >
                {currentStep > step.number ? (
                  <Check className="w-6 h-6" />
                ) : (
                  step.number
                )}
              </motion.div>
              <span
                className={clsx(
                  'mt-2 text-sm font-medium transition-colors duration-300 absolute top-14 whitespace-nowrap',
                  {
                    'text-primary-600': currentStep === step.number,
                    'text-primary-500': currentStep > step.number,
                    'text-gray-500': currentStep < step.number,
                  }
                )}
              >
                {step.label}
              </span>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-4 relative">
                <div className="absolute inset-0 bg-gray-200 rounded" />
                <motion.div
                  initial={false}
                  animate={{
                    width: currentStep > step.number ? '100%' : '0%',
                  }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-primary-500 rounded"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
