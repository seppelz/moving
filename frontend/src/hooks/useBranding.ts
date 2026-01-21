/**
 * Branding hook for white-label support
 * Fetches and applies company-specific branding
 */
import { useEffect, useState } from 'react'
import api from '@/services/api'

interface Branding {
  company_name: string
  logo_url: string
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  tagline: string
  support_email: string
  support_phone: string
  address: string
  website: string
}

interface BrandingResponse {
  company: {
    id: string
    name: string
    slug: string
  }
  branding: Branding
}

const defaultBranding: Branding = {
  company_name: 'MoveMaster',
  logo_url: '/assets/logo.png',
  primary_color: '#0369a1',
  secondary_color: '#0284c7',
  accent_color: '#38bdf8',
  font_family: 'Inter, sans-serif',
  tagline: 'Ihr Umzug, vereinfacht',
  support_email: 'info@movemaster.de',
  support_phone: '+49 30 1234 5678',
  address: 'Musterstraße 123, 10115 Berlin',
  website: 'https://movemaster.de',
}

export function useBranding() {
  const [branding, setBranding] = useState<Branding>(defaultBranding)
  const [companySlug, setCompanySlug] = useState<string>('default')
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadBranding()
  }, [])
  
  const loadBranding = async () => {
    try {
      const response = await api.get<BrandingResponse>('/api/v1/branding')
      setBranding(response.data.branding)
      setCompanySlug(response.data.company.slug)
      
      // Apply CSS variables for theming
      applyBrandingStyles(response.data.branding)
    } catch (error) {
      console.error('Failed to load branding:', error)
      // Use defaults
    } finally {
      setLoading(false)
    }
  }
  
  const applyBrandingStyles = (branding: Branding) => {
    const root = document.documentElement
    
    // Apply CSS custom properties
    root.style.setProperty('--color-primary', branding.primary_color)
    root.style.setProperty('--color-secondary', branding.secondary_color)
    root.style.setProperty('--color-accent', branding.accent_color)
    root.style.setProperty('--font-family', branding.font_family)
    
    // Update page title
    document.title = `${branding.company_name} - ${branding.tagline}`
  }
  
  return {
    branding,
    companySlug,
    loading,
  }
}
