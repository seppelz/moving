/**
 * Analytics hook for tracking user behavior
 * Uses PostHog or Mixpanel (placeholder for now)
 */

interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
}

class Analytics {
  private enabled: boolean
  
  constructor() {
    this.enabled = import.meta.env.PROD // Only in production
  }
  
  track(event: string, properties?: Record<string, any>) {
    if (!this.enabled) {
      console.log('[Analytics]', event, properties)
      return
    }
    
    // TODO: Integrate with PostHog/Mixpanel
    // posthog.capture(event, properties)
    
    // For now, log to console
    console.log('[Analytics]', event, properties)
  }
  
  identify(userId: string, traits?: Record<string, any>) {
    if (!this.enabled) return
    
    // TODO: Integrate with PostHog/Mixpanel
    // posthog.identify(userId, traits)
  }
  
  page(name: string, properties?: Record<string, any>) {
    if (!this.enabled) return
    
    // TODO: Track page views
    // posthog.capture('$pageview', { page: name, ...properties })
  }
}

const analytics = new Analytics()

export function useAnalytics() {
  const trackCalculatorStarted = () => {
    analytics.track('calculator_started')
  }
  
  const trackStepCompleted = (step: number) => {
    analytics.track('step_completed', { step })
  }
  
  const trackQuoteCalculated = (minPrice: number, maxPrice: number, volume: number) => {
    analytics.track('quote_calculated', {
      min_price: minPrice,
      max_price: maxPrice,
      volume_m3: volume,
    })
  }
  
  const trackQuoteSubmitted = (quoteId: string) => {
    analytics.track('quote_submitted', { quote_id: quoteId })
  }
  
  const trackStepAbandoned = (step: number) => {
    analytics.track('step_abandoned', { step })
  }
  
  const trackServiceToggled = (service: string, enabled: boolean) => {
    analytics.track('service_toggled', { service, enabled })
  }
  
  const trackItemAdded = (itemName: string, category: string) => {
    analytics.track('item_added', { item_name: itemName, category })
  }
  
  return {
    trackCalculatorStarted,
    trackStepCompleted,
    trackQuoteCalculated,
    trackQuoteSubmitted,
    trackStepAbandoned,
    trackServiceToggled,
    trackItemAdded,
  }
}

export default analytics
