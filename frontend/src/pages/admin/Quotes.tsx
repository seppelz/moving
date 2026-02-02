/**
 * Admin Quotes Page - List and manage all quotes
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Download, ChevronLeft, FileText, Eye, Send, Check } from 'lucide-react'
import { adminAPI } from '@/services/api'
import type { Quote, QuoteStatus } from '@/types'

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | ''>('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadQuotes()
  }, [statusFilter])

  const loadQuotes = async () => {
    setLoading(true)
    try {
      const data = await adminAPI.getQuotes({
        status: statusFilter || undefined,
        limit: 100,
      })
      setQuotes(data)
    } catch (error) {
      console.error('Failed to load quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (quoteId: string, newStatus: string) => {
    try {
      await adminAPI.updateQuoteStatus(quoteId, newStatus)
      // Reload quotes
      loadQuotes()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleDownloadPDF = async (quoteId: string) => {
    try {
      await adminAPI.downloadQuotePDF(quoteId)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Fehler beim Erstellen des PDFs')
    }
  }

  const filteredQuotes = quotes.filter((quote) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      quote.customer_email.toLowerCase().includes(search) ||
      quote.customer_name?.toLowerCase().includes(search) ||
      quote.origin_address.postal_code.includes(search) ||
      quote.destination_address.postal_code.includes(search)
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                to="/admin"
                className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2 mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Alle Angebote</h1>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Suche nach E-Mail, Name oder PLZ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="input-field"
              >
                <option value="">Alle Status</option>
                <option value="draft">Entwurf</option>
                <option value="sent">Gesendet</option>
                <option value="accepted">Akzeptiert</option>
                <option value="rejected">Abgelehnt</option>
                <option value="expired">Abgelaufen</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quotes Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Keine Angebote gefunden
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Kunde
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Route
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Preis
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">
                        {quote.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">
                          {quote.customer_name || quote.customer_email}
                        </div>
                        <div className="text-gray-500 text-xs">{quote.customer_email}</div>
                        {quote.customer_phone && (
                          <div className="text-gray-500 text-xs">{quote.customer_phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{quote.origin_address.postal_code}</div>
                        <div className="text-gray-500">↓</div>
                        <div>{quote.destination_address.postal_code}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{Number(quote.distance_km).toFixed(0)} km</div>
                        <div className="text-gray-500 text-xs">{Number(quote.volume_m3).toFixed(1)} m³</div>
                        <div className="text-gray-500 text-xs">{quote.inventory.length} Artikel</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        €{Math.round(Number(quote.min_price))} - €{Math.round(Number(quote.max_price))}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <StatusBadge status={quote.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(quote.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Primary Context Actions */}
                          {quote.status === 'draft' && (
                            <button
                              onClick={() => handleStatusChange(quote.id, 'sent')}
                              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 text-xs bg-blue-50 px-2 py-1 rounded"
                              title="Dieses Angebot an den Kunden per E-Mail senden"
                            >
                              <Send className="w-3 h-3" />
                              An Kunden senden
                            </button>
                          )}
                          {quote.status === 'sent' && (
                            <button
                              onClick={() => handleStatusChange(quote.id, 'accepted')}
                              className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1 text-xs bg-green-50 px-2 py-1 rounded"
                            >
                              <Check className="w-3 h-3" />
                              Akzeptiert
                            </button>
                          )}

                          {/* Secondary Tools */}
                          <div className="h-4 w-px bg-gray-200 mx-1"></div>

                          <button
                            onClick={() => handleDownloadPDF(quote.id)}
                            className="text-gray-600 hover:text-primary-600 font-medium inline-flex items-center gap-1 text-xs"
                            title="PDF herunterladen"
                          >
                            <FileText className="w-3 h-3" />
                            PDF
                          </button>
                          <Link
                            to={`/admin/quotes/${quote.id}`}
                            className="text-gray-600 hover:text-gray-900 font-medium inline-flex items-center gap-1 text-xs"
                          >
                            <Eye className="w-3 h-3" />
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-orange-100 text-orange-700',
  }

  const translations: Record<string, string> = {
    draft: 'Entwurf',
    sent: 'Gesendet',
    accepted: 'Akzeptiert',
    rejected: 'Abgelehnt',
    expired: 'Abgelaufen',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
      {translations[status] || status}
    </span>
  )
}
