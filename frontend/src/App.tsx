import { Routes, Route } from 'react-router-dom'
import Calculator from './pages/Calculator'
import AdminDashboard from './pages/admin/Dashboard'
import AdminQuotes from './pages/admin/Quotes'
import QuoteDetail from './pages/admin/QuoteDetail'
import PricingConfig from './pages/admin/PricingConfig'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Calculator />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/quotes" element={<AdminQuotes />} />
      <Route path="/admin/quotes/:quoteId" element={<QuoteDetail />} />
      <Route path="/admin/pricing" element={<PricingConfig />} />
    </Routes>
  )
}

export default App
