/**
 * Quote Detail Page - Full quote view with pricing breakdown
 */
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Download, Mail, Edit, Package, MapPin, Users,
  Clock, Euro, TrendingUp, FileText, Calculator, CheckCircle,
  AlertCircle, XCircle, Loader
} from 'lucide-react'
import { adminAPI } from '@/services/api'
import type { Quote } from '@/types'
import clsx from 'clsx'

interface PricingBreakdown {
  quote_id: string
  breakdown: {
    volume_cost: { min: number; max: number }
    distance_cost: { min: number; max: number }
    labor_cost: { min: number; max: number }
    floor_surcharge: number
    services_cost: { min: number; max: number }
  }
  configuration_used: {
    base_rate_m3: string
    rate_km_near: string
    rate_km_far: string
    hourly_labor: string
    min_movers: number
    floor_surcharge: string
    hvz_permit: string
    kitchen_assembly: string
    external_lift: string
  }
  quote_details: {
    volume_m3: number
    distance_km: number
    estimated_hours: number
    origin_floor: number
    destination_floor: number
    origin_has_elevator: boolean
    destination_has_elevator: boolean
    services_enabled: string[]
  }
}

export default function QuoteDetail() {
  const { quoteId } = useParams<{ quoteId: string }>()
  const navigate = useNavigate()
  
  const [quote, setQuote] = useState<Quote | null>(null)
  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (quoteId) {
      loadQuoteDetails()
    }
  }, [quoteId])
  
  const loadQuoteDetails = async () => {
    if (!quoteId) return
    
    setLoading(true)
    try {
      const [quoteData, breakdownData] = await Promise.all([
        adminAPI.getQuote(quoteId),
        adminAPI.getQuoteBreakdown(quoteId),
      ])
      setQuote(quoteData)
      setBreakdown(breakdownData)
      setError(null)
    } catch (err: any) {
      console.error('Failed to load quote details:', err)
      setError(err.response?.data?.detail || 'Failed to load quote')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDownloadPDF = async () => {
    if (!quoteId) return
    try {
      await adminAPI.downloadQuotePDF(quoteId)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Fehler beim Erstellen des PDFs')
    }
  }
  
  const handleStatusChange = async (newStatus: string) => {
    if (!quoteId) return
    try {
      await adminAPI.updateQuoteStatus(quoteId, newStatus)
      await loadQuoteDetails()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Fehler beim Aktualisieren des Status')
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Lade Angebotsdetails...</p>
        </div>
      </div>
    )
  }
  
  if (error || !quote || !breakdown) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              to="/admin/quotes"
              className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Zurück zu Angeboten
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Fehler</h2>
            <p className="text-gray-600 mb-4">{error || 'Angebot nicht gefunden'}</p>
            <button onClick={() => navigate('/admin/quotes')} className="btn-primary">
              Zurück zur Übersicht
            </button>
          </div>
        </main>
      </div>
    )
  }
  
  const totalMin = Number(quote.min_price)
  const totalMax = Number(quote.max_price)
  const avgPrice = (totalMin + totalMax) / 2
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/admin/quotes"
              className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Zurück zu Angeboten
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPDF}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                PDF herunterladen
              </button>
              <button className="btn-secondary inline-flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Per E-Mail senden
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Angebot #{quote.id.slice(0, 8)}
              </h1>
              <p className="text-gray-600 mt-1">
                Erstellt am {new Date(quote.created_at).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            {/* Status Selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Status:</span>
              <select
                value={quote.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={clsx(
                  "px-4 py-2 rounded-lg font-medium border-2 cursor-pointer",
                  {
                    'bg-green-50 border-green-200 text-green-700': quote.status === 'accepted',
                    'bg-blue-50 border-blue-200 text-blue-700': quote.status === 'sent',
                    'bg-red-50 border-red-200 text-red-700': quote.status === 'rejected',
                    'bg-gray-50 border-gray-200 text-gray-700': quote.status === 'draft',
                    'bg-orange-50 border-orange-200 text-orange-700': quote.status === 'expired',
                  }
                )}
              >
                <option value="draft">Entwurf</option>
                <option value="sent">Gesendet</option>
                <option value="accepted">Akzeptiert</option>
                <option value="rejected">Abgelehnt</option>
                <option value="expired">Abgelaufen</option>
              </select>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Summary Card */}
            <div className="card bg-gradient-to-br from-primary-600 to-purple-600 text-white">
              <div className="text-center">
                <div className="text-sm font-medium opacity-90 mb-2">Angebotspreis</div>
                <div className="text-5xl font-bold mb-2">
                  €{totalMin.toLocaleString('de-DE')} - €{totalMax.toLocaleString('de-DE')}
                </div>
                <div className="text-sm opacity-80">
                  Durchschnitt: €{avgPrice.toLocaleString('de-DE')} inkl. MwSt.
                </div>
              </div>
            </div>
            
            {/* Customer Information */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                Kundendaten
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Name" value={quote.customer_name || 'Nicht angegeben'} />
                <InfoRow label="E-Mail" value={quote.customer_email} />
                <InfoRow label="Telefon" value={quote.customer_phone || 'Nicht angegeben'} />
              </div>
            </div>
            
            {/* Move Details */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                Umzugsdetails
              </h2>
              
              <div className="space-y-4">
                {/* Origin */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Von (Auszug)</div>
                  <div className="font-semibold text-gray-900">
                    {quote.origin_address.postal_code} {quote.origin_address.city}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Etage: {breakdown.quote_details.origin_floor}. Stock
                    {breakdown.quote_details.origin_has_elevator ? ' (mit Aufzug)' : ' (ohne Aufzug)'}
                  </div>
                </div>
                
                {/* Destination */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Nach (Einzug)</div>
                  <div className="font-semibold text-gray-900">
                    {quote.destination_address.postal_code} {quote.destination_address.city}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Etage: {breakdown.quote_details.destination_floor}. Stock
                    {breakdown.quote_details.destination_has_elevator ? ' (mit Aufzug)' : ' (ohne Aufzug)'}
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <StatBox
                    icon={<MapPin className="w-5 h-5" />}
                    label="Entfernung"
                    value={`${Number(quote.distance_km).toFixed(0)} km`}
                  />
                  <StatBox
                    icon={<Package className="w-5 h-5" />}
                    label="Volumen"
                    value={`${Number(quote.volume_m3).toFixed(1)} m³`}
                  />
                  <StatBox
                    icon={<Clock className="w-5 h-5" />}
                    label="Geschätzte Dauer"
                    value={`${Number(quote.estimated_hours).toFixed(1)} Std.`}
                  />
                </div>
              </div>
            </div>
            
            {/* Inventory */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-600" />
                Inventar ({quote.inventory.length} Artikel)
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Artikel
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Menge
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Volumen/Stück
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Gesamt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quote.inventory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.name}
                          {item.category && (
                            <span className="ml-2 text-xs text-gray-500">({item.category})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-700">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">
                          {Number(item.volume_m3).toFixed(2)} m³
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                          {(Number(item.volume_m3) * item.quantity).toFixed(2)} m³
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-4 py-3 text-sm text-gray-900" colSpan={3}>
                        Gesamtvolumen
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-primary-600">
                        {Number(quote.volume_m3).toFixed(2)} m³
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Services */}
            {quote.services.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary-600" />
                  Zusätzliche Services
                </h2>
                
                <div className="space-y-3">
                  {quote.services.map((service, idx) => (
                    service.enabled && (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {translateService(service.service_type)}
                          </div>
                          {service.metadata && Object.keys(service.metadata).length > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                              {Object.entries(service.metadata).map(([key, value]) => (
                                <span key={key} className="mr-3">
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Pricing Breakdown */}
          <div className="space-y-6">
            {/* Pricing Breakdown */}
            <div className="card sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary-600" />
                Preisberechnung
              </h2>
              
              <div className="space-y-3">
                {/* Volume Cost */}
                <BreakdownRow
                  label="Volumenkosten"
                  tooltip={`${breakdown.quote_details.volume_m3.toFixed(1)} m³ × ${breakdown.configuration_used.base_rate_m3}`}
                  minValue={breakdown.breakdown.volume_cost.min}
                  maxValue={breakdown.breakdown.volume_cost.max}
                />
                
                {/* Distance Cost */}
                <BreakdownRow
                  label="Kilometerkosten"
                  tooltip={`${breakdown.quote_details.distance_km.toFixed(0)} km × ${breakdown.configuration_used.rate_km_near}`}
                  minValue={breakdown.breakdown.distance_cost.min}
                  maxValue={breakdown.breakdown.distance_cost.max}
                />
                
                {/* Labor Cost */}
                <BreakdownRow
                  label="Arbeitskosten"
                  tooltip={`${breakdown.quote_details.estimated_hours.toFixed(1)} Std. × ${breakdown.configuration_used.min_movers} Helfer × ${breakdown.configuration_used.hourly_labor}`}
                  minValue={breakdown.breakdown.labor_cost.min}
                  maxValue={breakdown.breakdown.labor_cost.max}
                />
                
                {/* Floor Surcharge */}
                {breakdown.breakdown.floor_surcharge > 0 && (
                  <BreakdownRow
                    label="Etagenzuschlag"
                    tooltip={breakdown.configuration_used.floor_surcharge}
                    minValue={breakdown.breakdown.floor_surcharge}
                    maxValue={breakdown.breakdown.floor_surcharge}
                    highlight
                  />
                )}
                
                {/* Services Cost */}
                {breakdown.breakdown.services_cost.min > 0 && (
                  <BreakdownRow
                    label="Zusatzleistungen"
                    tooltip={breakdown.quote_details.services_enabled.join(', ')}
                    minValue={breakdown.breakdown.services_cost.min}
                    maxValue={breakdown.breakdown.services_cost.max}
                    highlight
                  />
                )}
                
                {/* Total */}
                <div className="pt-3 border-t-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">Gesamtpreis</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">
                        €{totalMin.toLocaleString('de-DE')} - €{totalMax.toLocaleString('de-DE')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">inkl. MwSt.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Configuration Details */}
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Verwendete Konfiguration
              </h2>
              
              <div className="space-y-2 text-xs">
                <ConfigRow label="Basisrate/m³" value={breakdown.configuration_used.base_rate_m3} />
                <ConfigRow label="Rate Nahbereich" value={breakdown.configuration_used.rate_km_near} />
                <ConfigRow label="Rate Fernbereich" value={breakdown.configuration_used.rate_km_far} />
                <ConfigRow label="Stundenlohn" value={breakdown.configuration_used.hourly_labor} />
                <ConfigRow label="Min. Helfer" value={String(breakdown.configuration_used.min_movers)} />
                <ConfigRow label="Etagenzuschlag" value={breakdown.configuration_used.floor_surcharge} />
                <ConfigRow label="HVZ Genehmigung" value={breakdown.configuration_used.hvz_permit} />
                <ConfigRow label="Küchenmontage" value={breakdown.configuration_used.kitchen_assembly} />
                <ConfigRow label="Außenaufzug" value={breakdown.configuration_used.external_lift} />
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  to="/admin/pricing"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Preiskonfiguration bearbeiten
                </Link>
              </div>
            </div>
            
            {/* Move Complexity Indicators */}
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Komplexitätsindikatoren
              </h2>
              
              <div className="space-y-2">
                <ComplexityIndicator
                  label="Treppensituation"
                  value={
                    !breakdown.quote_details.origin_has_elevator || !breakdown.quote_details.destination_has_elevator
                      ? 'Erhöhte Komplexität'
                      : 'Standard'
                  }
                  isComplex={!breakdown.quote_details.origin_has_elevator || !breakdown.quote_details.destination_has_elevator}
                />
                <ComplexityIndicator
                  label="Volumengröße"
                  value={
                    breakdown.quote_details.volume_m3 > 60
                      ? 'Großer Umzug'
                      : breakdown.quote_details.volume_m3 < 20
                      ? 'Kleiner Umzug'
                      : 'Standard-Umzug'
                  }
                  isComplex={breakdown.quote_details.volume_m3 > 60}
                />
                <ComplexityIndicator
                  label="Entfernung"
                  value={
                    breakdown.quote_details.distance_km > 100
                      ? 'Fernumzug'
                      : breakdown.quote_details.distance_km < 30
                      ? 'Nahbereich'
                      : 'Mittlere Distanz'
                  }
                  isComplex={breakdown.quote_details.distance_km > 100}
                />
                <ComplexityIndicator
                  label="Zusatzservices"
                  value={`${breakdown.quote_details.services_enabled.length} Service(s)`}
                  isComplex={breakdown.quote_details.services_enabled.length > 2}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Helper Components
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="font-medium text-gray-900">{value}</div>
    </div>
  )
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2 text-primary-600">
        {icon}
      </div>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="text-sm font-bold text-gray-900">{value}</div>
    </div>
  )
}

function BreakdownRow({
  label,
  tooltip,
  minValue,
  maxValue,
  highlight = false
}: {
  label: string
  tooltip: string
  minValue: number
  maxValue: number
  highlight?: boolean
}) {
  return (
    <div className={clsx('p-3 rounded-lg', {
      'bg-blue-50 border border-blue-200': highlight,
      'bg-gray-50': !highlight
    })}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">
          €{minValue.toLocaleString('de-DE')} - €{maxValue.toLocaleString('de-DE')}
        </span>
      </div>
      <div className="text-xs text-gray-500">{tooltip}</div>
    </div>
  )
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-600">{label}:</span>
      <span className="font-mono text-gray-900">{value}</span>
    </div>
  )
}

function ComplexityIndicator({
  label,
  value,
  isComplex
}: {
  label: string
  value: string
  isComplex: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-gray-600">{label}</span>
      <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', {
        'bg-orange-100 text-orange-700': isComplex,
        'bg-green-100 text-green-700': !isComplex
      })}>
        {value}
      </span>
    </div>
  )
}

function translateService(serviceType: string): string {
  const translations: Record<string, string> = {
    packing: 'Packservice',
    disassembly: 'Möbelmontage',
    hvz_permit: 'Halteverbotszone (HVZ)',
    kitchen_assembly: 'Küchenmontage',
    external_lift: 'Außenaufzug (Möbellift)',
  }
  return translations[serviceType] || serviceType
}
