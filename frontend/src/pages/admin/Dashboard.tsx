/**
 * Admin Dashboard - Overview page with analytics
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, TrendingUp, Users, Euro, FileText, ArrowRight, Download } from 'lucide-react'
import { adminAPI } from '@/services/api'
import type { Quote } from '@/types'

interface Analytics {
  period_days: number
  total_quotes: number
  quotes_by_status: Record<string, number>
  average_quote_value: number
  total_revenue: number
  conversion_rate: number
  average_volume_m3: number
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [recentQuotes, setRecentQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      const [analyticsData, quotesData] = await Promise.all([
        adminAPI.getAnalytics(30),
        adminAPI.getQuotes({ limit: 10 }),
      ])
      setAnalytics(analyticsData)
      setRecentQuotes(quotesData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setLoading(false)
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">MoveMaster Admin</p>
            </div>
            <nav className="flex gap-4">
              <Link
                to="/admin/quotes"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Alle Angebote
              </Link>
              <Link
                to="/admin/pricing"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Preiskonfiguration
              </Link>
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Zum Rechner
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<FileText className="w-6 h-6" />}
            label="Angebote (30 Tage)"
            value={analytics?.total_quotes || 0}
            color="blue"
          />
          <StatCard
            icon={<Euro className="w-6 h-6" />}
            label="Durchschnittlicher Wert"
            value={`€${Math.round(analytics?.average_quote_value || 0)}`}
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Conversion Rate"
            value={`${analytics?.conversion_rate || 0}%`}
            color="purple"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Gesamtumsatz"
            value={`€${Math.round(analytics?.total_revenue || 0)}`}
            color="orange"
          />
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Angebote nach Status
            </h2>
            <div className="space-y-3">
              {analytics?.quotes_by_status && Object.entries(analytics.quotes_by_status).map(([status, count]) => (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {translateStatus(status)}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${(count / (analytics?.total_quotes || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Wichtige Kennzahlen
            </h2>
            <div className="space-y-4">
              <MetricRow
                label="Durchschn. Volumen"
                value={`${analytics?.average_volume_m3.toFixed(1) || 0} m³`}
              />
              <MetricRow
                label="Erfolgreich abgeschlossen"
                value={analytics?.quotes_by_status?.accepted || 0}
              />
              <MetricRow
                label="In Bearbeitung"
                value={analytics?.quotes_by_status?.sent || 0}
              />
              <MetricRow
                label="Entwürfe"
                value={analytics?.quotes_by_status?.draft || 0}
              />
            </div>
          </div>
        </div>
        
        {/* Recent Quotes */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Neueste Angebote
            </h2>
            <Link
              to="/admin/quotes"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
            >
              Alle anzeigen
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kunde
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Von → Nach
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Preis
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">
                        {quote.customer_name || quote.customer_email}
                      </div>
                      <div className="text-gray-500 text-xs">{quote.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {quote.origin_address.postal_code} → {quote.destination_address.postal_code}
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
                      <button
                        onClick={() => handleDownloadPDF(quote.id)}
                        className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                        title="PDF Angebot herunterladen"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

// Helper Components
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }
  
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full ${colors[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-orange-100 text-orange-700',
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
      {translateStatus(status)}
    </span>
  )
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    draft: 'Entwurf',
    sent: 'Gesendet',
    accepted: 'Akzeptiert',
    rejected: 'Abgelehnt',
    expired: 'Abgelaufen',
  }
  return translations[status] || status
}
