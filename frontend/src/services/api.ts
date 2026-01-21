/**
 * API client for MoveMaster backend
 */
import axios from 'axios'
import type {
  QuoteCalculateRequest,
  QuoteCalculateResponse,
  QuoteSubmitRequest,
  Quote,
  ItemTemplate,
  RoomTemplate
} from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const quoteAPI = {
  /**
   * Calculate instant quote (Step 1)
   */
  calculateQuote: async (data: QuoteCalculateRequest): Promise<QuoteCalculateResponse> => {
    const response = await api.post<QuoteCalculateResponse>('/api/v1/quote/calculate', data)
    return response.data
  },

  /**
   * Submit full quote (Step 4)
   */
  submitQuote: async (data: QuoteSubmitRequest): Promise<Quote> => {
    const response = await api.post<Quote>('/api/v1/quote/submit', data)
    return response.data
  },

  /**
   * Get item templates
   */
  getItemTemplates: async (category?: string): Promise<ItemTemplate[]> => {
    const response = await api.get<ItemTemplate[]>('/api/v1/quote/inventory/templates', {
      params: category ? { category } : undefined,
    })
    return response.data
  },

  /**
   * Get room templates
   */
  getRoomTemplates: async (apartmentSize?: string): Promise<RoomTemplate[]> => {
    const response = await api.get<RoomTemplate[]>('/api/v1/quote/room/templates', {
      params: apartmentSize ? { apartment_size: apartmentSize } : undefined,
    })
    return response.data
  },

  /**
   * Validate address
   */
  validateAddress: async (postalCode: string) => {
    const response = await api.post('/api/v1/quote/validate-address', null, {
      params: { postal_code: postalCode },
    })
    return response.data
  },

  /**
   * Get smart AI prediction based on profile
   */
  getSmartPrediction: async (profileData: {
    apartment_size: string
    household_type: string
    furnishing_level: string
    has_home_office?: boolean | null
    has_kids?: boolean | null
    years_lived?: number
    special_items?: string[]
  }) => {
    const response = await api.post('/api/v1/smart/smart-prediction', profileData)
    return response.data
  },

  /**
   * Apply quick adjustments to prediction
   */
  applyQuickAdjustment: async (adjustmentData: {
    profile_key: string
    furniture_level: number
    box_count: number
    has_washing_machine: boolean
    has_mounted_kitchen: boolean
    kitchen_meters: number
    has_large_plants: boolean
    bicycle_count: number
  }) => {
    const response = await api.post('/api/v1/smart/quick-adjustment', adjustmentData)
    return response.data
  },

  /**
   * Get available apartment profiles
   */
  getProfiles: async (apartmentSize?: string) => {
    const response = await api.get('/api/v1/smart/profiles', {
      params: apartmentSize ? { apartment_size: apartmentSize } : undefined,
    })
    return response.data
  },

  /**
   * Get profile details
   */
  getProfileDetails: async (profileKey: string) => {
    const response = await api.get(`/api/v1/smart/profile/${profileKey}`)
    return response.data
  },
}

export const adminAPI = {
  /**
   * Get all quotes
   */
  getQuotes: async (filters?: {
    status?: string
    company_slug?: string
    skip?: number
    limit?: number
  }): Promise<Quote[]> => {
    const response = await api.get<Quote[]>('/api/v1/admin/quotes', {
      params: filters,
    })
    return response.data
  },

  /**
   * Get single quote
   */
  getQuote: async (quoteId: string): Promise<Quote> => {
    const response = await api.get<Quote>(`/api/v1/admin/quotes/${quoteId}`)
    return response.data
  },

  /**
   * Update quote status
   */
  updateQuoteStatus: async (quoteId: string, newStatus: string) => {
    const response = await api.patch(`/api/v1/admin/quotes/${quoteId}`, null, {
      params: { new_status: newStatus },
    })
    return response.data
  },

  /**
   * Get analytics
   */
  getAnalytics: async (days: number = 30) => {
    const response = await api.get('/api/v1/admin/analytics', {
      params: { days },
    })
    return response.data
  },

  /**
   * Get pricing config
   */
  getPricingConfig: async (companySlug: string = 'default') => {
    const response = await api.get('/api/v1/admin/pricing', {
      params: { company_slug: companySlug },
    })
    return response.data
  },

  /**
   * Update pricing config
   */
  updatePricingConfig: async (companySlug: string, config: Record<string, any>) => {
    const response = await api.put('/api/v1/admin/pricing', config, {
      params: { company_slug: companySlug },
    })
    return response.data
  },

  /**
   * Generate and download PDF for a quote
   */
  downloadQuotePDF: async (quoteId: string) => {
    const response = await api.post(`/api/v1/admin/quotes/${quoteId}/pdf`, null, {
      responseType: 'blob',
    })
    
    // Create download link
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `quote_${quoteId.slice(0, 8)}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  /**
   * Get detailed pricing breakdown for a quote
   */
  getQuoteBreakdown: async (quoteId: string) => {
    const response = await api.get(`/api/v1/admin/quotes/${quoteId}/breakdown`)
    return response.data
  },
}

export default api
