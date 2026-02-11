import { Routes, Route, Navigate } from 'react-router-dom'
import Calculator from './pages/Calculator'
import AdminDashboard from './pages/admin/Dashboard'
import AdminQuotes from './pages/admin/Quotes'
import QuoteDetail from './pages/admin/QuoteDetail'
import PricingConfig from './pages/admin/PricingConfig'
import AdminLogin from './pages/admin/Login'
import { authAPI } from './services/api'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authAPI.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />
  }
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Calculator />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/quotes" element={<ProtectedRoute><AdminQuotes /></ProtectedRoute>} />
      <Route path="/admin/quotes/:quoteId" element={<ProtectedRoute><QuoteDetail /></ProtectedRoute>} />
      <Route path="/admin/pricing" element={<ProtectedRoute><PricingConfig /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
