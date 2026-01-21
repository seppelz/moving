/**
 * Step 4: Contact & Submit
 * Final step to capture customer info and submit quote
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, User, ArrowLeft, CheckCircle, Loader } from 'lucide-react'
import { useCalculatorStore } from '@/store/calculatorStore'
import { quoteAPI } from '@/services/api'
import type { Quote } from '@/types'

export default function StepContact() {
  const {
    customerEmail,
    customerPhone,
    customerName,
    originPostalCode,
    destinationPostalCode,
    originFloor,
    destinationFloor,
    originHasElevator,
    destinationHasElevator,
    inventory,
    services,
    quote,
    setCustomerEmail,
    setCustomerPhone,
    setCustomerName,
    setStep,
  } = useCalculatorStore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedQuote, setSubmittedQuote] = useState<Quote | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerEmail) {
      setError('Bitte geben Sie eine E-Mail-Adresse an')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const submittedQuoteData = await quoteAPI.submitQuote({
        customer_email: customerEmail,
        customer_phone: customerPhone || undefined,
        customer_name: customerName || undefined,
        origin: {
          address: '',
          postal_code: originPostalCode,
          city: '',
          floor: originFloor,
          has_elevator: originHasElevator,
        },
        destination: {
          address: '',
          postal_code: destinationPostalCode,
          city: '',
          floor: destinationFloor,
          has_elevator: destinationHasElevator,
        },
        inventory,
        services,
      })
      
      setSubmittedQuote(submittedQuoteData)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Fehler beim Absenden. Bitte versuchen Sie es erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (submitted && submittedQuote) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="card text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Vielen Dank!
          </h2>
          <p className="text-gray-600 mb-8">
            Ihr Angebot wurde erfolgreich erstellt und an {customerEmail} gesendet.
          </p>
          
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-xl mb-6">
            <div className="text-sm opacity-90 mb-2">Ihr Angebot</div>
            <div className="text-4xl font-bold mb-2">
              €{Math.round(submittedQuote.min_price)} - €{Math.round(submittedQuote.max_price)}
            </div>
            <div className="text-sm opacity-80">
              Angebots-ID: {submittedQuote.id.slice(0, 8)}...
            </div>
          </div>
          
          <div className="text-left bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Nächste Schritte:</h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  1
                </span>
                <span>Sie erhalten in wenigen Minuten eine Bestätigungs-E-Mail</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  2
                </span>
                <span>Unser Team prüft Ihre Anfrage und erstellt ein detailliertes Angebot</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  3
                </span>
                <span>Wir kontaktieren Sie innerhalb von 24 Stunden</span>
              </li>
            </ol>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            Neues Angebot erstellen
          </button>
        </div>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl mx-auto"
    >
      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Fast geschafft!
          </h2>
          <p className="text-gray-600">
            Wohin sollen wir Ihr personalisiertes Angebot senden?
          </p>
        </div>
        
        {/* Quote Summary */}
        {quote && (
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-xl mb-6">
            <div className="text-sm opacity-90 mb-2">Ihr Angebot</div>
            <div className="text-4xl font-bold mb-2">
              €{Math.round(Number(quote.min_price))} - €{Math.round(Number(quote.max_price))}
            </div>
            <div className="text-sm opacity-80">
              {Number(quote.distance_km).toFixed(0)} km • {Number(quote.volume_m3).toFixed(1)} m³ •
              ~{Number(quote.estimated_hours).toFixed(1)} Std.
            </div>
          </div>
        )}
        
        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              E-Mail-Adresse *
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="ihre.email@beispiel.de"
              className="input-field"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Telefonnummer (optional)
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+49 30 1234 5678"
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Name (optional)
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ihr Name"
              className="input-field"
            />
          </div>
          
          {/* Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-700">
                Ja, ich möchte zurückgerufen werden
              </span>
            </label>
            
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-700">
                Umzugstipps und Checkliste per E-Mail erhalten
              </span>
            </label>
          </div>
          
          {/* Privacy Notice */}
          <p className="text-xs text-gray-500">
            Mit dem Absenden akzeptieren Sie unsere{' '}
            <a href="#" className="text-primary-600 hover:underline">
              Datenschutzerklärung
            </a>
            . Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.
          </p>
          
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
          
          {/* Navigation */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={isSubmitting}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Zurück
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !customerEmail}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Angebot anfordern
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
