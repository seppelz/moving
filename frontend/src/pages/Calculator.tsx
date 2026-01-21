/**
 * Main Calculator Page - The heart of MoveMaster
 * Implements 4-step wizard with smart profile-based flow
 */
import { useCalculatorStore } from '@/store/calculatorStore'
import StepWizard from '@/components/calculator/StepWizard'
import StepInstant from '@/components/calculator/StepInstant'
import StepSmartProfile from '@/components/calculator/StepSmartProfile'
import StepSmartPreview from '@/components/calculator/StepSmartPreview'
import StepServices from '@/components/calculator/StepServices'
import StepContact from '@/components/calculator/StepContact'

export default function Calculator() {
  const { step, useSmartMode } = useCalculatorStore((state) => ({
    step: state.step,
    useSmartMode: state.useSmartMode,
  }))
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">MoveMaster</h1>
          <p className="text-gray-600 mt-1">Ihr Umzug, intelligent vereinfacht</p>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StepWizard currentStep={step} />
        
        <div className="mt-8">
          {step === 1 && <StepInstant />}
          {step === 2 && <StepSmartProfile />}
          {step === 3 && <StepSmartPreview />}
          {step === 4 && <StepServices />}
          {step === 5 && <StepContact />}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="mt-20 bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">MoveMaster</h3>
              <p className="text-gray-400">
                Transparente Umzugskosten in Sekunden.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Kontakt</h3>
              <p className="text-gray-400">
                Email: info@movemaster.de<br />
                Tel: +49 30 1234 5678
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Rechtliches</h3>
              <p className="text-gray-400">
                Impressum | Datenschutz | AGB
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 MoveMaster. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
