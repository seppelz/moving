/**
 * Quote Detail Page - Full quote view with pricing breakdown
 */
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Download, Mail, Edit, Package, MapPin, Users,
  Clock, FileText, Calculator, CheckCircle,
  AlertCircle, Loader, Send, Check, X, Edit2, Save, XCircle
} from 'lucide-react'
import { adminAPI, quoteAPI } from '@/services/api'
import type { Quote } from '@/types'
import clsx from 'clsx'
import TruckVisualizer from '@/components/calculator/TruckVisualizer'

interface PricingBreakdown {
  quote_id: string
  breakdown: {
    volume_cost: { min: number; max: number }
    distance_cost: { min: number; max: number }
    labor_cost: { min: number; max: number }
    floor_surcharge: { min: number; max: number } | number
    services_cost: { min: number; max: number }
    man_hours: number
    crew_size: number
    travel_time: number
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
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit states
  const [editData, setEditData] = useState({
    min_price: 0,
    max_price: 0,
    volume_m3: 0,
    is_fixed_price: false
  })

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
      setEditData({
        min_price: Number(quoteData.min_price),
        max_price: Number(quoteData.max_price),
        volume_m3: Number(quoteData.volume_m3),
        is_fixed_price: quoteData.is_fixed_price || false
      })
      setError(null)
    } catch (err: any) {
      console.error('Failed to load quote details:', err)
      setError(err.response?.data?.detail || 'Failed to load quote')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDetails = async () => {
    if (!quoteId) return
    setUpdatingStatus(true)
    try {
      // If it's a fixed price, ensure max_price matches min_price before sending
      const finalData = { ...editData }
      if (finalData.is_fixed_price) {
        finalData.max_price = finalData.min_price
      }

      await adminAPI.updateQuoteDetails(quoteId, finalData)
      await loadQuoteDetails()
      setEditMode(false)
    } catch (err) {
      console.error('Failed to update details:', err)
      alert('Fehler beim Speichern der Änderungen')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleRecalculate = async () => {
    if (!quote) return
    setUpdatingStatus(true)
    try {
      // Use existing calculate API with new volume
      const result = await quoteAPI.calculateQuote({
        origin_postal_code: quote.origin_address.postal_code,
        destination_postal_code: quote.destination_address.postal_code,
        volume_m3: editData.volume_m3,
        origin_floor: quote.origin_address.floor,
        destination_floor: quote.destination_address.floor,
        origin_has_elevator: quote.origin_address.has_elevator,
        destination_has_elevator: quote.destination_address.has_elevator,
        services: quote.services.map(s => ({
          service_type: s.service_type,
          enabled: s.enabled,
          metadata: s.metadata
        }))
      })

      setEditData({
        ...editData,
        min_price: Number(result.min_price),
        max_price: Number(result.max_price)
      })
    } catch (err) {
      console.error('Recalculation failed:', err)
      alert('Neu-Berechnung fehlgeschlagen. Bitte prüfen Sie die Eingaben.')
    } finally {
      setUpdatingStatus(false)
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
    setUpdatingStatus(true)
    try {
      await adminAPI.updateQuoteStatus(quoteId, newStatus)
      await loadQuoteDetails()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Fehler beim Aktualisieren des Status')
    } finally {
      setUpdatingStatus(false)
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
              <button
                onClick={() => handleStatusChange('sent')}
                className="btn-secondary inline-flex items-center gap-2"
              >
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

            {/* Status & Actions */}
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={handleUpdateDetails}
                      disabled={updatingStatus}
                      className="btn-primary flex items-center gap-2 !py-2 !px-4 text-sm"
                    >
                      {updatingStatus ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Speichern
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false)
                        setEditData({
                          min_price: Number(quote.min_price),
                          max_price: Number(quote.max_price),
                          volume_m3: Number(quote.volume_m3),
                          is_fixed_price: quote.is_fixed_price || false
                        })
                      }}
                      disabled={updatingStatus}
                      className="btn-secondary flex items-center gap-2 !py-2 !px-4 text-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      Abbrechen
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-primary-600 hover:bg-primary-50 font-medium rounded-lg flex items-center gap-2 py-2 px-4 text-sm transition-colors border border-primary-200"
                  >
                    <Edit2 className="w-4 h-4" />
                    Angebot bearbeiten
                  </button>
                )}

                <div className="h-8 w-px bg-gray-200 mx-1"></div>

                <select
                  value={quote.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus || editMode}
                  className={clsx(
                    "px-4 py-2 rounded-lg font-medium border-2 cursor-pointer disabled:opacity-50",
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

              {/* Contextual Action Buttons */}
              <div className="flex items-center gap-2">
                {!editMode && quote.status === 'draft' && (
                  <button
                    onClick={() => handleStatusChange('sent')}
                    disabled={updatingStatus}
                    className="btn-primary flex items-center gap-2 !py-2 !px-4 text-sm"
                  >
                    {updatingStatus ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Angebot an Kunden senden
                  </button>
                )}
                {/* ... existing buttons ... */}
                {!editMode && quote.status === 'sent' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('accepted')}
                      disabled={updatingStatus}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center gap-2 py-2 px-4 text-sm transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Akzeptiert
                    </button>
                    <button
                      onClick={() => handleStatusChange('rejected')}
                      disabled={updatingStatus}
                      className="bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-lg flex items-center gap-2 py-2 px-4 text-sm transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Abgelehnt
                    </button>
                  </>
                )}
                {!editMode && quote.status === 'accepted' && (
                  <div className="flex items-center gap-2 text-green-600 font-medium text-sm bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                    <CheckCircle className="w-4 h-4" />
                    Umzug ist bestätigt
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Summary Card */}
            <div className={clsx(
              "card text-white relative overflow-hidden",
              editData.is_fixed_price
                ? "bg-gradient-to-br from-green-600 to-emerald-700"
                : "bg-gradient-to-br from-primary-600 to-purple-600"
            )}>
              {editMode ? (
                <div className="space-y-4">
                  <div className="text-center font-medium opacity-90 mb-2">Preise & Konditionen</div>

                  {editData.is_fixed_price ? (
                    <div>
                      <label className="block text-xs opacity-80 mb-1 text-center">Verbindlicher Festpreis (€)</label>
                      <input
                        type="number"
                        value={editData.min_price}
                        onChange={(e) => setEditData({ ...editData, min_price: Number(e.target.value), max_price: Number(e.target.value) })}
                        className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white font-bold text-center text-xl"
                        placeholder="0.00"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs opacity-80 mb-1">Min (€)</label>
                        <input
                          type="number"
                          value={editData.min_price}
                          onChange={(e) => setEditData({ ...editData, min_price: Number(e.target.value) })}
                          className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white font-bold"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs opacity-80 mb-1">Max (€)</label>
                        <input
                          type="number"
                          value={editData.max_price}
                          onChange={(e) => setEditData({ ...editData, max_price: Number(e.target.value) })}
                          className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white font-bold"
                        />
                      </div>
                    </div>
                  )}

                  <label className="flex items-center justify-center gap-2 cursor-pointer bg-white/10 py-2 rounded-lg hover:bg-white/20 transition-colors">
                    <input
                      type="checkbox"
                      checked={editData.is_fixed_price}
                      onChange={(e) => setEditData({ ...editData, is_fixed_price: e.target.checked })}
                      className="w-4 h-4 rounded text-green-600"
                    />
                    <span className="text-sm font-semibold">Festpreis-Angebot</span>
                  </label>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-sm font-medium opacity-90 mb-2">
                    {quote.is_fixed_price ? 'Verbindlicher Festpreis' : 'Angebotspreis (Schätzung)'}
                  </div>
                  <div className="text-5xl font-bold mb-2">
                    {quote.is_fixed_price
                      ? `€${totalMin.toLocaleString('de-DE')}`
                      : `€${totalMin.toLocaleString('de-DE')} - €${totalMax.toLocaleString('de-DE')}`
                    }
                  </div>
                  <div className="text-sm opacity-80">
                    {quote.is_fixed_price
                      ? 'Garantiert ohne versteckte Kosten'
                      : `Durchschnitt: €${avgPrice.toLocaleString('de-DE')} inkl. MwSt.`
                    }
                  </div>
                </div>
              )}
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
                    value={editMode ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="number"
                          value={editData.volume_m3}
                          onChange={(e) => setEditData({ ...editData, volume_m3: Number(e.target.value) })}
                          className="w-20 bg-white border border-gray-200 rounded px-2 py-1 text-center text-sm font-semibold"
                        />
                        <button
                          onClick={handleRecalculate}
                          disabled={updatingStatus}
                          className="text-[10px] text-primary-600 hover:underline flex items-center justify-center gap-1"
                          title="Preis basierend auf neuem Volumen berechnen"
                        >
                          {updatingStatus ? <Loader className="w-2 h-2 animate-spin" /> : <Calculator className="w-2 h-2" />}
                          Berechnen
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <span>{Number(quote.volume_m3).toFixed(1)} m³</span>
                        <TruckVisualizer
                          totalVolume={Number(quote.volume_m3)}
                          className="!p-2 !bg-white border border-gray-100 shadow-sm min-w-[120px]"
                          showLabels={false}
                        />
                      </div>
                    )}
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
                                  {translateMetadataKey(key)}: {
                                    typeof value === 'boolean'
                                      ? (value ? 'Ja' : 'Nein')
                                      : (key === 'kitchen_meters' ? `${value}m` : String(value))
                                  }
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
                {(() => {
                  const fs = breakdown.breakdown.floor_surcharge
                  const fsMin = typeof fs === 'object' ? fs.min : fs
                  const fsMax = typeof fs === 'object' ? fs.max : fs
                  return fsMax > 0 ? (
                    <BreakdownRow
                      label="Etagenzuschlag"
                      tooltip={breakdown.configuration_used.floor_surcharge}
                      minValue={fsMin}
                      maxValue={fsMax}
                      highlight
                    />
                  ) : null
                })()}

                {/* Services Cost */}
                {breakdown.breakdown.services_cost.min > 0 && (
                  <BreakdownRow
                    label="Zusatzleistungen"
                    tooltip={breakdown.quote_details.services_enabled.map(t => translateService(t)).join(', ')}
                    minValue={breakdown.breakdown.services_cost.min}
                    maxValue={breakdown.breakdown.services_cost.max}
                    highlight
                  />
                )}

                {/* Duration Factors */}
                <div className="pt-3 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-tight">Faktor-Aufschlüsselung</h3>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                      <div className="text-gray-500 uppercase">Mannstunden</div>
                      <div className="font-bold text-gray-900">{breakdown.breakdown.man_hours} Std.</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                      <div className="text-gray-500 uppercase">Teamgröße</div>
                      <div className="font-bold text-gray-900">{breakdown.breakdown.crew_size} Personen</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                      <div className="text-gray-500 uppercase">Arbeitszeit</div>
                      <div className="font-bold text-gray-900">{(breakdown.breakdown.man_hours / breakdown.breakdown.crew_size).toFixed(1)} Std.</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-100">
                      <div className="text-gray-500 uppercase">Fahrtzeit</div>
                      <div className="font-bold text-gray-900">{breakdown.breakdown.travel_time} Std.</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-500 italic">
                    Regel: (Mannstunden / Personen) + Fahrtzeit = Gesamtdauer ({breakdown.quote_details.estimated_hours} Std.)
                  </div>
                </div>

                {/* Total */}
                <div className="pt-3 border-t-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">Gesamtpreis</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">
                        {quote.is_fixed_price
                          ? `€${totalMin.toLocaleString('de-DE')}`
                          : `€${totalMin.toLocaleString('de-DE')} - €${totalMax.toLocaleString('de-DE')}`
                        }
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {quote.is_fixed_price ? 'Garantiert inkl. MwSt.' : 'inkl. MwSt.'}
                      </div>
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
                    (breakdown.quote_details.origin_floor > 0 && !breakdown.quote_details.origin_has_elevator) ||
                      (breakdown.quote_details.destination_floor > 0 && !breakdown.quote_details.destination_has_elevator)
                      ? 'Erhöhte Komplexität'
                      : 'Standard'
                  }
                  isComplex={
                    (breakdown.quote_details.origin_floor > 0 && !breakdown.quote_details.origin_has_elevator) ||
                    (breakdown.quote_details.destination_floor > 0 && !breakdown.quote_details.destination_has_elevator)
                  }
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

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
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
          {minValue === maxValue
            ? `€${minValue.toLocaleString('de-DE')}`
            : `€${minValue.toLocaleString('de-DE')} - €${maxValue.toLocaleString('de-DE')}`
          }
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
    cleaning: 'Endreinigung',
    waste_disposal: 'Entsorgung',
    storage: 'Einlagerung'
  }
  return translations[serviceType] || serviceType
}

function translateMetadataKey(key: string): string {
  const translations: Record<string, string> = {
    hours: 'Stunden',
    persons: 'Personen',
    meters: 'Meter',
    kitchen_meters: 'Küchenmeter',
    boxes: 'Kartons',
    floor: 'Etage',
    has_elevator: 'Aufzug vorhanden'
  }
  return translations[key] || key
}
